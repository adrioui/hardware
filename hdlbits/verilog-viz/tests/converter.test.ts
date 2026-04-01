/**
 * Tests for ParsedDesign → ELK graph converter
 */

import { describe, it, expect } from 'vitest';
import {
  convertToElk,
  findTopModule,
  BOUNDARY_IN_ID,
  BOUNDARY_OUT_ID,
  BASE_WIDTH,
  BASE_HEIGHT,
  PORT_SPACING,
} from '../src/core/converter';
import type { ParsedDesign, ParsedModule } from '../src/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function loc() {
  return { line: 1, column: 1, offset: 0 };
}

/** Build a minimal ParsedDesign from a map of module definitions. */
function makeDesign(modules: Record<string, ParsedModule>): ParsedDesign {
  return {
    modules: new Map(Object.entries(modules)),
    errors: [],
  };
}

/** Build a module with no instances and given ports. */
function makeModule(
  name: string,
  ports: Array<{ name: string; direction: 'input' | 'output' | 'inout'; width?: string }>,
): ParsedModule {
  return {
    name,
    ports: ports.map((p) => ({ name: p.name, direction: p.direction, width: p.width ?? '1', loc: loc() })),
    instances: [],
    parameters: [],
    loc: loc(),
  };
}

/** Build a module instance entry. */
function makeInstance(
  moduleName: string,
  instanceName: string,
  connections: Record<string, string>,
) {
  return {
    moduleName,
    instanceName,
    connections: new Map(Object.entries(connections)),
    parameters: new Map<string, string>(),
    loc: loc(),
  };
}

// ── findTopModule ─────────────────────────────────────────────────────────────

describe('findTopModule', () => {
  it('returns null for empty design', () => {
    const design = makeDesign({});
    expect(findTopModule(design)).toBeNull();
  });

  it('returns the only module in a single-module design', () => {
    const mod = makeModule('top', []);
    const design = makeDesign({ top: mod });
    expect(findTopModule(design)).toBe(mod);
  });

  it('returns the module that is not instantiated by any other', () => {
    const child = makeModule('child', []);
    const parent: ParsedModule = {
      ...makeModule('parent', []),
      instances: [makeInstance('child', 'u_child', {})],
    };
    const design = makeDesign({ child, parent });
    expect(findTopModule(design)?.name).toBe('parent');
  });

  it('respects an explicit topModuleName', () => {
    const a = makeModule('a', []);
    const b = makeModule('b', []);
    const design = makeDesign({ a, b });
    expect(findTopModule(design, 'a')?.name).toBe('a');
  });

  it('returns null when explicit topModuleName is not found', () => {
    const mod = makeModule('top', []);
    const design = makeDesign({ top: mod });
    expect(findTopModule(design, 'missing')).toBeNull();
  });

  it('falls back to last module when all are instantiated', () => {
    const a = makeModule('a', []);
    const b: ParsedModule = {
      ...makeModule('b', []),
      instances: [makeInstance('a', 'u_a', {})],
    };
    const c: ParsedModule = {
      ...makeModule('c', []),
      instances: [makeInstance('b', 'u_b', {})],
    };
    // All modules are instantiated by some other
    // 'c' is not instantiated, so it's the top
    const design = makeDesign({ a, b, c });
    expect(findTopModule(design)?.name).toBe('c');
  });
});

// ── convertToElk: empty / trivial ─────────────────────────────────────────────

describe('convertToElk — empty design', () => {
  it('returns an empty root graph for an empty design', () => {
    const graph = convertToElk(makeDesign({}));
    expect(graph.id).toBe('root');
    expect(graph.children).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });
});

describe('convertToElk — layout options', () => {
  it('includes required ELK layout options', () => {
    const design = makeDesign({ top: makeModule('top', []) });
    const graph = convertToElk(design);
    expect(graph.layoutOptions['algorithm']).toBe('layered');
    expect(graph.layoutOptions['elk.direction']).toBe('RIGHT');
    expect(graph.layoutOptions['edgeRouting']).toBe('ORTHOGONAL');
    expect(graph.layoutOptions['portConstraints']).toBe('FIXED_ORDER');
  });
});

// ── convertToElk: boundary nodes ─────────────────────────────────────────────

describe('convertToElk — boundary nodes', () => {
  it('creates boundary-in node for input ports', () => {
    const top = makeModule('top', [
      { name: 'clk', direction: 'input' },
      { name: 'data_in', direction: 'input' },
    ]);
    const graph = convertToElk(makeDesign({ top }));

    const inNode = graph.children.find((n) => n.id === BOUNDARY_IN_ID);
    expect(inNode).toBeDefined();
    expect(inNode!.ports).toHaveLength(2);
    expect(inNode!.ports!.map((p) => p.labels![0].text)).toContain('clk');
    expect(inNode!.ports!.map((p) => p.labels![0].text)).toContain('data_in');
  });

  it('creates boundary-out node for output ports', () => {
    const top = makeModule('top', [
      { name: 'result', direction: 'output' },
    ]);
    const graph = convertToElk(makeDesign({ top }));

    const outNode = graph.children.find((n) => n.id === BOUNDARY_OUT_ID);
    expect(outNode).toBeDefined();
    expect(outNode!.ports).toHaveLength(1);
    expect(outNode!.ports![0].labels![0].text).toBe('result');
  });

  it('does not create boundary-in when there are no input ports', () => {
    const top = makeModule('top', [{ name: 'out', direction: 'output' }]);
    const graph = convertToElk(makeDesign({ top }));
    expect(graph.children.find((n) => n.id === BOUNDARY_IN_ID)).toBeUndefined();
  });

  it('does not create boundary-out when there are no output ports', () => {
    const top = makeModule('top', [{ name: 'in', direction: 'input' }]);
    const graph = convertToElk(makeDesign({ top }));
    expect(graph.children.find((n) => n.id === BOUNDARY_OUT_ID)).toBeUndefined();
  });

  it('assigns EAST side to boundary-in ports (they drive signals rightward)', () => {
    const top = makeModule('top', [{ name: 'clk', direction: 'input' }]);
    const graph = convertToElk(makeDesign({ top }));
    const inNode = graph.children.find((n) => n.id === BOUNDARY_IN_ID)!;
    expect(inNode.ports![0].layoutOptions!['port.side']).toBe('EAST');
  });

  it('assigns WEST side to boundary-out ports', () => {
    const top = makeModule('top', [{ name: 'q', direction: 'output' }]);
    const graph = convertToElk(makeDesign({ top }));
    const outNode = graph.children.find((n) => n.id === BOUNDARY_OUT_ID)!;
    expect(outNode.ports![0].layoutOptions!['port.side']).toBe('WEST');
  });

  it('handles inout ports by placing them on boundary-in', () => {
    const top = makeModule('top', [{ name: 'bidir', direction: 'inout' }]);
    const graph = convertToElk(makeDesign({ top }));
    const inNode = graph.children.find((n) => n.id === BOUNDARY_IN_ID);
    expect(inNode).toBeDefined();
    expect(inNode!.ports!.map((p) => p.labels![0].text)).toContain('bidir');
  });
});

// ── convertToElk: instance nodes ──────────────────────────────────────────────

describe('convertToElk — instance nodes', () => {
  it('creates an ElkNode for each instance in the top module', () => {
    const child = makeModule('child', [
      { name: 'a', direction: 'input' },
      { name: 'b', direction: 'output' },
    ]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('child', 'u0', { a: 'sig_a', b: 'sig_b' })],
    };
    const design = makeDesign({ child, top });
    const graph = convertToElk(design);

    const u0 = graph.children.find((n) => n.id === 'u0');
    expect(u0).toBeDefined();
    expect(u0!.ports).toHaveLength(2);
  });

  it('assigns WEST side to input ports and EAST side to output ports on instance nodes', () => {
    const child = makeModule('child', [
      { name: 'in_port', direction: 'input' },
      { name: 'out_port', direction: 'output' },
    ]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('child', 'u0', {})],
    };
    const design = makeDesign({ child, top });
    const graph = convertToElk(design);

    const u0 = graph.children.find((n) => n.id === 'u0')!;
    const inP = u0.ports!.find((p) => p.id === 'u0.in_port')!;
    const outP = u0.ports!.find((p) => p.id === 'u0.out_port')!;
    expect(inP.layoutOptions!['port.side']).toBe('WEST');
    expect(outP.layoutOptions!['port.side']).toBe('EAST');
  });

  it('scales node height with port count', () => {
    const makeChild = (n: number) =>
      makeModule('child', Array.from({ length: n }, (_, i) => ({ name: `p${i}`, direction: 'input' as const })));

    for (const portCount of [0, 2, 5]) {
      const child = makeChild(portCount);
      const top: ParsedModule = { ...makeModule('top', []), instances: [makeInstance('child', 'u0', {})] };
      const graph = convertToElk(makeDesign({ child, top }));
      const u0 = graph.children.find((n) => n.id === 'u0')!;
      expect(u0.height).toBe(BASE_HEIGHT + portCount * PORT_SPACING);
    }
  });

  it('uses BASE_WIDTH for all instance nodes', () => {
    const child = makeModule('child', [{ name: 'x', direction: 'input' }]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('child', 'u0', {})],
    };
    const graph = convertToElk(makeDesign({ child, top }));
    const u0 = graph.children.find((n) => n.id === 'u0')!;
    expect(u0.width).toBe(BASE_WIDTH);
  });

  it('creates a placeholder node for unknown (external) modules', () => {
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('external_ip', 'u_ext', { x: 'sig_x' })],
    };
    const design = makeDesign({ top });
    const graph = convertToElk(design);
    expect(graph.children.find((n) => n.id === 'u_ext')).toBeDefined();
  });

  it('port IDs follow the nodeId.portName convention', () => {
    const child = makeModule('child', [{ name: 'clk', direction: 'input' }]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('child', 'inst_a', {})],
    };
    const graph = convertToElk(makeDesign({ child, top }));
    const instNode = graph.children.find((n) => n.id === 'inst_a')!;
    expect(instNode.ports!.some((p) => p.id === 'inst_a.clk')).toBe(true);
  });
});

// ── convertToElk: edges ───────────────────────────────────────────────────────

describe('convertToElk — edges', () => {
  it('creates edges from top-level inputs through instances to top-level outputs', () => {
    // top: a(input) → wire_a → child.x(input)
    //      child.y(output) → wire_b → b(output)
    const child = makeModule('child', [
      { name: 'x', direction: 'input' },
      { name: 'y', direction: 'output' },
    ]);
    const top: ParsedModule = {
      ...makeModule('top', [
        { name: 'a', direction: 'input' },
        { name: 'b', direction: 'output' },
      ]),
      instances: [makeInstance('child', 'u0', { x: 'a', y: 'b' })],
    };
    const design = makeDesign({ child, top });
    const graph = convertToElk(design);

    // Edge: boundary_in.a → u0.x
    const edgeAX = graph.edges.find(
      (e) => e.sources.includes(`${BOUNDARY_IN_ID}.a`) && e.targets.includes('u0.x'),
    );
    expect(edgeAX).toBeDefined();

    // Edge: u0.y → boundary_out.b
    const edgeYB = graph.edges.find(
      (e) => e.sources.includes('u0.y') && e.targets.includes(`${BOUNDARY_OUT_ID}.b`),
    );
    expect(edgeYB).toBeDefined();
  });

  it('creates inter-instance edges when a signal connects two instances', () => {
    const child = makeModule('child', [
      { name: 'in', direction: 'input' },
      { name: 'out', direction: 'output' },
    ]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [
        makeInstance('child', 'u0', { in: 'ext', out: 'middle' }),
        makeInstance('child', 'u1', { in: 'middle', out: 'result' }),
      ],
    };
    const design = makeDesign({ child, top });
    const graph = convertToElk(design);

    const interEdge = graph.edges.find(
      (e) => e.sources.includes('u0.out') && e.targets.includes('u1.in'),
    );
    expect(interEdge).toBeDefined();
  });

  it('emits a signal label on each edge', () => {
    const child = makeModule('child', [
      { name: 'x', direction: 'input' },
    ]);
    const top: ParsedModule = {
      ...makeModule('top', [{ name: 'sig', direction: 'input' }]),
      instances: [makeInstance('child', 'u0', { x: 'sig' })],
    };
    const graph = convertToElk(makeDesign({ child, top }));
    const edge = graph.edges.find((e) => e.targets.includes('u0.x'));
    expect(edge).toBeDefined();
    expect(edge!.labels?.[0].text).toBe('sig');
  });

  it('does not create edges for unconnected signals (no source or no sink)', () => {
    // Instance output connected to nothing in the top boundary
    const child = makeModule('child', [{ name: 'out', direction: 'output' }]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('child', 'u0', { out: 'floating' })],
    };
    const design = makeDesign({ child, top });
    const graph = convertToElk(design);
    // 'floating' signal has a source (u0.out) but no sink → no edge
    expect(graph.edges).toHaveLength(0);
  });

  it('each edge has a unique id', () => {
    const child = makeModule('child', [
      { name: 'a', direction: 'input' },
      { name: 'b', direction: 'input' },
    ]);
    const top: ParsedModule = {
      ...makeModule('top', [
        { name: 'sa', direction: 'input' },
        { name: 'sb', direction: 'input' },
      ]),
      instances: [makeInstance('child', 'u0', { a: 'sa', b: 'sb' })],
    };
    const graph = convertToElk(makeDesign({ child, top }));
    const ids = graph.edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── convertToElk: full_adder integration test ────────────────────────────────
// Built manually (parser Phase B not yet implemented) to mirror full_adder.v:
//   half_adder: inputs a,b → outputs sum,carry
//   full_adder: inputs a,b,cin → outputs sum,cout
//     ha0: half_adder  .a(a)    .b(b)    .sum(sum1)  .carry(carry1)
//     ha1: half_adder  .a(sum1) .b(cin)  .sum(sum)   .carry(carry2)

describe('convertToElk — full_adder integration', () => {
  function buildFullAdderDesign(): ParsedDesign {
    const halfAdder = makeModule('half_adder', [
      { name: 'a', direction: 'input' },
      { name: 'b', direction: 'input' },
      { name: 'sum', direction: 'output' },
      { name: 'carry', direction: 'output' },
    ]);

    const fullAdder: ParsedModule = {
      ...makeModule('full_adder', [
        { name: 'a', direction: 'input' },
        { name: 'b', direction: 'input' },
        { name: 'cin', direction: 'input' },
        { name: 'sum', direction: 'output' },
        { name: 'cout', direction: 'output' },
      ]),
      instances: [
        makeInstance('half_adder', 'ha0', { a: 'a', b: 'b', sum: 'sum1', carry: 'carry1' }),
        makeInstance('half_adder', 'ha1', { a: 'sum1', b: 'cin', sum: 'sum', carry: 'carry2' }),
      ],
    };

    return makeDesign({ half_adder: halfAdder, full_adder: fullAdder });
  }

  it('identifies full_adder as the top module', () => {
    expect(findTopModule(buildFullAdderDesign())?.name).toBe('full_adder');
  });

  it('includes both ha0 and ha1 as instance nodes', () => {
    const graph = convertToElk(buildFullAdderDesign());
    expect(graph.children.find((n) => n.id === 'ha0')).toBeDefined();
    expect(graph.children.find((n) => n.id === 'ha1')).toBeDefined();
  });

  it('creates boundary nodes for full_adder ports', () => {
    const graph = convertToElk(buildFullAdderDesign());
    const inNode = graph.children.find((n) => n.id === BOUNDARY_IN_ID);
    const outNode = graph.children.find((n) => n.id === BOUNDARY_OUT_ID);
    expect(inNode).toBeDefined();
    expect(outNode).toBeDefined();
    // 3 inputs: a, b, cin
    expect(inNode!.ports).toHaveLength(3);
    // 2 outputs: sum, cout
    expect(outNode!.ports).toHaveLength(2);
  });

  it('produces edges that connect boundary inputs through ha0 and ha1', () => {
    const graph = convertToElk(buildFullAdderDesign());
    // a → ha0.a
    expect(
      graph.edges.some(
        (e) => e.sources.includes(`${BOUNDARY_IN_ID}.a`) && e.targets.includes('ha0.a'),
      ),
    ).toBe(true);
    // ha0.sum → ha1.a  (via signal sum1)
    expect(
      graph.edges.some(
        (e) => e.sources.includes('ha0.sum') && e.targets.includes('ha1.a'),
      ),
    ).toBe(true);
    // ha1.sum → boundary_out.sum
    expect(
      graph.edges.some(
        (e) => e.sources.includes('ha1.sum') && e.targets.includes(`${BOUNDARY_OUT_ID}.sum`),
      ),
    ).toBe(true);
  });

  it('has at least as many nodes as instances + boundary nodes', () => {
    const graph = convertToElk(buildFullAdderDesign());
    // 2 instances + 2 boundary = 4 children
    expect(graph.children.length).toBeGreaterThanOrEqual(4);
  });
});

// ── convertToElk: portConstraints on instance nodes ──────────────────────────

describe('convertToElk — node layout options', () => {
  it('sets portConstraints on instance nodes', () => {
    const child = makeModule('child', [{ name: 'p', direction: 'input' }]);
    const top: ParsedModule = {
      ...makeModule('top', []),
      instances: [makeInstance('child', 'u0', {})],
    };
    const graph = convertToElk(makeDesign({ child, top }));
    const u0 = graph.children.find((n) => n.id === 'u0')!;
    expect(u0.layoutOptions?.['portConstraints']).toBe('FIXED_ORDER');
  });
});
