import { useState, useRef, useCallback, useEffect } from 'react';
import type { YosysNetlist } from '../core/rtl-converter';
import type { SignalValue, SimHistory } from '../core/simulator';
import type {
  WorkerCommand,
  WorkerEvent,
  SerialSnapshot,
} from '../workers/simulator.worker';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Serialised snapshot (array of pairs) → Map, as required by SimHistory. */
function deserializeSnapshot(
  serial: SerialSnapshot,
): Map<string | number, SignalValue> {
  return new Map(serial);
}

export interface RunOptions {
  /** Clock cycles advanced per timer tick (1 = 1×, 10 = 10×, 100 = 100×). */
  stepsPerTick?: number;
  /** Milliseconds between timer ticks. Default 100. */
  intervalMs?: number;
}

export interface UseSimulationResult {
  // ── Controls ────────────────────────────────────────────────────────────────
  /** Advance simulation by `count` clock cycles (default 1). Cancels auto-run. */
  step: (count?: number) => void;
  /** Start auto-run at the given speed. */
  run: (options?: RunOptions) => void;
  /** Pause auto-run. Resolved when the worker sends 'paused'. */
  pause: () => void;
  /** Reset simulation to initial state; clears inputs and signal history. */
  reset: () => void;
  /**
   * Toggle a single-bit input port: '0' → '1', '1' → '0', 'x'/'z' → '0'.
   * For multi-bit ports use `setInput` with an explicit bit-string.
   */
  toggleInput: (portName: string) => void;
  /** Drive an input port to an explicit bit-string (e.g. "1010"). */
  setInput: (portName: string, bitString: string) => void;

  // ── State ───────────────────────────────────────────────────────────────────
  /**
   * Current signal values keyed by net-id.
   * Empty map before the worker sends 'ready'.
   */
  signals: Map<string | number, SignalValue>;
  /** Current simulation time (clock cycles elapsed). */
  time: number;
  /** Whether the auto-run timer is active inside the worker. */
  isRunning: boolean;
  /** True once the worker has sent its initial 'ready' message. */
  isReady: boolean;
  /** Record of every tick snapshot, suitable for WaveDrom / waveform panel. */
  signalHistory: SimHistory;
  /** Last error message from the worker, or null. */
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages a Simulation Web Worker that runs the event-driven netlist simulator.
 *
 * Lifecycle:
 *   - Spawns (or replaces) the worker whenever `netlist` / `moduleName` changes.
 *   - Terminates the worker on component unmount.
 *   - Tracks current signal state and full tick history on the main thread.
 *
 * @param netlist     Synthesised Yosys JSON netlist (from useSynthesis).
 * @param moduleName  Top-level module name to simulate.
 */
export function useSimulation(
  netlist: YosysNetlist | null,
  moduleName: string | null,
): UseSimulationResult {
  const [signals, setSignals] = useState<Map<string | number, SignalValue>>(
    new Map(),
  );
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [signalHistory, setSignalHistory] = useState<SimHistory>({
    snapshots: [],
    times: [],
  });
  const [error, setError] = useState<string | null>(null);

  /** Reference to the live worker instance. */
  const workerRef = useRef<Worker | null>(null);

  /**
   * Current main-thread copy of input bit-strings.
   * Kept as a ref so `toggleInput` / `setInput` can mutate it without
   * causing extra renders; a new `setInputs` command is sent each time.
   */
  const inputValuesRef = useRef<Map<string, string>>(new Map());

  // ── Stable post helper ─────────────────────────────────────────────────────

  const post = useCallback((cmd: WorkerCommand): void => {
    workerRef.current?.postMessage(cmd);
  }, []);

  // ── Message handler (stable — only uses state setters) ─────────────────────

  const handleMessage = useCallback(
    (event: MessageEvent<WorkerEvent>): void => {
      const msg = event.data;

      switch (msg.type) {
        case 'ready': {
          const snap = deserializeSnapshot(msg.snapshot);
          setIsReady(true);
          setIsRunning(false);
          setTime(msg.time);
          setSignals(snap);
          // Clear history on (re-)init / reset
          setSignalHistory({ snapshots: [], times: [] });
          setError(null);
          break;
        }

        case 'tick': {
          const snap = deserializeSnapshot(msg.snapshot);
          setTime(msg.time);
          setSignals(snap);
          setSignalHistory(prev => ({
            snapshots: [...prev.snapshots, snap],
            times: [...prev.times, msg.time],
          }));
          break;
        }

        case 'paused': {
          setIsRunning(false);
          setTime(msg.time);
          break;
        }

        case 'error': {
          setError(msg.message);
          setIsRunning(false);
          break;
        }

        default: {
          const _exhaustive: never = msg;
          void _exhaustive;
        }
      }
    },
    [], // state setters are stable references — no deps needed
  );

  // ── Worker lifecycle ───────────────────────────────────────────────────────

  useEffect(() => {
    // No netlist → tear down any existing worker
    if (!netlist || !moduleName) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsReady(false);
      setIsRunning(false);
      setSignals(new Map());
      setSignalHistory({ snapshots: [], times: [] });
      setTime(0);
      inputValuesRef.current = new Map();
      return;
    }

    // Terminate any previously running worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // Reset derived state while new worker initialises
    setIsReady(false);
    setIsRunning(false);
    setError(null);
    inputValuesRef.current = new Map();

    // Spawn worker
    const worker = new Worker(
      new URL('../workers/simulator.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = handleMessage;
    worker.onerror = (ev: ErrorEvent): void => {
      setError(ev.message ?? 'Simulation worker error');
      setIsRunning(false);
    };

    // Send init command
    worker.postMessage({
      type: 'init',
      netlist,
      moduleName,
    } satisfies WorkerCommand);

    return (): void => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [netlist, moduleName, handleMessage]);

  // ── Control callbacks ──────────────────────────────────────────────────────

  const step = useCallback(
    (count = 1): void => {
      setIsRunning(false); // worker cancels auto-run on 'step'
      post({ type: 'step', count });
    },
    [post],
  );

  const run = useCallback(
    (options?: RunOptions): void => {
      setIsRunning(true);
      post({
        type: 'run',
        stepsPerTick: options?.stepsPerTick,
        intervalMs: options?.intervalMs,
      });
    },
    [post],
  );

  const pause = useCallback((): void => {
    // isRunning cleared when 'paused' message arrives
    post({ type: 'pause' });
  }, [post]);

  const reset = useCallback((): void => {
    setIsRunning(false);
    inputValuesRef.current = new Map();
    post({ type: 'reset' });
  }, [post]);

  const setInput = useCallback(
    (portName: string, bitString: string): void => {
      inputValuesRef.current.set(portName, bitString);
      post({
        type: 'setInputs',
        inputs: Object.fromEntries(inputValuesRef.current),
      });
    },
    [post],
  );

  const toggleInput = useCallback(
    (portName: string): void => {
      const current = inputValuesRef.current.get(portName) ?? 'x';
      // Single-bit toggle: '1' → '0', everything else (including 'x') → '0' or '1'
      const next: string = current === '0' ? '1' : current === '1' ? '0' : '0';
      inputValuesRef.current.set(portName, next);
      post({
        type: 'setInputs',
        inputs: Object.fromEntries(inputValuesRef.current),
      });
    },
    [post],
  );

  return {
    step,
    run,
    pause,
    reset,
    toggleInput,
    setInput,
    signals,
    time,
    isRunning,
    isReady,
    signalHistory,
    error,
  };
}
