/// <reference lib="webworker" />

import { yosys2digitaljs } from 'yosys2digitaljs/core';
import type { Digitaljs } from 'yosys2digitaljs/core';

// ---------------------------------------------------------------------------
// Message protocol
// ---------------------------------------------------------------------------

export interface SynthesizeRequest {
  type: 'synthesize';
  source: string;
  topModule: string;
}

export interface LoadingMessage {
  type: 'loading';
  message: string;
}

export interface SynthesizingMessage {
  type: 'synthesizing';
  message: string;
}

export interface ResultMessage {
  type: 'result';
  netlist: Digitaljs.TopModule;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WorkerOutMessage =
  | LoadingMessage
  | SynthesizingMessage
  | ResultMessage
  | ErrorMessage;

// ---------------------------------------------------------------------------
// @yowasp/yosys minimal interface (loaded lazily from CDN)
// ---------------------------------------------------------------------------

interface YoWASPResult {
  /** Output files produced by the run (key = filename, value = Uint8Array) */
  files: Record<string, Uint8Array>;
}

interface YoWASPModule {
  runYosys(options: {
    args: string[];
    files: Record<string, Uint8Array>;
  }): Promise<YoWASPResult>;
}

// ---------------------------------------------------------------------------
// CDN URL — never imported at startup; only fetched on first "Synthesize"
// ---------------------------------------------------------------------------

const YOWASP_CDN = 'https://cdn.jsdelivr.net/npm/@yowasp/yosys/gen/bundle.js';

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

self.onmessage = async (event: MessageEvent<SynthesizeRequest>): Promise<void> => {
  const { source, topModule } = event.data;

  try {
    // --- Phase 1: lazy-load Yosys WASM from CDN ---
    const post = (msg: WorkerOutMessage) => self.postMessage(msg);

    post({ type: 'loading', message: 'Loading Yosys engine (~12 MB)…' });

    // Dynamic CDN import — intentionally bypasses bundler (@vite-ignore)
    const yowasp = await (
      import(/* @vite-ignore */ YOWASP_CDN) as Promise<unknown>
    ).then((mod) => {
      const m = mod as Record<string, unknown>;
      // The bundle may export runYosys directly or via a default export.
      const runYosys =
        (m['runYosys'] as YoWASPModule['runYosys'] | undefined) ??
        ((m['default'] as Record<string, unknown> | undefined)?.['runYosys'] as
          | YoWASPModule['runYosys']
          | undefined);
      if (typeof runYosys !== 'function') {
        throw new Error(
          '@yowasp/yosys bundle does not export runYosys — check CDN URL or bundle format',
        );
      }
      return { runYosys } satisfies YoWASPModule;
    });

    // --- Phase 2: synthesize ---
    post({ type: 'synthesizing', message: 'Synthesizing…' });

    const encoder = new TextEncoder();
    const script = [
      `read_verilog top.v`,
      `prep -top ${topModule}`,
      `write_json output.json`,
    ].join('\n');

    const result = await yowasp.runYosys({
      args: ['-p', script],
      files: { 'top.v': encoder.encode(source) },
    });

    const jsonBytes = result.files['output.json'];
    if (!jsonBytes) {
      throw new Error('Yosys did not produce output.json — synthesis may have failed');
    }

    const yosysOutput = JSON.parse(new TextDecoder().decode(jsonBytes)) as Parameters<
      typeof yosys2digitaljs
    >[0];

    const netlist = yosys2digitaljs(yosysOutput);

    post({ type: 'result', netlist });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', message } satisfies WorkerOutMessage);
  }
};
