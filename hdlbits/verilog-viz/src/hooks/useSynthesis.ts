import { useState, useRef, useCallback } from 'react';
import type { WorkerOutMessage, ResultMessage } from '../workers/yosys.worker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SynthesisStatus = 'idle' | 'loading' | 'synthesizing' | 'done' | 'error';

/** Shape of a cached synthesis result */
interface CachedResult {
  source: string;
  topModule: string;
  netlist: ResultMessage['netlist'];
}

export interface UseSynthesisResult {
  /** Trigger synthesis for the given Verilog source + top module name */
  synthesize: (source: string, topModule: string) => void;
  /** Synthesized netlist (DigitalJS TopModule), or null if not yet available */
  netlist: ResultMessage['netlist'] | null;
  /** Current lifecycle state */
  status: SynthesisStatus;
  /** Human-readable progress/error message — suitable for StatusBar */
  statusMessage: string;
  /** Error message when status === 'error', otherwise null */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the Yosys Web Worker lifecycle.
 *
 * - Lazily creates the worker on first `synthesize()` call.
 * - Terminates any in-flight worker before starting a new run.
 * - Caches the last successful result; re-uses it if source + topModule are
 *   unchanged (user clicked "Synthesize" again without editing).
 * - Surfaces progress messages for the StatusBar via `statusMessage`.
 */
export function useSynthesis(): UseSynthesisResult {
  const [status, setStatus] = useState<SynthesisStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [netlist, setNetlist] = useState<ResultMessage['netlist'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Reference to the active worker (terminated on each new run). */
  const workerRef = useRef<Worker | null>(null);

  /** Cache of the last successful synthesis so we can skip redundant runs. */
  const cacheRef = useRef<CachedResult | null>(null);

  const synthesize = useCallback((source: string, topModule: string) => {
    // --- Cache hit: identical input → surface existing netlist immediately ---
    const cached = cacheRef.current;
    if (
      cached &&
      cached.source === source &&
      cached.topModule === topModule
    ) {
      setNetlist(cached.netlist);
      setStatus('done');
      setStatusMessage('Synthesis complete (cached)');
      setError(null);
      return;
    }

    // --- Terminate any in-flight worker ---
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // --- Reset state ---
    setError(null);
    setStatus('loading');
    setStatusMessage('Loading Yosys engine…');

    // --- Spawn new worker ---
    const worker = new Worker(
      new URL('../workers/yosys.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'loading':
          setStatus('loading');
          setStatusMessage(msg.message);
          break;

        case 'synthesizing':
          setStatus('synthesizing');
          setStatusMessage(msg.message);
          break;

        case 'result':
          // Persist to cache
          cacheRef.current = { source, topModule, netlist: msg.netlist };
          setNetlist(msg.netlist);
          setStatus('done');
          setStatusMessage('Synthesis complete');
          setError(null);
          // Worker job done — clean up
          worker.terminate();
          workerRef.current = null;
          break;

        case 'error':
          setStatus('error');
          setStatusMessage(`Synthesis error: ${msg.message}`);
          setError(msg.message);
          worker.terminate();
          workerRef.current = null;
          break;

        default: {
          // Exhaustive check
          const _exhaustive: never = msg;
          console.warn('useSynthesis: unknown worker message', _exhaustive);
        }
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      const message = event.message ?? 'Worker error';
      setStatus('error');
      setStatusMessage(`Worker error: ${message}`);
      setError(message);
      worker.terminate();
      workerRef.current = null;
    };

    // --- Kick off synthesis ---
    worker.postMessage({ type: 'synthesize', source, topModule });
  }, []);

  return { synthesize, netlist, status, statusMessage, error };
}
