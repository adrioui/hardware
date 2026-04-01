/**
 * Tests for Yosys JSON netlist → React Flow converter (rtl-converter.ts)
 */

import { describe, it, expect } from 'vitest';
import {
  getRtlNodeType,
  getOperatorLabel,
  portNodeId,
  convertNetlistToFlow,
} from '../src/core/rtl-converter';
import type { YosysNetlist, YosysModule, RtlNodeType } from '../src/core/rtl-converter';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a 1-bit AND gate netlist with two inputs and one output. */
function andGateNetlist(): YosysNetlist {
  return {
    modules: {
      top: {
        ports: {
          a: { direction: 'input', bits: [2] },
          b: { direction: 'input', bits: [3] },
          y: { direction: 'output', bits: [4] },
        },
        cells: {
          '$and$top.v:1$1': {
            type: '$and',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: [2], B: [3], Y: [4] },
          },
        },
      },
    },
  };
}

/** Build a full adder netlist: $xor + $and + $or for sum/carry. */
function fullAdderNetlist(): YosysNetlist {
  return {
    modules: {
      full_adder: {
        ports: {
          a:   { direction: 'input',  bits: [2] },
          b:   { direction: 'input',  bits: [3] },
          cin: { direction: 'input',  bits: [4] },
          sum: { direction: 'output', bits: [9] },
          cout:{ direction: 'output', bits: [10] },
        },
        cells: {
          '$xor$0': {
            type: '$xor',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: [2], B: [3], Y: [5] },
          },
          '$xor$1': {
            type: '$xor',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: [5], B: [4], Y: [9] },
          },
          '$and$0': {
            type: '$and',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: [2], B: [3], Y: [6] },
          },
          '$and$1': {
            type: '$and',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: [5], B: [4], Y: [7] },
          },
          '$or$0': {
            type: '$or',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: [6], B: [7], Y: [10] },
          },
        },
        netnames: {
          a:    { bits: [2] },
          b:    { bits: [3] },
          cin:  { bits: [4] },
          ab:   { bits: [5] },
          sum:  { bits: [9] },
          cout: { bits: [10] },
        },
      },
    },
  };
}

/** Build a DFF netlist. */
function dffNetlist(): YosysNetlist {
  return {
    modules: {
      reg1: {
        ports: {
          clk: { direction: 'input',  bits: [2] },
          d:   { direction: 'input',  bits: [3] },
          q:   { direction: 'output', bits: [4] },
        },
        cells: {
          '$dff$0': {
            type: '$dff',
            port_directions: { CLK: 'input', D: 'input', Q: 'output' },
            connections: { CLK: [2], D: [3], Q: [4] },
          },
        },
      },
    },
  };
}

/** Build a MUX netlist. */
function muxNetlist(): YosysNetlist {
  return {
    modules: {
      mux2: {
        ports: {
          a:   { direction: 'input',  bits: [2] },
          b:   { direction: 'input',  bits: [3] },
          sel: { direction: 'input',  bits: [4] },
          y:   { direction: 'output', bits: [5] },
        },
        cells: {
          '$mux$0': {
            type: '$mux',
            port_directions: { A: 'input', B: 'input', S: 'input', Y: 'output' },
            connections: { A: [2], B: [3], S: [4], Y: [5] },
          },
        },
      },
    },
  };
}

/** Build an adder netlist with multi-bit ports. */
function adderNetlist(width = 4): YosysNetlist {
  const aBits = Array.from({ length: width }, (_, i) => i + 2);
  const bBits = Array.from({ length: width }, (_, i) => i + 2 + width);
  const yBits = Array.from({ length: width }, (_, i) => i + 2 + width * 2);
  return {
    modules: {
      adder: {
        ports: {
          a: { direction: 'input',  bits: aBits },
          b: { direction: 'input',  bits: bBits },
          y: { direction: 'output', bits: yBits },
        },
        cells: {
          '$add$0': {
            type: '$add',
            port_directions: { A: 'input', B: 'input', Y: 'output' },
            connections: { A: aBits, B: bBits, Y: yBits },
          },
        },
      },
    },
  };
}

// ── getRtlNodeType ─────────────────────────────────────────────────────────────

describe('getRtlNodeType', () => {
  const cases: Array<[string, RtlNodeType]> = [
    ['$add',  'operator'],
    ['$sub',  'operator'],
    ['$mul',  'operator'],
    ['$div',  'operator'],
    ['$mod',  'operator'],
    ['$eq',   'operator'],
    ['$ne',   'operator'],
    ['$lt',   'operator'],
    ['$le',   'operator'],
    ['$gt',   'operator'],
    ['$ge',   'operator'],
    ['$mux',  'mux'],
    ['$pmux', 'mux'],
    ['$dff',  'dff'],
    ['$adff', 'dff'],
    ['$sdff', 'dff'],
    ['$dffe', 'dff'],
    ['$ff',   'dff'],
    ['$and',  'gate'],
    ['$or',   'gate'],
    ['$not',  'gate'],
    ['$xor',  'gate'],
    ['$xnor', 'gate'],
    ['$nand', 'gate'],
    ['$nor',  'gate'],
    ['$buf',  'gate'],
    ['$reduce_and', 'gate'],
    ['$const', 'constant'],
    ['$someRandomCell', 'unknown'],
  ];

  for (const [cellType, expected] of cases) {
    it(`maps "${cellType}" → "${expected}"`, () => {
      expect(getRtlNodeType(cellType)).toBe(expected);
    });
  }
});

// ── getOperatorLabel ──────────────────────────────────────────────────────────

describe('getOperatorLabel', () => {
  it('returns "+" for $add', () => expect(getOperatorLabel('$add')).toBe('+'));
  it('returns "−" for $sub', () => expect(getOperatorLabel('$sub')).toBe('−'));
  it('returns "×" for $mul', () => expect(getOperatorLabel('$mul')).toBe('×'));
  it('returns "MUX" for $mux', () => expect(getOperatorLabel('$mux')).toBe('MUX'));
  it('returns "DFF" for $dff', () => expect(getOperatorLabel('$dff')).toBe('DFF'));
  it('returns "&" for $and', () => expect(getOperatorLabel('$and')).toBe('&'));
  it('returns "|" for $or',  () => expect(getOperatorLabel('$or')).toBe('|'));
  it('returns "~" for $not', () => expect(getOperatorLabel('$not')).toBe('~'));
  it('returns "^" for $xor', () => expect(getOperatorLabel('$xor')).toBe('^'));
  it('returns uppercased fallback for unknown type', () => {
    expect(getOperatorLabel('$foobar')).toBe('FOOBAR');
  });
});

// ── portNodeId ────────────────────────────────────────────────────────────────

describe('portNodeId', () => {
  it('uses "in" suffix for input ports', () => {
    expect(portNodeId('clk', 'input')).toContain('_in_');
  });
  it('uses "out" suffix for output ports', () => {
    expect(portNodeId('q', 'output')).toContain('_out_');
  });
  it('uses "in" suffix for inout ports', () => {
    expect(portNodeId('bidir', 'inout')).toContain('_in_');
  });
  it('includes the port name', () => {
    const id = portNodeId('my_signal', 'input');
    expect(id).toContain('my_signal');
  });
});

// ── convertNetlistToFlow — empty / trivial ────────────────────────────────────

describe('convertNetlistToFlow — empty input', () => {
  it('returns empty nodes/edges for empty modules object', () => {
    const result = convertNetlistToFlow({ modules: {} });
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('returns empty nodes/edges when topModuleName is not found', () => {
    const result = convertNetlistToFlow(andGateNetlist(), 'nonexistent');
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('selects first module when topModuleName is omitted', () => {
    const { nodes } = convertNetlistToFlow(andGateNetlist());
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('accepts an explicit topModuleName', () => {
    const { nodes } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    expect(nodes.length).toBeGreaterThan(0);
  });
});

describe('convertNetlistToFlow — ports only (no cells)', () => {
  const portsOnlyNetlist: YosysNetlist = {
    modules: {
      buf: {
        ports: {
          in:  { direction: 'input',  bits: [2] },
          out: { direction: 'output', bits: [2] },
        },
        cells: {},
      },
    },
  };

  it('creates one node per port', () => {
    const { nodes } = convertNetlistToFlow(portsOnlyNetlist);
    expect(nodes).toHaveLength(2);
  });

  it('marks input ports as "inputPort" type', () => {
    const { nodes } = convertNetlistToFlow(portsOnlyNetlist);
    const inNode = nodes.find((n) => n.type === 'inputPort');
    expect(inNode).toBeDefined();
  });

  it('marks output ports as "outputPort" type', () => {
    const { nodes } = convertNetlistToFlow(portsOnlyNetlist);
    const outNode = nodes.find((n) => n.type === 'outputPort');
    expect(outNode).toBeDefined();
  });

  it('creates no edges when the only connection is port→port (same bit)', () => {
    // Both ports share bit 2; the output port has no cell to drive it via
    // an edge — the connection is degenerate (same source bit as its own sink).
    // The converter should not emit a self-referential edge.
    const { edges } = convertNetlistToFlow(portsOnlyNetlist);
    // An edge source===target on the same bit index would be degenerate.
    for (const e of edges) {
      expect(e.source).not.toBe(e.target);
    }
  });
});

// ── convertNetlistToFlow — node types ─────────────────────────────────────────

describe('convertNetlistToFlow — gate node ($and)', () => {
  it('creates a "gate" node for the $and cell', () => {
    const { nodes } = convertNetlistToFlow(andGateNetlist());
    const cell = nodes.find((n) => n.type === 'gate');
    expect(cell).toBeDefined();
  });

  it('cell node has correct cellType', () => {
    const { nodes } = convertNetlistToFlow(andGateNetlist());
    const cell = nodes.find((n) => n.type === 'gate')!;
    expect(cell.data.cellType).toBe('$and');
  });

  it('cell node label is "&"', () => {
    const { nodes } = convertNetlistToFlow(andGateNetlist());
    const cell = nodes.find((n) => n.type === 'gate')!;
    expect(cell.data.label).toBe('&');
  });

  it('cell node lists A and B as inputs', () => {
    const { nodes } = convertNetlistToFlow(andGateNetlist());
    const cell = nodes.find((n) => n.type === 'gate')!;
    expect(cell.data.inputs).toContain('A');
    expect(cell.data.inputs).toContain('B');
  });

  it('cell node lists Y as output', () => {
    const { nodes } = convertNetlistToFlow(andGateNetlist());
    const cell = nodes.find((n) => n.type === 'gate')!;
    expect(cell.data.outputs).toContain('Y');
  });
});

describe('convertNetlistToFlow — operator node ($add)', () => {
  it('creates an "operator" node for $add', () => {
    const { nodes } = convertNetlistToFlow(adderNetlist());
    const op = nodes.find((n) => n.type === 'operator');
    expect(op).toBeDefined();
    expect(op!.data.cellType).toBe('$add');
    expect(op!.data.label).toBe('+');
  });

  it('preserves bit-width from Y output connection', () => {
    const { nodes } = convertNetlistToFlow(adderNetlist(4));
    const op = nodes.find((n) => n.type === 'operator')!;
    expect(op.data.width).toBe(4);
  });

  it('8-bit adder has width 8', () => {
    const { nodes } = convertNetlistToFlow(adderNetlist(8));
    const op = nodes.find((n) => n.type === 'operator')!;
    expect(op.data.width).toBe(8);
  });
});

describe('convertNetlistToFlow — mux node ($mux)', () => {
  it('creates a "mux" node for $mux', () => {
    const { nodes } = convertNetlistToFlow(muxNetlist());
    const mux = nodes.find((n) => n.type === 'mux');
    expect(mux).toBeDefined();
    expect(mux!.data.cellType).toBe('$mux');
    expect(mux!.data.label).toBe('MUX');
  });

  it('mux node has S as an input', () => {
    const { nodes } = convertNetlistToFlow(muxNetlist());
    const mux = nodes.find((n) => n.type === 'mux')!;
    expect(mux.data.inputs).toContain('S');
  });
});

describe('convertNetlistToFlow — dff node ($dff)', () => {
  it('creates a "dff" node for $dff', () => {
    const { nodes } = convertNetlistToFlow(dffNetlist());
    const dff = nodes.find((n) => n.type === 'dff');
    expect(dff).toBeDefined();
    expect(dff!.data.cellType).toBe('$dff');
    expect(dff!.data.label).toBe('DFF');
  });

  it('dff node lists CLK as an input', () => {
    const { nodes } = convertNetlistToFlow(dffNetlist());
    const dff = nodes.find((n) => n.type === 'dff')!;
    expect(dff.data.inputs).toContain('CLK');
  });

  it('dff node lists Q as an output', () => {
    const { nodes } = convertNetlistToFlow(dffNetlist());
    const dff = nodes.find((n) => n.type === 'dff')!;
    expect(dff.data.outputs).toContain('Q');
  });
});

// ── convertNetlistToFlow — edges ──────────────────────────────────────────────

describe('convertNetlistToFlow — edges (AND gate)', () => {
  it('creates edges from both input ports to the cell', () => {
    const { edges } = convertNetlistToFlow(andGateNetlist());
    // Edges: port_a→AND.A, port_b→AND.B, AND.Y→port_y  = 3 edges
    expect(edges.length).toBeGreaterThanOrEqual(2);
  });

  it('edge from input port "a" targets the AND cell', () => {
    const { nodes, edges } = convertNetlistToFlow(andGateNetlist());
    const aPortId = portNodeId('a', 'input');
    const cellId = nodes.find((n) => n.type === 'gate')!.id;
    const edgeAtoCell = edges.find((e) => e.source === aPortId && e.target === cellId);
    expect(edgeAtoCell).toBeDefined();
  });

  it('edge from input port "b" targets the AND cell', () => {
    const { nodes, edges } = convertNetlistToFlow(andGateNetlist());
    const bPortId = portNodeId('b', 'input');
    const cellId = nodes.find((n) => n.type === 'gate')!.id;
    const edgeBtoCell = edges.find((e) => e.source === bPortId && e.target === cellId);
    expect(edgeBtoCell).toBeDefined();
  });

  it('edge from AND cell output to "y" output port exists', () => {
    const { nodes, edges } = convertNetlistToFlow(andGateNetlist());
    const cellId = nodes.find((n) => n.type === 'gate')!.id;
    const yPortId = portNodeId('y', 'output');
    const edgeCellToOut = edges.find((e) => e.source === cellId && e.target === yPortId);
    expect(edgeCellToOut).toBeDefined();
  });

  it('all edges have unique IDs', () => {
    const { edges } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    const ids = edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all edges have valid source/target referencing existing nodes', () => {
    const { nodes, edges } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(nodeIds.has(e.source), `source "${e.source}" not in nodes`).toBe(true);
      expect(nodeIds.has(e.target), `target "${e.target}" not in nodes`).toBe(true);
    }
  });

  it('edges carry bit-width in data', () => {
    const { edges } = convertNetlistToFlow(andGateNetlist());
    for (const e of edges) {
      expect(typeof e.data.width).toBe('number');
      expect(e.data.width).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('convertNetlistToFlow — edges (multi-bit adder)', () => {
  it('4-bit input port edge has width=4', () => {
    const { nodes, edges } = convertNetlistToFlow(adderNetlist(4));
    const aPortId = portNodeId('a', 'input');
    const cellId = nodes.find((n) => n.type === 'operator')!.id;
    const edge = edges.find((e) => e.source === aPortId && e.target === cellId)!;
    expect(edge).toBeDefined();
    expect(edge.data.width).toBe(4);
  });

  it('8-bit input port edge has width=8', () => {
    const { nodes, edges } = convertNetlistToFlow(adderNetlist(8));
    const aPortId = portNodeId('a', 'input');
    const cellId = nodes.find((n) => n.type === 'operator')!.id;
    const edge = edges.find((e) => e.source === aPortId && e.target === cellId)!;
    expect(edge.data.width).toBe(8);
  });
});

describe('convertNetlistToFlow — edges (DFF)', () => {
  it('creates edge from clk port to DFF CLK input', () => {
    const { nodes, edges } = convertNetlistToFlow(dffNetlist());
    const clkPortId = portNodeId('clk', 'input');
    const dffId = nodes.find((n) => n.type === 'dff')!.id;
    const e = edges.find((x) => x.source === clkPortId && x.target === dffId);
    expect(e).toBeDefined();
    expect(e!.targetHandle).toContain('CLK');
  });

  it('creates edge from DFF Q output to q output port', () => {
    const { nodes, edges } = convertNetlistToFlow(dffNetlist());
    const dffId = nodes.find((n) => n.type === 'dff')!.id;
    const qPortId = portNodeId('q', 'output');
    const e = edges.find((x) => x.source === dffId && x.target === qPortId);
    expect(e).toBeDefined();
    expect(e!.sourceHandle).toContain('Q');
  });
});

// ── convertNetlistToFlow — netname labels ──────────────────────────────────────

describe('convertNetlistToFlow — net name labels', () => {
  it('edge label matches netname when available', () => {
    const { edges } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    // The intermediate signal "ab" is on bit 5 and is the netname for
    // the output of $xor$0. Find an edge carrying bit 5.
    const namedEdge = edges.find((e) => e.label !== undefined);
    expect(namedEdge).toBeDefined();
  });

  it('edge from $xor$0 to $xor$1 is labelled "ab"', () => {
    const { nodes, edges } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    // Sanitise the Yosys cell name: $xor$0 → cell_xor_0  ($ replaced)
    const xor0 = nodes.find((n) => n.data.cellType === '$xor' && n.id.includes('0'));
    const xor1 = nodes.find((n) => n.data.cellType === '$xor' && n.id.includes('1'));
    expect(xor0).toBeDefined();
    expect(xor1).toBeDefined();
    const e = edges.find((x) => x.source === xor0!.id && x.target === xor1!.id);
    expect(e).toBeDefined();
    expect(e!.label).toBe('ab');
  });
});

// ── convertNetlistToFlow — full adder integration ─────────────────────────────

describe('convertNetlistToFlow — full adder integration', () => {
  it('produces the correct number of nodes (5 cells + 5 ports)', () => {
    const { nodes } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    expect(nodes).toHaveLength(10);
  });

  it('has 3 input port nodes and 2 output port nodes', () => {
    const { nodes } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    const inputs  = nodes.filter((n) => n.type === 'inputPort');
    const outputs = nodes.filter((n) => n.type === 'outputPort');
    expect(inputs).toHaveLength(3);
    expect(outputs).toHaveLength(2);
  });

  it('has 2 xor cells, 2 and cells, 1 or cell', () => {
    const { nodes } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    const gates = nodes.filter((n) => n.type === 'gate');
    expect(gates).toHaveLength(5);
    const xors = gates.filter((n) => n.data.cellType === '$xor');
    const ands = gates.filter((n) => n.data.cellType === '$and');
    const ors  = gates.filter((n) => n.data.cellType === '$or');
    expect(xors).toHaveLength(2);
    expect(ands).toHaveLength(2);
    expect(ors).toHaveLength(1);
  });

  it('all nodes have a position field', () => {
    const { nodes } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    for (const n of nodes) {
      expect(n.position).toHaveProperty('x');
      expect(n.position).toHaveProperty('y');
    }
  });

  it('produces at least 9 edges', () => {
    // 3 inputs → xor0, and0 (6 edges) + xor0→xor1, xor0→and1 (2) +
    // cin → xor1, and1 (2) + 3 output edges = ~13 but minimum reasonable count
    const { edges } = convertNetlistToFlow(fullAdderNetlist(), 'full_adder');
    expect(edges.length).toBeGreaterThanOrEqual(9);
  });
});

// ── convertNetlistToFlow — constant bits ──────────────────────────────────────

describe('convertNetlistToFlow — constant / disconnected bits', () => {
  it('does not create edges for constant bits ("0","1","x","z")', () => {
    const netlist: YosysNetlist = {
      modules: {
        top: {
          ports: {
            y: { direction: 'output', bits: [3] },
          },
          cells: {
            '$and$0': {
              type: '$and',
              port_directions: { A: 'input', B: 'input', Y: 'output' },
              // A is driven by constant '1', B by a real wire
              connections: { A: ['1'], B: ['0'], Y: [3] },
            },
          },
        },
      },
    };
    const { edges } = convertNetlistToFlow(netlist);
    // No source node drives the constants, so no edges into A or B
    // The Y output → y port edge should still be created (if $and$0.Y drives bit 3)
    // But bit 3 is only driven by $and$0.Y so that edge exists.
    // No edges from constant bits.
    for (const e of edges) {
      // sourceHandle should not reference a constant bit source
      expect(e.sourceHandle).not.toContain('const');
    }
  });
});
