/**
 * Unit tests for src/core/simulator.ts
 *
 * Covers:
 *  - AND gate (cell evaluation)
 *  - MUX (select logic)
 *  - DFF (clock-edge capture)
 *  - Full adder (sum + carry propagation)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evalAnd, evalOr, evalXor, evalNot, evalMux,
  evalAdd, evalSub, evalEq, evalLt, evalGt,
  evalReduceAnd, evalReduceOr,
  makeX, makeConst, makeBit,
  initSimState, propagate, stepDff, readOutput,
  type SignalValue, type Bit,
} from '../src/core/simulator';
import type { YosysNetlist, YosysModule } from '../src/core/rtl-converter';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sv(bits: string): SignalValue {
  return makeConst(bits);
}

function bit(b: Bit): SignalValue {
  return makeBit(b);
}

// ── AND gate cell evaluation ──────────────────────────────────────────────────

describe('evalAnd', () => {
  it('1 & 1 = 1', () => {
    expect(evalAnd(sv('1'), sv('1')).bits).toEqual(['1']);
  });
  it('1 & 0 = 0', () => {
    expect(evalAnd(sv('1'), sv('0')).bits).toEqual(['0']);
  });
  it('0 & 0 = 0', () => {
    expect(evalAnd(sv('0'), sv('0')).bits).toEqual(['0']);
  });
  it('x & 1 = x', () => {
    expect(evalAnd(bit('x'), sv('1')).bits).toEqual(['x']);
  });
  it('x & 0 = 0  (x forced low)', () => {
    expect(evalAnd(bit('x'), sv('0')).bits).toEqual(['0']);
  });
  it('multi-bit: 1010 & 1100 = 1000', () => {
    expect(evalAnd(sv('1010'), sv('1100')).bits).toEqual(['1','0','0','0']);
  });
});

describe('evalOr', () => {
  it('0 | 0 = 0', () => {
    expect(evalOr(sv('0'), sv('0')).bits).toEqual(['0']);
  });
  it('1 | 0 = 1', () => {
    expect(evalOr(sv('1'), sv('0')).bits).toEqual(['1']);
  });
  it('x | 1 = 1  (x forced high)', () => {
    expect(evalOr(bit('x'), sv('1')).bits).toEqual(['1']);
  });
  it('x | 0 = x', () => {
    expect(evalOr(bit('x'), sv('0')).bits).toEqual(['x']);
  });
});

describe('evalXor', () => {
  it('0 ^ 0 = 0', () => {
    expect(evalXor(sv('0'), sv('0')).bits).toEqual(['0']);
  });
  it('1 ^ 0 = 1', () => {
    expect(evalXor(sv('1'), sv('0')).bits).toEqual(['1']);
  });
  it('1 ^ 1 = 0', () => {
    expect(evalXor(sv('1'), sv('1')).bits).toEqual(['0']);
  });
  it('x ^ 0 = x', () => {
    expect(evalXor(bit('x'), sv('0')).bits).toEqual(['x']);
  });
});

describe('evalNot', () => {
  it('~0 = 1', () => {
    expect(evalNot(sv('0')).bits).toEqual(['1']);
  });
  it('~1 = 0', () => {
    expect(evalNot(sv('1')).bits).toEqual(['0']);
  });
  it('~x = x', () => {
    expect(evalNot(bit('x')).bits).toEqual(['x']);
  });
  it('multi-bit ~1010 = 0101', () => {
    expect(evalNot(sv('1010')).bits).toEqual(['0','1','0','1']);
  });
});

// ── MUX ──────────────────────────────────────────────────────────────────────

describe('evalMux', () => {
  it('sel=0 → A', () => {
    expect(evalMux(sv('1010'), sv('0101'), sv('0')).bits).toEqual(['1','0','1','0']);
  });
  it('sel=1 → B', () => {
    expect(evalMux(sv('1010'), sv('0101'), sv('1')).bits).toEqual(['0','1','0','1']);
  });
  it('sel=x → x', () => {
    const result = evalMux(sv('1'), sv('0'), bit('x'));
    expect(result.bits).toEqual(['x']);
  });
  it('single-bit sel=0 passes A=0', () => {
    expect(evalMux(sv('0'), sv('1'), sv('0')).bits).toEqual(['0']);
  });
  it('single-bit sel=1 passes B=1', () => {
    expect(evalMux(sv('0'), sv('1'), sv('1')).bits).toEqual(['1']);
  });
});

// ── Arithmetic ────────────────────────────────────────────────────────────────

describe('evalAdd', () => {
  it('0 + 0 = 0 (2-bit)', () => {
    expect(evalAdd(sv('00'), sv('00'), 2).bits).toEqual(['0','0']);
  });
  it('01 + 01 = 10 (2-bit)', () => {
    expect(evalAdd(sv('01'), sv('01'), 2).bits).toEqual(['1','0']);
  });
  it('x + 0 = x', () => {
    expect(evalAdd(makeX(4), sv('0000'), 4).bits).toEqual(['x','x','x','x']);
  });
});

describe('evalSub', () => {
  it('10 - 01 = 01 (2-bit)', () => {
    expect(evalSub(sv('10'), sv('01'), 2).bits).toEqual(['0','1']);
  });
  it('00 - 01 wraps (2-bit) = 11', () => {
    expect(evalSub(sv('00'), sv('01'), 2).bits).toEqual(['1','1']);
  });
});

// ── Comparison ────────────────────────────────────────────────────────────────

describe('evalEq / evalLt / evalGt', () => {
  it('01 == 01 → 1', () => {
    expect(evalEq(sv('01'), sv('01')).bits).toEqual(['1']);
  });
  it('01 == 10 → 0', () => {
    expect(evalEq(sv('01'), sv('10')).bits).toEqual(['0']);
  });
  it('01 < 10 → 1', () => {
    expect(evalLt(sv('01'), sv('10')).bits).toEqual(['1']);
  });
  it('10 < 01 → 0', () => {
    expect(evalLt(sv('10'), sv('01')).bits).toEqual(['0']);
  });
  it('10 > 01 → 1', () => {
    expect(evalGt(sv('10'), sv('01')).bits).toEqual(['1']);
  });
  it('x == 01 → x', () => {
    expect(evalEq(makeX(2), sv('01')).bits).toEqual(['x']);
  });
});

// ── Reduction ─────────────────────────────────────────────────────────────────

describe('evalReduceAnd', () => {
  it('1111 → 1', () => {
    expect(evalReduceAnd(sv('1111')).bits).toEqual(['1']);
  });
  it('1110 → 0', () => {
    expect(evalReduceAnd(sv('1110')).bits).toEqual(['0']);
  });
  it('11x1 → x', () => {
    const sv2: SignalValue = { bits: ['1','1','x','1'], width: 4 };
    expect(evalReduceAnd(sv2).bits).toEqual(['x']);
  });
});

describe('evalReduceOr', () => {
  it('0000 → 0', () => {
    expect(evalReduceOr(sv('0000')).bits).toEqual(['0']);
  });
  it('0010 → 1', () => {
    expect(evalReduceOr(sv('0010')).bits).toEqual(['1']);
  });
  it('000x → x', () => {
    const sv2: SignalValue = { bits: ['0','0','0','x'], width: 4 };
    expect(evalReduceOr(sv2).bits).toEqual(['x']);
  });
});

// ── DFF (clock-edge capture) ──────────────────────────────────────────────────

/**
 * Simple DFF netlist:
 *   input D (net 2), input CLK (net 3) [ignored in zero-delay model]
 *   output Q (net 4)
 *   one $dff cell: D→Q
 */
function dffModule(): YosysModule {
  return {
    ports: {
      D:   { direction: 'input',  bits: [2] },
      CLK: { direction: 'input',  bits: [3] },
      Q:   { direction: 'output', bits: [4] },
    },
    cells: {
      ff1: {
        type: '$dff',
        port_directions: { CLK: 'input', D: 'input', Q: 'output' },
        connections: { CLK: [3], D: [2], Q: [4] },
      },
    },
  };
}

describe('DFF simulation', () => {
  it('Q stays x before any step', () => {
    const mod = dffModule();
    const state = initSimState({ module: mod, moduleName: 'dff' });
    propagate(state, new Map([['D', sv('1')]]), mod);
    const q = readOutput('Q', mod, state);
    expect(q.bits[0]).toBe('x');
  });

  it('Q captures D on first step', () => {
    const mod = dffModule();
    const state = initSimState({ module: mod, moduleName: 'dff' });
    propagate(state, new Map([['D', sv('1')]]), mod);
    stepDff(state, mod);
    const q = readOutput('Q', mod, state);
    expect(q.bits[0]).toBe('1');
  });

  it('Q captures updated D on second step', () => {
    const mod = dffModule();
    const state = initSimState({ module: mod, moduleName: 'dff' });
    propagate(state, new Map([['D', sv('1')]]), mod);
    stepDff(state, mod);
    propagate(state, new Map([['D', sv('0')]]), mod);
    stepDff(state, mod);
    const q = readOutput('Q', mod, state);
    expect(q.bits[0]).toBe('0');
  });

  it('Q holds value when D unchanged', () => {
    const mod = dffModule();
    const state = initSimState({ module: mod, moduleName: 'dff' });
    propagate(state, new Map([['D', sv('1')]]), mod);
    stepDff(state, mod);
    stepDff(state, mod); // second step — D still '1'
    const q = readOutput('Q', mod, state);
    expect(q.bits[0]).toBe('1');
  });

  it('time increments with each step', () => {
    const mod = dffModule();
    const state = initSimState({ module: mod, moduleName: 'dff' });
    expect(state.time).toBe(0);
    stepDff(state, mod);
    expect(state.time).toBe(1);
    stepDff(state, mod);
    expect(state.time).toBe(2);
  });
});

// ── Full adder ────────────────────────────────────────────────────────────────

/**
 * Full adder using Yosys primitives:
 *   sum  = a ^ b ^ cin
 *   cout = (a & b) | (cin & (a ^ b))
 *
 * Net assignments:
 *   2=a, 3=b, 4=cin
 *   5 = a ^ b
 *   6 = a & b
 *   7 = cin & (a^b)   i.e. cin & net5
 *   8 = net6 | net7   = cout
 *   9 = net5 ^ cin    = sum
 */
function fullAdderModule(): YosysModule {
  return {
    ports: {
      a:   { direction: 'input',  bits: [2] },
      b:   { direction: 'input',  bits: [3] },
      cin: { direction: 'input',  bits: [4] },
      sum: { direction: 'output', bits: [9] },
      cout:{ direction: 'output', bits: [8] },
    },
    cells: {
      xor_ab: {
        type: '$xor',
        port_directions: { A: 'input', B: 'input', Y: 'output' },
        connections: { A: [2], B: [3], Y: [5] },
      },
      and_ab: {
        type: '$and',
        port_directions: { A: 'input', B: 'input', Y: 'output' },
        connections: { A: [2], B: [3], Y: [6] },
      },
      and_cin_xorab: {
        type: '$and',
        port_directions: { A: 'input', B: 'input', Y: 'output' },
        connections: { A: [4], B: [5], Y: [7] },
      },
      or_cout: {
        type: '$or',
        port_directions: { A: 'input', B: 'input', Y: 'output' },
        connections: { A: [6], B: [7], Y: [8] },
      },
      xor_sum: {
        type: '$xor',
        port_directions: { A: 'input', B: 'input', Y: 'output' },
        connections: { A: [5], B: [4], Y: [9] },
      },
    },
  };
}

type FA = { sum: Bit; cout: Bit };

function runFA(a: Bit, b: Bit, cin: Bit): FA {
  const mod = fullAdderModule();
  const state = initSimState({ module: mod, moduleName: 'full_adder' });
  propagate(state, new Map([
    ['a', makeBit(a)],
    ['b', makeBit(b)],
    ['cin', makeBit(cin)],
  ]), mod);
  return {
    sum:  readOutput('sum',  mod, state).bits[0] as Bit,
    cout: readOutput('cout', mod, state).bits[0] as Bit,
  };
}

describe('Full adder', () => {
  it('0+0+0 = sum=0 cout=0', () => {
    expect(runFA('0','0','0')).toEqual({ sum: '0', cout: '0' });
  });
  it('1+0+0 = sum=1 cout=0', () => {
    expect(runFA('1','0','0')).toEqual({ sum: '1', cout: '0' });
  });
  it('0+1+0 = sum=1 cout=0', () => {
    expect(runFA('0','1','0')).toEqual({ sum: '1', cout: '0' });
  });
  it('1+1+0 = sum=0 cout=1', () => {
    expect(runFA('1','1','0')).toEqual({ sum: '0', cout: '1' });
  });
  it('0+0+1 = sum=1 cout=0', () => {
    expect(runFA('0','0','1')).toEqual({ sum: '1', cout: '0' });
  });
  it('1+0+1 = sum=0 cout=1', () => {
    expect(runFA('1','0','1')).toEqual({ sum: '0', cout: '1' });
  });
  it('0+1+1 = sum=0 cout=1', () => {
    expect(runFA('0','1','1')).toEqual({ sum: '0', cout: '1' });
  });
  it('1+1+1 = sum=1 cout=1', () => {
    expect(runFA('1','1','1')).toEqual({ sum: '1', cout: '1' });
  });
  it('unknown input propagates x to output', () => {
    const r = runFA('x','0','0');
    // a^b with a=x is x; sum = x^cin = x^0 = x
    expect(r.sum).toBe('x');
  });
});
