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

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type ColorMode,
  type EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ModuleNode, type ModuleNodeType } from './ModuleNode';
import { WireEdge, type WireEdgeType, type WireEdgeData } from './WireEdge';
import { exportAsSvg, exportAsPng } from '../core/export';

// ── Node / edge type maps ─────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  module: ModuleNode as unknown as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  wire: WireEdge as unknown as EdgeTypes[string],
};

// ── Props ─────────────────────────────────────────────────────────────────────

// ── Imperative handle ─────────────────────────────────────────────────────────

export interface DiagramCanvasHandle {
  /** Programmatically fit the diagram to the viewport. */
  fitView: () => void;
  /** Export diagram as SVG file download. */
  exportSvg: (theme: 'dark' | 'light') => Promise<void>;
  /** Export diagram as PNG file download. */
  exportPng: (theme: 'dark' | 'light') => Promise<void>;
}

// ── Inner helper — must live inside the ReactFlow provider ────────────────────

function FitViewBridge({
  fitViewRef,
}: {
  fitViewRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { fitView } = useReactFlow();
  // Update the ref on every render so callers always get the latest function.
  fitViewRef.current = () => fitView({ padding: 0.2 });
  // Clean up when unmounted
  useEffect(() => {
    return () => {
      fitViewRef.current = null;
    };
  }, [fitViewRef]);
  return null;
}

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
  /**
   * Called when the user clicks a wire edge.
   * Passes the edge's signal name so the editor can highlight it.
   */
  onSignalSelect?: (signal: string | null) => void;
  /**
   * The currently active signal name (set from editor click).
   * Edges whose signalName matches will be highlighted.
   */
  selectedSignal?: string | null;
  /** Called when the user right-clicks a wire and selects "Add to waveform". */
  onAddToWaveform?: (signalName: string) => void;
  /** Forward ref for imperative fitView etc. */
  className?: string;
  style?: React.CSSProperties;
}

// ── DiagramCanvas ─────────────────────────────────────────────────────────────

export const DiagramCanvas = forwardRef<DiagramCanvasHandle, DiagramCanvasProps>(function DiagramCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  colorMode = 'dark',
  onPaneClick,
  onSignalSelect,
  selectedSignal,
  onAddToWaveform,
  className,
  style,
}: DiagramCanvasProps, ref: React.ForwardedRef<DiagramCanvasHandle>) {
  const fitViewRef = useRef<(() => void) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    fitView: () => fitViewRef.current?.(),
    exportSvg: (theme: 'dark' | 'light') => {
      if (!containerRef.current) return Promise.resolve();
      return exportAsSvg(containerRef.current, theme);
    },
    exportPng: (theme: 'dark' | 'light') => {
      if (!containerRef.current) return Promise.resolve();
      return exportAsPng(containerRef.current, theme);
    },
  }));
  // ── Context menu state ────────────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    signalName: string;
  } | null>(null);
  // Stable no-op fallbacks so ReactFlow doesn't warn about missing handlers
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => onNodesChange?.(changes),
    [onNodesChange],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => onEdgesChange?.(changes),
    [onEdgesChange],
  );

  // Wire click → notify parent so Editor can highlight the signal
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      const wireData = edge.data as WireEdgeData | undefined;
      onSignalSelect?.(wireData?.signalName ?? null);
    },
    [onSignalSelect],
  );

  // Wire right-click → context menu
  const handleEdgeContextMenu: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.preventDefault();
      const wireData = edge.data as WireEdgeData | undefined;
      const sigName = wireData?.signalName;
      if (!sigName || !onAddToWaveform) return;
      setCtxMenu({
        x: event.clientX,
        y: event.clientY,
        signalName: sigName,
      });
    },
    [onAddToWaveform],
  );

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  // Annotate edges with highlighted=true when their signal matches selectedSignal
  const annotatedEdges = useMemo(() => {
    if (!selectedSignal) return edges;
    return edges.map((e) => {
      const wireData = e.data as WireEdgeData | undefined;
      const isMatch = wireData?.signalName === selectedSignal;
      if (!isMatch && !wireData?.highlighted) return e;
      return {
        ...e,
        data: {
          ...wireData,
          signalName: wireData?.signalName ?? '',
          width: wireData?.width ?? '1',
          highlighted: isMatch,
        } satisfies WireEdgeData,
      };
    });
  }, [edges, selectedSignal]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--color-bg-canvas, #1a1b26)',
        position: 'relative',
        ...style,
      }}
      onClick={ctxMenu ? closeCtxMenu : undefined}
    >
      <ReactFlow<ModuleNodeType, WireEdgeType>
        nodes={nodes as ModuleNodeType[]}
        edges={annotatedEdges as WireEdgeType[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onPaneClick={onPaneClick}
        onEdgeClick={handleEdgeClick}
        onEdgeContextMenu={handleEdgeContextMenu}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={null}   /* disable accidental deletion */
        attributionPosition="bottom-left"
      >
        {/* Bridge to expose fitView outside the ReactFlow context */}
        <FitViewBridge fitViewRef={fitViewRef} />

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

      {/* Edge context menu */}
      {ctxMenu && (
        <div
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            background: 'var(--color-bg-surface, #24283b)',
            border: '1px solid var(--color-border, #3b4261)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            padding: '4px 0',
            zIndex: 9999,
            minWidth: 160,
            fontSize: 12,
            fontFamily: '"JetBrains Mono", monospace',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            style={{
              padding: '6px 14px',
              color: 'var(--color-text-muted, #565f89)',
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--color-border, #3b4261)',
            }}
          >
            {ctxMenu.signalName}
          </div>
          <button
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '7px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary, #c0caf5)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e =>
              ((e.target as HTMLButtonElement).style.background =
                'var(--color-bg-canvas, #1a1b26)')
            }
            onMouseLeave={e =>
              ((e.target as HTMLButtonElement).style.background = 'transparent')
            }
            onClick={() => {
              onAddToWaveform?.(ctxMenu.signalName);
              closeCtxMenu();
            }}
          >
            📈 Add to Waveform
          </button>
        </div>
      )}
    </div>
  );
}

);

export default DiagramCanvas;
