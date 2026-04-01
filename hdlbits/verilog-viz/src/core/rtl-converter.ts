/**
 * Yosys JSON netlist → React Flow nodes/edges converter
 *
 * Accepts a Yosys JSON netlist object and converts it to a flat list of
 * React Flow–compatible nodes and edges.  No layout is applied here; callers
 * should pipe the result through ELK (or another layout engine).
 */

// ── Yosys JSON types (subset we care about) ───────────────────────────────────

export type YosBit = number | '0' | '1' | 'x' | 'z';

export interface YosysPort {
  direction: 'input' | 'output' | 'inout';
  bits: YosBit[];
}

export interface YosysCell {
  type: string;
  port_directions: Record<string, 'input' | 'output'>;
  connections: Record<string, YosBit[]>;
  parameters?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  hide_name?: number;
}

export interface YosysModule {
  ports: Record<string, YosysPort>;
  cells: Record<string, YosysCell>;
  netnames?: Record<string, { bits: YosBit[]; attributes?: Record<string, unknown> }>;
}

export interface YosysNetlist {
  modules: Record<string, YosysModule>;
}

// ── RTL node / edge types ─────────────────────────────────────────────────────

export type RtlNodeType =
  | 'operator'   // $add $sub $mul $eq $lt $le $gt $ge $ne $div $mod $pow
  | 'mux'        // $mux $pmux
  | 'dff'        // $dff $adff $sdff $dffe $adffe $sdffe $sdffce
  | 'gate'       // $and $or $not $xor $xnor $nand $nor $buf $reduce_and …
  | 'inputPort'  // top-level input/inout boundary
  | 'outputPort' // top-level output boundary
  | 'constant'   // $const or synthesized constant drivers
  | 'unknown';   // everything else

export interface RtlNodeData extends Record<string, unknown> {
  /** Human-readable label shown in the node. */
  label: string;
  /** Original Yosys cell type string, e.g. "$add". */
  cellType: string;
  /** Ordered input port names. */
  inputs: string[];
  /** Ordered output port names. */
  outputs: string[];
  /** Bit-width of the primary data path (Y / Q output), if known. */
  width?: number;
}

export interface RtlNode {
  id: string;
  type: RtlNodeType;
  data: RtlNodeData;
  position: { x: number; y: number };
}

export interface RtlEdgeData extends Record<string, unknown> {
  /** Bit-width of the wire carried by this edge. */
  width: number;
  /** Net name from Yosys netnames, if available. */
  netName?: string;
}

export interface RtlEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  data: RtlEdgeData;
  label?: string;
}

export interface RtlGraph {
  nodes: RtlNode[];
  edges: RtlEdge[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OPERATOR_TYPES = new Set([
  '$add', '$sub', '$mul', '$div', '$mod', '$pow',
  '$eq', '$ne', '$lt', '$le', '$gt', '$ge',
  '$sshl', '$sshr', '$shl', '$shr',
]);

const MUX_TYPES = new Set(['$mux', '$pmux']);

const DFF_TYPES = new Set([
  '$dff', '$adff', '$sdff',
  '$dffe', '$adffe', '$sdffe', '$sdffce',
  '$ff',
]);

const GATE_TYPES = new Set([
  '$and', '$or', '$not', '$xor', '$xnor', '$nand', '$nor', '$buf',
  '$reduce_and', '$reduce_or', '$reduce_xor', '$reduce_xnor', '$reduce_bool',
  '$logic_and', '$logic_or', '$logic_not',
]);

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Map a Yosys cell type string to an `RtlNodeType`.
 */
export function getRtlNodeType(cellType: string): RtlNodeType {
  if (OPERATOR_TYPES.has(cellType)) return 'operator';
  if (MUX_TYPES.has(cellType)) return 'mux';
  if (DFF_TYPES.has(cellType)) return 'dff';
  if (GATE_TYPES.has(cellType)) return 'gate';
  if (cellType === '$const') return 'constant';
  return 'unknown';
}

/**
 * Produce a short display label for a cell type.
 * e.g. "$add" → "+",  "$dff" → "DFF",  "$mux" → "MUX"
 */
export function getOperatorLabel(cellType: string): string {
  const MAP: Record<string, string> = {
    '$add': '+', '$sub': '−', '$mul': '×', '$div': '÷', '$mod': '%',
    '$pow': '**',
    '$eq': '=', '$ne': '≠', '$lt': '<', '$le': '≤', '$gt': '>', '$ge': '≥',
    '$and': '&', '$or': '|', '$not': '~', '$xor': '^', '$xnor': '~^',
    '$nand': '~&', '$nor': '~|', '$buf': 'BUF',
    '$reduce_and': '&', '$reduce_or': '|', '$reduce_xor': '^',
    '$reduce_xnor': '~^', '$reduce_bool': '||',
    '$logic_and': '&&', '$logic_or': '||', '$logic_not': '!',
    '$mux': 'MUX', '$pmux': 'PMUX',
    '$dff': 'DFF', '$adff': 'ADFF', '$sdff': 'SDFF',
    '$dffe': 'DFF', '$adffe': 'ADFF', '$sdffe': 'SDFF', '$sdffce': 'SDFF',
    '$ff': 'FF', '$const': 'CONST',
    '$sshl': '<<', '$sshr': '>>', '$shl': '<<', '$shr': '>>',
  };
  return MAP[cellType] ?? cellType.replace(/^\$/, '').toUpperCase();
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Sanitise a Yosys name so it is safe as a React Flow node/handle id. */
function sanitiseId(raw: string): string {
  return raw.replace(/\$/g, 'cell_').replace(/[^a-zA-Z0-9_\-.]/g, '_');
}

/** Port node ID for a module-level port. */
export function portNodeId(portName: string, direction: 'input' | 'output' | 'inout'): string {
  const side = direction === 'output' ? 'out' : 'in';
  return `__port_${side}__${portName}`;
}

/** Build a handle id for a node's port. */
function handleId(nodeId: string, portName: string): string {
  return `${nodeId}::${portName}`;
}

// ── Main converter ────────────────────────────────────────────────────────────

/**
 * Convert a Yosys JSON netlist to React Flow–compatible nodes and edges.
 *
 * @param netlist        Yosys JSON output (`{ modules: { ... } }`).
 * @param topModuleName  Which module to visualise.  Defaults to the first
 *                       module if omitted.
 * @returns              `{ nodes, edges }` with placeholder positions.
 */
export function convertNetlistToFlow(
  netlist: YosysNetlist,
  topModuleName?: string,
): RtlGraph {
  const moduleNames = Object.keys(netlist.modules);
  if (moduleNames.length === 0) return { nodes: [], edges: [] };

  const modName = topModuleName ?? moduleNames[0];
  const mod = netlist.modules[modName];
  if (!mod) return { nodes: [], edges: [] };

  const nodes: RtlNode[] = [];
  const edges: RtlEdge[] = [];

  // ── 1. Build bit→(nodeId, portName) source map ────────────────────────────
  // A "source" is anything that *drives* a bit: a module input port or a
  // cell output port.
  type PortRef = { nodeId: string; portName: string };
  const bitSource = new Map<number, PortRef>();

  // Module input ports drive their bits into the graph.
  for (const [pName, port] of Object.entries(mod.ports)) {
    if (port.direction === 'input' || port.direction === 'inout') {
      const nid = portNodeId(pName, port.direction);
      for (const bit of port.bits) {
        if (typeof bit === 'number') bitSource.set(bit, { nodeId: nid, portName: pName });
      }
    }
  }

  // Cell output ports drive their bits into the graph.
  for (const [cellName, cell] of Object.entries(mod.cells)) {
    const nid = sanitiseId(cellName);
    for (const [portName, dir] of Object.entries(cell.port_directions)) {
      if (dir === 'output') {
        const bits = cell.connections[portName] ?? [];
        for (const bit of bits) {
          if (typeof bit === 'number') bitSource.set(bit, { nodeId: nid, portName });
        }
      }
    }
  }

  // ── 2. Build reverse: bit → netname ──────────────────────────────────────
  const bitNetName = new Map<number, string>();
  if (mod.netnames) {
    for (const [netName, net] of Object.entries(mod.netnames)) {
      for (const bit of net.bits) {
        if (typeof bit === 'number') bitNetName.set(bit, netName);
      }
    }
  }

  // ── 3. Create port nodes ──────────────────────────────────────────────────
  for (const [pName, port] of Object.entries(mod.ports)) {
    const nid = portNodeId(pName, port.direction);
    const isInput = port.direction !== 'output';
    const nodeType: RtlNodeType = isInput ? 'inputPort' : 'outputPort';
    nodes.push({
      id: nid,
      type: nodeType,
      data: {
        label: pName,
        cellType: nodeType,
        inputs: isInput ? [] : [pName],
        outputs: isInput ? [pName] : [],
        width: port.bits.filter((b) => typeof b === 'number').length,
      },
      position: { x: 0, y: 0 },
    });
  }

  // ── 4. Create cell nodes ──────────────────────────────────────────────────
  for (const [cellName, cell] of Object.entries(mod.cells)) {
    const nid = sanitiseId(cellName);
    const cellType = cell.type;
    const nodeType = getRtlNodeType(cellType);
    const label = getOperatorLabel(cellType);

    const inputs: string[] = [];
    const outputs: string[] = [];
    for (const [portName, dir] of Object.entries(cell.port_directions)) {
      if (dir === 'input') inputs.push(portName);
      else outputs.push(portName);
    }

    // Width = length of the primary output connection (Y or Q)
    const primaryOut = outputs.find((p) => p === 'Y' || p === 'Q') ?? outputs[0];
    const width = primaryOut ? (cell.connections[primaryOut]?.length ?? 1) : 1;

    nodes.push({
      id: nid,
      type: nodeType,
      data: { label, cellType, inputs, outputs, width },
      position: { x: 0, y: 0 },
    });
  }

  // ── 5. Create edges ───────────────────────────────────────────────────────
  let edgeIdx = 0;

  /**
   * For a given sink (nodeId + portName) and its bit-vector, find the source
   * node(s) and emit edges.  We group contiguous bits that share the same
   * source into one edge.
   */
  function emitEdges(
    sinkNodeId: string,
    sinkPortName: string,
    bits: YosBit[],
  ): void {
    // Collect sources referenced by numeric bits in this connection.
    // Key: "srcNodeId::srcPortName"
    const seenSources = new Map<string, { src: PortRef; width: number; firstBit: number }>();

    for (const bit of bits) {
      if (typeof bit !== 'number') continue; // constant bit ('0','1','x','z')
      const src = bitSource.get(bit);
      if (!src) continue;
      const key = `${src.nodeId}::${src.portName}`;
      const entry = seenSources.get(key);
      if (entry) {
        entry.width++;
      } else {
        seenSources.set(key, { src, width: 1, firstBit: bit });
      }
    }

    for (const [, { src, width, firstBit }] of seenSources) {
      const netName = bitNetName.get(firstBit);
      edges.push({
        id: `edge_${edgeIdx++}`,
        source: src.nodeId,
        target: sinkNodeId,
        sourceHandle: handleId(src.nodeId, src.portName),
        targetHandle: handleId(sinkNodeId, sinkPortName),
        data: { width, netName },
        label: netName,
      });
    }
  }

  // Edges into cell input ports
  for (const [cellName, cell] of Object.entries(mod.cells)) {
    const nid = sanitiseId(cellName);
    for (const [portName, dir] of Object.entries(cell.port_directions)) {
      if (dir === 'input') {
        const bits = cell.connections[portName] ?? [];
        emitEdges(nid, portName, bits);
      }
    }
  }

  // Edges into module output ports
  for (const [pName, port] of Object.entries(mod.ports)) {
    if (port.direction === 'output') {
      const nid = portNodeId(pName, 'output');
      emitEdges(nid, pName, port.bits);
    }
  }

  return { nodes, edges };
}
