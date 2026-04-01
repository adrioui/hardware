/**
 * Event-driven simulator for Yosys JSON netlists.
 *
 * Zero-delay model: combinational logic settles instantly; DFFs update on the
 * rising edge of CLK when `step()` is called.
 */

import type { YosysModule, YosysCell, YosBit } from './rtl-converter';

// ── Signal value types ────────────────────────────────────────────────────────

export type Bit = '0' | '1' | 'x' | 'z';

export interface SignalValue {
  bits: Bit[];
  width: number;
}

// ── Sim event / state ─────────────────────────────────────────────────────────

export interface SimEvent {
  time: number;
  netId: number | string;
  value: Bit;
}

export interface SimState {
  signals: Map<string | number, SignalValue>;
  time: number;
  eventQueue: SimEvent[];
}

/** Snapshot of all signal values keyed by net-id, captured at each tick. */
export type SignalSnapshot = Map<string | number, SignalValue>;

export interface SimHistory {
  snapshots: SignalSnapshot[];
  times: number[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Create a SignalValue initialised to 'x'. */
export function makeX(width: number): SignalValue {
  return { bits: Array<Bit>(width).fill('x'), width };
}

/** Create a SignalValue from a constant bit string (e.g. "1010"). */
export function makeConst(bits: string): SignalValue {
  const b = bits.split('') as Bit[];
  return { bits: b, width: b.length };
}

/** Single-bit SignalValue. */
export function makeBit(b: Bit): SignalValue {
  return { bits: [b], width: 1 };
}

/** Convert a SignalValue to a JS BigInt for arithmetic.  'x'/'z' → 0n. */
function toInt(sv: SignalValue): bigint {
  let result = 0n;
  for (const b of sv.bits) {
    result = (result << 1n) | (b === '1' ? 1n : 0n);
  }
  return result;
}

/** Convert a BigInt back to a fixed-width SignalValue (unsigned, truncated). */
function fromInt(value: bigint, width: number): SignalValue {
  const bits: Bit[] = [];
  for (let i = width - 1; i >= 0; i--) {
    bits.push(((value >> BigInt(i)) & 1n) === 1n ? '1' : '0');
  }
  return { bits, width };
}

/** True if any bit in the vector is 'x' or 'z'. */
function hasUnknown(sv: SignalValue): boolean {
  return sv.bits.some(b => b === 'x' || b === 'z');
}

/**
 * Resolve a YosBit array (connections) into a SignalValue.
 * Numbers are net IDs looked up in `signals`; '0', '1', 'x', 'z' are constants.
 */
function resolveNet(
  connections: YosBit[],
  signals: Map<string | number, SignalValue>
): SignalValue {
  const bits: Bit[] = connections.map(b => {
    if (b === '0') return '0';
    if (b === '1') return '1';
    if (b === 'x') return 'x';
    if (b === 'z') return 'z';
    // numeric net id
    const sv = signals.get(b as number);
    if (!sv) return 'x';
    // single-bit net
    return sv.bits[0] ?? 'x';
  });
  return { bits, width: bits.length };
}

/** Write bits of `value` back to the per-bit net entries in `signals`. */
function driveNet(
  connections: YosBit[],
  value: SignalValue,
  signals: Map<string | number, SignalValue>
): void {
  for (let i = 0; i < connections.length; i++) {
    const netId = connections[i];
    if (typeof netId === 'number') {
      const bit: Bit = value.bits[i] ?? 'x';
      signals.set(netId, { bits: [bit], width: 1 });
    }
    // constant-driver nets ('0','1','x','z') are not writable
  }
}

// ── Cell evaluation functions ─────────────────────────────────────────────────

/** Bitwise AND — propagates 'x' unless one operand forces 0. */
export function evalAnd(a: SignalValue, b: SignalValue): SignalValue {
  const width = Math.max(a.width, b.width);
  const bits: Bit[] = [];
  for (let i = 0; i < width; i++) {
    const ai = a.bits[i] ?? '0';
    const bi = b.bits[i] ?? '0';
    if (ai === '0' || bi === '0') bits.push('0');
    else if (ai === '1' && bi === '1') bits.push('1');
    else bits.push('x');
  }
  return { bits, width };
}

/** Bitwise OR — propagates 'x' unless one operand forces 1. */
export function evalOr(a: SignalValue, b: SignalValue): SignalValue {
  const width = Math.max(a.width, b.width);
  const bits: Bit[] = [];
  for (let i = 0; i < width; i++) {
    const ai = a.bits[i] ?? '0';
    const bi = b.bits[i] ?? '0';
    if (ai === '1' || bi === '1') bits.push('1');
    else if (ai === '0' && bi === '0') bits.push('0');
    else bits.push('x');
  }
  return { bits, width };
}

/** Bitwise XOR. */
export function evalXor(a: SignalValue, b: SignalValue): SignalValue {
  const width = Math.max(a.width, b.width);
  const bits: Bit[] = [];
  for (let i = 0; i < width; i++) {
    const ai = a.bits[i] ?? '0';
    const bi = b.bits[i] ?? '0';
    if (ai === 'x' || ai === 'z' || bi === 'x' || bi === 'z') bits.push('x');
    else bits.push(ai !== bi ? '1' : '0');
  }
  return { bits, width };
}

/** Bitwise XNOR. */
export function evalXnor(a: SignalValue, b: SignalValue): SignalValue {
  const xored = evalXor(a, b);
  return evalNot(xored);
}

/** Bitwise NOT. */
export function evalNot(a: SignalValue): SignalValue {
  const bits: Bit[] = a.bits.map(b => {
    if (b === '0') return '1';
    if (b === '1') return '0';
    return 'x';
  });
  return { bits, width: a.width };
}

/** Bitwise NAND. */
export function evalNand(a: SignalValue, b: SignalValue): SignalValue {
  return evalNot(evalAnd(a, b));
}

/** Bitwise NOR. */
export function evalNor(a: SignalValue, b: SignalValue): SignalValue {
  return evalNot(evalOr(a, b));
}

/** BUF — identity. */
export function evalBuf(a: SignalValue): SignalValue {
  return { bits: [...a.bits], width: a.width };
}

/** Unsigned addition with output width. */
export function evalAdd(a: SignalValue, b: SignalValue, outWidth: number): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeX(outWidth);
  const result = toInt(a) + toInt(b);
  return fromInt(result, outWidth);
}

/** Unsigned subtraction (wrapping) with output width. */
export function evalSub(a: SignalValue, b: SignalValue, outWidth: number): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeX(outWidth);
  const mask = (1n << BigInt(outWidth)) - 1n;
  const result = (toInt(a) - toInt(b)) & mask;
  return fromInt(result, outWidth);
}

/** 2-to-1 MUX: sel=0 → A, sel=1 → B. */
export function evalMux(
  a: SignalValue,
  b: SignalValue,
  sel: SignalValue
): SignalValue {
  const s = sel.bits[0];
  if (s === '0') return { bits: [...a.bits], width: a.width };
  if (s === '1') return { bits: [...b.bits], width: b.width };
  // unknown select
  return makeX(a.width);
}

/** Equality comparison → 1-bit result. */
export function evalEq(a: SignalValue, b: SignalValue): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeBit('x');
  return makeBit(toInt(a) === toInt(b) ? '1' : '0');
}

/** Not-equal → 1-bit result. */
export function evalNe(a: SignalValue, b: SignalValue): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeBit('x');
  return makeBit(toInt(a) !== toInt(b) ? '1' : '0');
}

/** Less-than (unsigned) → 1-bit result. */
export function evalLt(a: SignalValue, b: SignalValue): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeBit('x');
  return makeBit(toInt(a) < toInt(b) ? '1' : '0');
}

/** Less-than-or-equal (unsigned) → 1-bit result. */
export function evalLe(a: SignalValue, b: SignalValue): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeBit('x');
  return makeBit(toInt(a) <= toInt(b) ? '1' : '0');
}

/** Greater-than (unsigned) → 1-bit result. */
export function evalGt(a: SignalValue, b: SignalValue): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeBit('x');
  return makeBit(toInt(a) > toInt(b) ? '1' : '0');
}

/** Greater-than-or-equal (unsigned) → 1-bit result. */
export function evalGe(a: SignalValue, b: SignalValue): SignalValue {
  if (hasUnknown(a) || hasUnknown(b)) return makeBit('x');
  return makeBit(toInt(a) >= toInt(b) ? '1' : '0');
}

/** Reduce-AND: 1 only if all bits are '1'. */
export function evalReduceAnd(a: SignalValue): SignalValue {
  if (a.bits.some(b => b === 'x' || b === 'z')) return makeBit('x');
  return makeBit(a.bits.every(b => b === '1') ? '1' : '0');
}

/** Reduce-OR: 1 if any bit is '1'. */
export function evalReduceOr(a: SignalValue): SignalValue {
  if (a.bits.some(b => b === '1')) return makeBit('1');
  if (a.bits.some(b => b === 'x' || b === 'z')) return makeBit('x');
  return makeBit('0');
}

/** Reduce-XOR: parity. */
export function evalReduceXor(a: SignalValue): SignalValue {
  if (a.bits.some(b => b === 'x' || b === 'z')) return makeBit('x');
  let parity: Bit = '0';
  for (const b of a.bits) {
    parity = b !== parity ? '1' : '0';
  }
  return makeBit(parity);
}

/** Reduce-BOOL: 1 if any bit is '1' (same as reduce_or). */
export function evalReduceBool(a: SignalValue): SignalValue {
  return evalReduceOr(a);
}

/** Logic NOT: 0 if any bit is 1, else 1 (x if unknown). */
export function evalLogicNot(a: SignalValue): SignalValue {
  const anyOne = a.bits.some(b => b === '1');
  if (anyOne) return makeBit('0');
  if (a.bits.some(b => b === 'x' || b === 'z')) return makeBit('x');
  return makeBit('1');
}

/** Logic AND: both operands treated as booleans. */
export function evalLogicAnd(a: SignalValue, b: SignalValue): SignalValue {
  const aTrue = a.bits.some(b => b === '1');
  const bTrue = b.bits.some(b => b === '1');
  if (aTrue && bTrue) return makeBit('1');
  if (!aTrue && a.bits.every(b => b === '0') ||
      !bTrue && b.bits.every(b => b === '0')) return makeBit('0');
  return makeBit('x');
}

/** Logic OR: both operands treated as booleans. */
export function evalLogicOr(a: SignalValue, b: SignalValue): SignalValue {
  const aTrue = a.bits.some(b => b === '1');
  const bTrue = b.bits.some(b => b === '1');
  if (aTrue || bTrue) return makeBit('1');
  if (a.bits.every(b => b === '0') && b.bits.every(b => b === '0')) return makeBit('0');
  return makeBit('x');
}

// ── Evaluate one cell ─────────────────────────────────────────────────────────

/**
 * Evaluate a single Yosys cell given the current signal state.
 * Returns the output SignalValue(s) keyed by output port name.
 * DFFs return null for Y (they only update on clock edge via `stepDff`).
 */
export function evalCell(
  cell: YosysCell,
  signals: Map<string | number, SignalValue>
): Record<string, SignalValue> | null {
  const get = (port: string): SignalValue =>
    resolveNet(cell.connections[port] ?? [], signals);

  const outWidth = (port: string): number =>
    (cell.connections[port] ?? []).length || 1;

  const type = cell.type;

  // ── Bitwise gates ──────────────────────────────────────────────────────────
  if (type === '$and')  return { Y: evalAnd(get('A'), get('B')) };
  if (type === '$or')   return { Y: evalOr(get('A'), get('B')) };
  if (type === '$xor')  return { Y: evalXor(get('A'), get('B')) };
  if (type === '$xnor') return { Y: evalXnor(get('A'), get('B')) };
  if (type === '$not')  return { Y: evalNot(get('A')) };
  if (type === '$nand') return { Y: evalNand(get('A'), get('B')) };
  if (type === '$nor')  return { Y: evalNor(get('A'), get('B')) };
  if (type === '$buf')  return { Y: evalBuf(get('A')) };

  // ── Logic gates ────────────────────────────────────────────────────────────
  if (type === '$logic_not') return { Y: evalLogicNot(get('A')) };
  if (type === '$logic_and') return { Y: evalLogicAnd(get('A'), get('B')) };
  if (type === '$logic_or')  return { Y: evalLogicOr(get('A'), get('B')) };

  // ── Reduction ──────────────────────────────────────────────────────────────
  if (type === '$reduce_and')  return { Y: evalReduceAnd(get('A')) };
  if (type === '$reduce_or')   return { Y: evalReduceOr(get('A')) };
  if (type === '$reduce_xor')  return { Y: evalReduceXor(get('A')) };
  if (type === '$reduce_xnor') return { Y: evalNot(evalReduceXor(get('A'))) };
  if (type === '$reduce_bool') return { Y: evalReduceBool(get('A')) };

  // ── Arithmetic ─────────────────────────────────────────────────────────────
  if (type === '$add') return { Y: evalAdd(get('A'), get('B'), outWidth('Y')) };
  if (type === '$sub') return { Y: evalSub(get('A'), get('B'), outWidth('Y')) };

  // ── Comparison ─────────────────────────────────────────────────────────────
  if (type === '$eq') return { Y: evalEq(get('A'), get('B')) };
  if (type === '$ne') return { Y: evalNe(get('A'), get('B')) };
  if (type === '$lt') return { Y: evalLt(get('A'), get('B')) };
  if (type === '$le') return { Y: evalLe(get('A'), get('B')) };
  if (type === '$gt') return { Y: evalGt(get('A'), get('B')) };
  if (type === '$ge') return { Y: evalGe(get('A'), get('B')) };

  // ── MUX ───────────────────────────────────────────────────────────────────
  if (type === '$mux') return { Y: evalMux(get('A'), get('B'), get('S')) };

  // ── DFF (output handled separately in stepDff) ────────────────────────────
  if (
    type === '$dff' || type === '$adff' || type === '$sdff' ||
    type === '$dffe' || type === '$adffe' || type === '$sdffe' ||
    type === '$sdffce' || type === '$ff'
  ) {
    return null; // updated by stepDff
  }

  // Unknown cell type
  return null;
}

// ── Netlist-level simulation ──────────────────────────────────────────────────

export interface SimNetlist {
  module: YosysModule;
  moduleName: string;
}

/**
 * Initialise a SimState from a Yosys module.
 * All nets start at 'x'; constant-driver bits are resolved immediately.
 */
export function initSimState(netlist: SimNetlist): SimState {
  const signals = new Map<string | number, SignalValue>();

  // Collect all net IDs
  const { module } = netlist;

  for (const port of Object.values(module.ports)) {
    for (const bit of port.bits) {
      if (typeof bit === 'number') {
        signals.set(bit, makeBit('x'));
      }
    }
  }
  for (const cell of Object.values(module.cells)) {
    for (const conn of Object.values(cell.connections)) {
      for (const bit of conn) {
        if (typeof bit === 'number') {
          signals.set(bit, makeBit('x'));
        }
      }
    }
  }

  return { signals, time: 0, eventQueue: [] };
}

/**
 * Drive top-level input ports with given values and propagate combinational
 * logic until stable (up to `maxIter` iterations).
 *
 * @param state   Mutable sim state (modified in-place).
 * @param inputs  Map from port name → SignalValue.
 * @param module  Yosys module description.
 * @param maxIter Guard against combinational loops (default 100).
 */
export function propagate(
  state: SimState,
  inputs: Map<string, SignalValue>,
  module: YosysModule,
  maxIter = 100
): void {
  // Write input port values into signals
  for (const [portName, value] of inputs) {
    const port = module.ports[portName];
    if (!port) continue;
    driveNet(port.bits, value, state.signals);
  }

  // Iterative combinational propagation
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    for (const cell of Object.values(module.cells)) {
      const result = evalCell(cell, state.signals);
      if (!result) continue;

      for (const [portName, value] of Object.entries(result)) {
        const conns = cell.connections[portName];
        if (!conns) continue;

        for (let i = 0; i < conns.length; i++) {
          const netId = conns[i];
          if (typeof netId !== 'number') continue;
          const existing = state.signals.get(netId);
          const newBit: Bit = value.bits[i] ?? 'x';
          if (!existing || existing.bits[0] !== newBit) {
            state.signals.set(netId, { bits: [newBit], width: 1 });
            changed = true;
          }
        }
      }
    }

    if (!changed) break;
  }
}

/**
 * Advance DFFs by one clock cycle: capture D inputs → drive Q outputs,
 * then re-propagate combinational logic.
 */
export function stepDff(
  state: SimState,
  module: YosysModule
): void {
  // First pass: capture D values for all DFFs
  const captures: Array<{ cell: YosysCell; dValue: SignalValue }> = [];

  for (const cell of Object.values(module.cells)) {
    const isDff =
      cell.type === '$dff' || cell.type === '$adff' || cell.type === '$sdff' ||
      cell.type === '$dffe' || cell.type === '$adffe' || cell.type === '$sdffe' ||
      cell.type === '$sdffce' || cell.type === '$ff';

    if (!isDff) continue;

    // For $dffe, check enable (EN port)
    if ((cell.type === '$dffe' || cell.type === '$adffe' || cell.type === '$sdffe' || cell.type === '$sdffce') &&
        cell.connections['EN']) {
      const en = resolveNet(cell.connections['EN'], state.signals);
      if (en.bits[0] !== '1') continue; // not enabled
    }

    const d = resolveNet(cell.connections['D'] ?? [], state.signals);
    captures.push({ cell, dValue: d });
  }

  // Second pass: drive Q outputs
  for (const { cell, dValue } of captures) {
    driveNet(cell.connections['Q'] ?? [], dValue, state.signals);
  }

  state.time++;

  // Re-propagate combinational logic after DFF outputs change
  propagate(state, new Map(), module);
}

/**
 * Read the current value of an output port from state.
 */
export function readOutput(
  portName: string,
  module: YosysModule,
  state: SimState
): SignalValue {
  const port = module.ports[portName];
  if (!port) return makeX(1);
  return resolveNet(port.bits, state.signals);
}
