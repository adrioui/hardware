/**
 * DiagramCanvas — React Flow canvas for the Verilog hierarchy visualizer.
 *
 * Features:
 *  - Dark theme (`colorMode="dark"`) with Tokyo Night palette
 *  - MiniMap (bottom-right), Controls (zoom in/out/fit), Background (dots)
 *  - fitView on initial render and whenever nodes/edges change
 *  - Custom node type: "module" → ModuleNode
 *  - Custom edge type: "wire"   → WireEdge
 */

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type ColorMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ModuleNode, type ModuleNodeType } from './ModuleNode';
import { WireEdge, type WireEdgeType } from './WireEdge';

// ── Node / edge type maps ─────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  module: ModuleNode as unknown as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  wire: WireEdge as unknown as EdgeTypes[string],
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DiagramCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  /** Toggle light/dark mode. Default: "dark". */
  colorMode?: ColorMode;
  /** Called when the user clicks on empty canvas space (deselects). */
  onPaneClick?: () => void;
  /** Forward ref for imperative fitView etc. */
  className?: string;
  style?: React.CSSProperties;
}

// ── DiagramCanvas ─────────────────────────────────────────────────────────────

export function DiagramCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  colorMode = 'dark',
  onPaneClick,
  className,
  style,
}: DiagramCanvasProps) {
  // Stable no-op fallbacks so ReactFlow doesn't warn about missing handlers
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => onNodesChange?.(changes),
    [onNodesChange],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => onEdgesChange?.(changes),
    [onEdgesChange],
  );

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--color-bg-canvas, #1a1b26)',
        ...style,
      }}
    >
      <ReactFlow<ModuleNodeType, WireEdgeType>
        nodes={nodes as ModuleNodeType[]}
        edges={edges as WireEdgeType[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onPaneClick={onPaneClick}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={null}   /* disable accidental deletion */
        attributionPosition="bottom-left"
      >
        {/* Dot-grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--color-border, #3b4261)"
        />

        {/* Zoom / fit controls — bottom-left by default */}
        <Controls showInteractive={false} />

        {/* MiniMap — bottom-right */}
        <MiniMap
          position="bottom-right"
          nodeColor="var(--color-node-bg, #292e42)"
          maskColor="rgba(26,27,38,0.65)"
          style={{ background: 'var(--color-bg-surface, #24283b)' }}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

export default DiagramCanvas;
