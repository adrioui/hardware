/**
 * ParsedDesign → ELK JSON graph converter
 *
 * Each module instance becomes an ElkNode with ports derived from the
 * instantiated module's port declarations.  Top-level module ports are
 * represented as two "boundary" nodes (inputs on the left, outputs on
 * the right).  Edges are traced through the connection / signal map.
 */

import type { ParsedDesign, ParsedModule, Port } from '../types';

// ── Sizing constants ──────────────────────────────────────────────────────────
export const BASE_WIDTH = 120;
export const BASE_HEIGHT = 40;
export const PORT_SPACING = 20;
export const PORT_SIZE = 8;

// ── ELK type definitions ──────────────────────────────────────────────────────

export interface ElkLabel {
  text: string;
  layoutOptions?: Record<string, string>;
}

export interface ElkPort {
  id: string;
  width: number;
  height: number;
  labels?: ElkLabel[];
  layoutOptions?: Record<string, string>;
}

export interface ElkNode {
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  ports?: ElkPort[];
  labels?: ElkLabel[];
  layoutOptions?: Record<string, string>;
}

export interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
  labels?: ElkLabel[];
}

export interface ElkGraph {
  id: string;
  children: ElkNode[];
  edges: ElkEdge[];
  layoutOptions: Record<string, string>;
}

// ── Special node IDs ──────────────────────────────────────────────────────────
export const BOUNDARY_IN_ID = '__top_in__';
export const BOUNDARY_OUT_ID = '__top_out__';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Compute node height from port count. */
function computeHeight(portCount: number): number {
  return BASE_HEIGHT + portCount * PORT_SPACING;
}

/** Build a port ID in the form "nodeId.portName". */
function makePortId(nodeId: string, portName: string): string {
  return `${nodeId}.${portName}`;
}

/** Convert a module Port into an ElkPort attached to nodeId. */
function toElkPort(nodeId: string, port: Port, index: number): ElkPort {
  // Inputs appear on the WEST (left), outputs on the EAST (right)
  const side = port.direction === 'output' ? 'EAST' : 'WEST';
  return {
    id: makePortId(nodeId, port.name),
    width: PORT_SIZE,
    height: PORT_SIZE,
    labels: [{ text: port.name }],
    layoutOptions: {
      'port.side': side,
      'port.index': String(index),
    },
  };
}

/** Create an ElkNode for a module instance, using its module definition's ports. */
function instanceToElkNode(instanceName: string, module: ParsedModule): ElkNode {
  let inputIdx = 0;
  let outputIdx = 0;

  const ports: ElkPort[] = module.ports.map((port) => {
    const idx = port.direction === 'output' ? outputIdx++ : inputIdx++;
    return toElkPort(instanceName, port, idx);
  });

  return {
    id: instanceName,
    width: BASE_WIDTH,
    height: computeHeight(ports.length),
    ports,
    labels: [{ text: instanceName }],
    layoutOptions: { 'portConstraints': 'FIXED_ORDER' },
  };
}

/** Create the boundary input node for all top-level input/inout ports. */
function makeBoundaryIn(topModule: ParsedModule): ElkNode {
  const inputPorts = topModule.ports.filter(
    (p) => p.direction === 'input' || p.direction === 'inout',
  );

  const ports: ElkPort[] = inputPorts.map((port, idx) => ({
    id: makePortId(BOUNDARY_IN_ID, port.name),
    width: PORT_SIZE,
    height: PORT_SIZE,
    labels: [{ text: port.name }],
    layoutOptions: { 'port.side': 'EAST', 'port.index': String(idx) },
  }));

  return {
    id: BOUNDARY_IN_ID,
    width: BASE_WIDTH,
    height: computeHeight(ports.length),
    ports,
    labels: [{ text: topModule.name }],
    layoutOptions: { 'portConstraints': 'FIXED_ORDER' },
  };
}

/** Create the boundary output node for all top-level output ports. */
function makeBoundaryOut(topModule: ParsedModule): ElkNode {
  const outputPorts = topModule.ports.filter((p) => p.direction === 'output');

  const ports: ElkPort[] = outputPorts.map((port, idx) => ({
    id: makePortId(BOUNDARY_OUT_ID, port.name),
    width: PORT_SIZE,
    height: PORT_SIZE,
    labels: [{ text: port.name }],
    layoutOptions: { 'port.side': 'WEST', 'port.index': String(idx) },
  }));

  return {
    id: BOUNDARY_OUT_ID,
    width: BASE_WIDTH,
    height: computeHeight(ports.length),
    ports,
    labels: [{ text: topModule.name }],
    layoutOptions: { 'portConstraints': 'FIXED_ORDER' },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Determine the top-level module in the design.
 *
 * Strategy:
 *   1. If `topModuleName` is given, look it up directly.
 *   2. Otherwise, find modules not instantiated by any other module.
 *   3. If multiple candidates exist, return the last one.
 *   4. If every module is instantiated (unusual), fall back to the last.
 */
export function findTopModule(
  design: ParsedDesign,
  topModuleName?: string,
): ParsedModule | null {
  if (design.modules.size === 0) return null;
  if (topModuleName) return design.modules.get(topModuleName) ?? null;

  const instantiated = new Set<string>();
  for (const mod of design.modules.values()) {
    for (const inst of mod.instances) {
      instantiated.add(inst.moduleName);
    }
  }

  const candidates: ParsedModule[] = [];
  for (const mod of design.modules.values()) {
    if (!instantiated.has(mod.name)) candidates.push(mod);
  }

  if (candidates.length >= 1) return candidates[candidates.length - 1];

  // Fallback: last module defined
  const all = [...design.modules.values()];
  return all[all.length - 1];
}

/**
 * Convert a ParsedDesign to an ELK JSON graph.
 *
 * @param design         The parsed Verilog design.
 * @param topModuleName  Optional name of the top-level module to visualize.
 *                       Defaults to the module not instantiated by any other.
 * @returns              An ElkGraph ready for layout via ELK.js.
 */
export function convertToElk(
  design: ParsedDesign,
  topModuleName?: string,
): ElkGraph {
  const graph: ElkGraph = {
    id: 'root',
    children: [],
    edges: [],
    layoutOptions: {
      'algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'edgeRouting': 'ORTHOGONAL',
      'portConstraints': 'FIXED_ORDER',
    },
  };

  const topModule = findTopModule(design, topModuleName);
  if (!topModule) return graph;

  // ── 1. Boundary nodes ─────────────────────────────────────────────────────
  const boundaryIn = makeBoundaryIn(topModule);
  const boundaryOut = makeBoundaryOut(topModule);

  if ((boundaryIn.ports ?? []).length > 0) graph.children.push(boundaryIn);
  if ((boundaryOut.ports ?? []).length > 0) graph.children.push(boundaryOut);

  // ── 2. Signal map ─────────────────────────────────────────────────────────
  // source = port that drives the signal  (instance output / top-level input)
  // sink   = port that reads the signal   (instance input  / top-level output)
  type ConnMap = { sources: string[]; sinks: string[] };
  const sigMap = new Map<string, ConnMap>();

  const getConn = (sig: string): ConnMap => {
    let c = sigMap.get(sig);
    if (!c) {
      c = { sources: [], sinks: [] };
      sigMap.set(sig, c);
    }
    return c;
  };

  for (const port of topModule.ports) {
    if (port.direction === 'input') {
      getConn(port.name).sources.push(makePortId(BOUNDARY_IN_ID, port.name));
    } else if (port.direction === 'output') {
      getConn(port.name).sinks.push(makePortId(BOUNDARY_OUT_ID, port.name));
    } else {
      // inout: boundary_in drives it, boundary_out sinks it
      const c = getConn(port.name);
      c.sources.push(makePortId(BOUNDARY_IN_ID, port.name));
      c.sinks.push(makePortId(BOUNDARY_OUT_ID, port.name));
    }
  }

  // ── 3. Instance nodes + connection registrations ──────────────────────────
  for (const inst of topModule.instances) {
    const defMod = design.modules.get(inst.moduleName);

    if (!defMod) {
      // Unknown module: create a placeholder node; directions are unknown,
      // so we skip signal-map registration to avoid spurious edges.
      const pseudoPorts: Port[] = [...inst.connections.keys()].map(
        (pName): Port => ({
          name: pName,
          direction: 'input',
          width: '1',
          loc: inst.loc,
        }),
      );
      const pseudoMod: ParsedModule = {
        name: inst.moduleName,
        ports: pseudoPorts,
        instances: [],
        parameters: [],
        loc: inst.loc,
      };
      graph.children.push(instanceToElkNode(inst.instanceName, pseudoMod));
      continue;
    }

    graph.children.push(instanceToElkNode(inst.instanceName, defMod));

    // Build port-direction lookup for this module
    const dirMap = new Map<string, Port['direction']>();
    for (const p of defMod.ports) dirMap.set(p.name, p.direction);

    for (const [portName, signalName] of inst.connections) {
      const dir = dirMap.get(portName);
      if (!dir) continue;

      const pRef = makePortId(inst.instanceName, portName);
      const c = getConn(signalName);

      if (dir === 'output') {
        c.sources.push(pRef);
      } else if (dir === 'input') {
        c.sinks.push(pRef);
      } else {
        // inout
        c.sources.push(pRef);
        c.sinks.push(pRef);
      }
    }
  }

  // ── 4. Edges ──────────────────────────────────────────────────────────────
  let edgeIdx = 0;
  for (const [signalName, conn] of sigMap) {
    if (conn.sources.length === 0 || conn.sinks.length === 0) continue;
    for (const src of conn.sources) {
      for (const tgt of conn.sinks) {
        graph.edges.push({
          id: `edge_${edgeIdx++}`,
          sources: [src],
          targets: [tgt],
          labels: [{ text: signalName }],
        });
      }
    }
  }

  return graph;
}
