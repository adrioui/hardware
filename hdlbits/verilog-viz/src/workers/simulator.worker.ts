/// <reference lib="webworker" />

/**
 * Simulation Web Worker
 *
 * Runs the event-driven netlist simulator off the main thread.
 * Receives commands (init, setInputs, step, run, pause, reset) and
 * emits tick/paused/ready/error messages back to the main thread.
 */

import type { YosysNetlist } from '../core/rtl-converter';
import {
  initSimState, propagate, stepDff,
  makeConst, makeX,
  type SimState, type SimNetlist, type SignalValue,
} from '../core/simulator';

// ── Serialisable types ────────────────────────────────────────────────────────

/**
 * A signal snapshot serialised as an array of [netId, SignalValue] pairs so
 * it survives structured-clone through postMessage without losing Map entries.
 */
export type SerialSnapshot = [string | number, SignalValue][];

// ── Inbound commands ──────────────────────────────────────────────────────────

export interface InitCommand {
  type: 'init';
  netlist: YosysNetlist;
  moduleName: string;
}

export interface SetInputsCommand {
  type: 'setInputs';
  /**
   * Map from port name to bit string, e.g. `{ A: "1", B: "0110" }`.
   * Each bit string is passed to `makeConst`; an empty string drives `x`.
   */
  inputs: Record<string, string>;
}

export interface StepCommand {
  type: 'step';
  /** Number of clock cycles to advance. Defaults to 1. */
  count?: number;
}

export interface RunCommand {
  type: 'run';
  /** Clock cycles advanced per timer tick. Corresponds to 1×/10×/100× speed. Default 1. */
  stepsPerTick?: number;
  /** Milliseconds between timer ticks. Default 100. */
  intervalMs?: number;
}

export interface PauseCommand {
  type: 'pause';
}

export interface ResetCommand {
  type: 'reset';
}

export type WorkerCommand =
  | InitCommand
  | SetInputsCommand
  | StepCommand
  | RunCommand
  | PauseCommand
  | ResetCommand;

// ── Outbound messages ─────────────────────────────────────────────────────────

export interface ReadyMessage {
  type: 'ready';
  time: number;
  snapshot: SerialSnapshot;
}

export interface TickMessage {
  type: 'tick';
  time: number;
  snapshot: SerialSnapshot;
}

export interface PausedMessage {
  type: 'paused';
  time: number;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WorkerEvent =
  | ReadyMessage
  | TickMessage
  | PausedMessage
  | ErrorMessage;

// ── Helpers ───────────────────────────────────────────────────────────────────

function snapshotToSerial(signals: Map<string | number, SignalValue>): SerialSnapshot {
  return Array.from(signals.entries());
}

// ── Worker-level mutable state ────────────────────────────────────────────────

let simNetlist: SimNetlist | null = null;
let simState: SimState | null = null;
let currentInputs: Map<string, SignalValue> = new Map();
let runTimer: number | null = null;

const post = (msg: WorkerEvent): void => self.postMessage(msg);

function assertInit(): { state: SimState; netlist: SimNetlist } {
  if (!simState || !simNetlist) {
    throw new Error('Simulator not initialised — send an "init" command first');
  }
  return { state: simState, netlist: simNetlist };
}

function stopTimer(): void {
  if (runTimer !== null) {
    clearInterval(runTimer);
    runTimer = null;
  }
}

/**
 * Advance DFFs by `count` clock cycles and emit a tick after each step.
 */
function doStep(count: number): void {
  const { state, netlist } = assertInit();
  for (let i = 0; i < count; i++) {
    stepDff(state, netlist.module);
    post({
      type: 'tick',
      time: state.time,
      snapshot: snapshotToSerial(state.signals),
    });
  }
}

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerCommand>): void => {
  try {
    const cmd = event.data;

    switch (cmd.type) {
      // ── init ───────────────────────────────────────────────────────────────
      case 'init': {
        stopTimer();

        const { netlist, moduleName } = cmd;
        const module = netlist.modules[moduleName];
        if (!module) {
          throw new Error(`Module "${moduleName}" not found in netlist`);
        }

        simNetlist = { module, moduleName };
        simState = initSimState(simNetlist);
        currentInputs = new Map();

        post({
          type: 'ready',
          time: simState.time,
          snapshot: snapshotToSerial(simState.signals),
        });
        break;
      }

      // ── setInputs ──────────────────────────────────────────────────────────
      case 'setInputs': {
        const { state, netlist } = assertInit();

        for (const [portName, bitString] of Object.entries(cmd.inputs)) {
          const value = bitString.length > 0 ? makeConst(bitString) : makeX(1);
          currentInputs.set(portName, value);
        }

        propagate(state, currentInputs, netlist.module);

        post({
          type: 'tick',
          time: state.time,
          snapshot: snapshotToSerial(state.signals),
        });
        break;
      }

      // ── step ───────────────────────────────────────────────────────────────
      case 'step': {
        stopTimer(); // manual step cancels auto-run
        doStep(cmd.count ?? 1);
        break;
      }

      // ── run ────────────────────────────────────────────────────────────────
      case 'run': {
        const { netlist } = assertInit();
        if (runTimer !== null) break; // already running

        const stepsPerTick = cmd.stepsPerTick ?? 1;
        const intervalMs   = cmd.intervalMs ?? 100;

        runTimer = setInterval(() => {
          const s = simState;
          if (!s) return;
          for (let i = 0; i < stepsPerTick; i++) {
            stepDff(s, netlist.module);
          }
          post({
            type: 'tick',
            time: s.time,
            snapshot: snapshotToSerial(s.signals),
          });
        }, intervalMs) as unknown as number;
        break;
      }

      // ── pause ──────────────────────────────────────────────────────────────
      case 'pause': {
        stopTimer();
        const { state } = assertInit();
        post({ type: 'paused', time: state.time });
        break;
      }

      // ── reset ──────────────────────────────────────────────────────────────
      case 'reset': {
        stopTimer();

        if (!simNetlist) {
          throw new Error('Simulator not initialised — send an "init" command first');
        }

        simState = initSimState(simNetlist);
        currentInputs = new Map();

        post({
          type: 'ready',
          time: simState.time,
          snapshot: snapshotToSerial(simState.signals),
        });
        break;
      }

      // ── exhaustiveness guard ───────────────────────────────────────────────
      default: {
        const _exhaustive: never = cmd;
        void _exhaustive;
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message });
  }
};
