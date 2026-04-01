/**
 * useLayout — converts ParsedDesign → ELK graph → ELK layout → React Flow nodes/edges.
 *
 * Pipeline:
 *   1. convertToElk(design)         builds the ELK JSON graph
 *   2. layoutGraph(elkGraph)         runs ELK.js async layout
 *   3. elkToReactFlow(laidOut, ...)  maps ELK nodes/edges → RF nodes/edges
 *
 * Returns { nodes, edges, isLayouting }.  Re-runs whenever `design` reference changes.
 */

import { useState, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ParsedDesign } from '../types';
import {
  convertToElk,
  findTopModule,
  BOUNDARY_IN_ID,
  BOUNDARY_OUT_ID,
} from '../core/converter';
import type { ElkEdge } from '../core/converter';
import { layoutGraph } from '../core/elk-layout';
import type { ModuleNodeData, ModulePortData } from '../components/ModuleNode';
import type { WireEdgeData } from '../components/WireEdge';

// ── ELK section types (added by layout, not in our base ElkEdge) ───────────────

interface ElkEdgeSection {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  bendPoints?: { x: number; y: number }[];
}

interface LaidOutElkEdge extends ElkEdge {
  sections?: ElkEdgeSection[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "nodeId.portName" → "nodeId" */
function extractNodeId(portRef: string): string {
  const dot = portRef.lastIndexOf('.');
  return dot >= 0 ? portRef.slice(0, dot) : portRef;
}

/** "nodeId.portName" → "portName" */
function extractPortName(portRef: string): string {
  const dot = portRef.lastIndexOf('.');
  return dot >= 0 ? portRef.slice(dot + 1) : portRef;
}

// ── ELK → React Flow conversion ───────────────────────────────────────────────

function elkToReactFlow(
  laidOut: ReturnType<typeof convertToElk>,
  design: ParsedDesign,
  topModuleName?: string,
): { nodes: Node[]; edges: Edge[] } {
  const topModule = findTopModule(design, topModuleName);
  if (!topModule) return { nodes: [], edges: [] };

  // ── Build per-instance info (moduleType + ports) ──────────────────────────
  const instanceInfo = new Map<
    string,
    { moduleType: string; ports: ModulePortData[] }
  >();

  for (const inst of topModule.instances) {
    const defMod = design.modules.get(inst.moduleName);
    const ports: ModulePortData[] = defMod
      ? defMod.ports.map((p) => ({
          name: p.name,
          direction: p.direction,
          width: p.width,
        }))
      : [...inst.connections.keys()].map((pName) => ({
          name: pName,
          direction: 'input' as const,
          width: '1',
        }));
    instanceInfo.set(inst.instanceName, { moduleType: inst.moduleName, ports });
  }

  // ── Top-level boundary port lists ─────────────────────────────────────────
  const inputPorts = topModule.ports.filter(
    (p) => p.direction === 'input' || p.direction === 'inout',
  );
  const outputPorts = topModule.ports.filter((p) => p.direction === 'output');

  // ── Signal width map  (signal name → width string) ────────────────────────
  const signalWidthMap = new Map<string, string>();

  for (const port of topModule.ports) {
    signalWidthMap.set(port.name, port.width);
  }
  for (const inst of topModule.instances) {
    const defMod = design.modules.get(inst.moduleName);
    if (!defMod) continue;
    for (const [portName, signalName] of inst.connections) {
      if (!signalWidthMap.has(signalName)) {
        const port = defMod.ports.find((p) => p.name === portName);
        if (port) signalWidthMap.set(signalName, port.width);
      }
    }
  }

  // ── Convert ELK nodes → React Flow nodes ─────────────────────────────────
  const nodes: Node[] = laidOut.children.map((elkNode, entranceIndex) => {
    let data: ModuleNodeData;

    if (elkNode.id === BOUNDARY_IN_ID) {
      // Boundary-in acts as a source for the diagram — ports face RIGHT (output)
      data = {
        moduleType: topModule.name,
        instanceName: 'Inputs',
        ports: inputPorts.map((p) => ({
          name: p.name,
          direction: 'output' as const,
          width: p.width,
        })),
      };
    } else if (elkNode.id === BOUNDARY_OUT_ID) {
      // Boundary-out is a sink — ports face LEFT (input)
      data = {
        moduleType: topModule.name,
        instanceName: 'Outputs',
        ports: outputPorts.map((p) => ({
          name: p.name,
          direction: 'input' as const,
          width: p.width,
        })),
      };
    } else {
      const info = instanceInfo.get(elkNode.id);
      data = {
        moduleType: info?.moduleType ?? elkNode.id,
        instanceName: elkNode.id,
        ports: info?.ports ?? [],
      };
    }

    // Tag each node with its index so ModuleNode can stagger entrance animation
    data = { ...data, entranceIndex };

    return {
      id: elkNode.id,
      type: 'module',
      position: { x: elkNode.x ?? 0, y: elkNode.y ?? 0 },
      data,
    } satisfies Node<ModuleNodeData>;
  });

  // ── Convert ELK edges → React Flow edges ─────────────────────────────────
  const edges: Edge[] = laidOut.edges.map((elkEdge) => {
    const sourceRef = elkEdge.sources[0] ?? '';
    const targetRef = elkEdge.targets[0] ?? '';

    const signalName = elkEdge.labels?.[0]?.text ?? '';
    const width = signalWidthMap.get(signalName) ?? '1';

    // ELK populates `sections` with bend points after layout
    const bendPoints: { x: number; y: number }[] =
      (elkEdge as LaidOutElkEdge).sections?.[0]?.bendPoints ?? [];

    const data: WireEdgeData = {
      signalName,
      width,
      ...(bendPoints.length > 0 ? { bendPoints } : {}),
    };

    return {
      id: elkEdge.id,
      type: 'wire',
      source: extractNodeId(sourceRef),
      target: extractNodeId(targetRef),
      sourceHandle: extractPortName(sourceRef),
      targetHandle: extractPortName(targetRef),
      data,
    } satisfies Edge<WireEdgeData>;
  });

  return { nodes, edges };
}

// ── Public result type ────────────────────────────────────────────────────────

export interface UseLayoutResult {
  nodes: Node[];
  edges: Edge[];
  isLayouting: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Converts a `ParsedDesign` into laid-out React Flow nodes and edges.
 *
 * @param design         Parsed Verilog design (or null when editor is empty).
 * @param topModuleName  Optional override for which module is the top level.
 * @param triggerKey     Increment to force a re-layout even if design hasn't changed.
 */
export function useLayout(
  design: ParsedDesign | null,
  topModuleName?: string,
  triggerKey?: number,
): UseLayoutResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLayouting, setIsLayouting] = useState(false);

  useEffect(() => {
    if (!design) {
      setNodes([]);
      setEdges([]);
      setIsLayouting(false);
      return;
    }

    let cancelled = false;
    setIsLayouting(true);

    void (async () => {
      try {
        const elkGraph = convertToElk(design, topModuleName);
        const laidOut = await layoutGraph(elkGraph);

        if (cancelled) return;

        const { nodes: rfNodes, edges: rfEdges } = elkToReactFlow(
          laidOut,
          design,
          topModuleName,
        );
        setNodes(rfNodes);
        setEdges(rfEdges);
      } catch (err) {
        if (!cancelled) {
          console.error('[useLayout] layout error:', err);
          setNodes([]);
          setEdges([]);
        }
      } finally {
        if (!cancelled) {
          setIsLayouting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [design, topModuleName, triggerKey]);

  return { nodes, edges, isLayouting };
}
