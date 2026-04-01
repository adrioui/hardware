/**
 * Custom React Flow node for a Verilog module instance.
 *
 * Renders a rectangle with:
 *   - Module type name (top, bold, monospace)
 *   - Instance name (subtitle, dimmer)
 *   - Left-side input / inout ports  (green handles + labels)
 *   - Right-side output ports         (orange handles + labels)
 *   - Bus ports: width annotation shown next to the port name
 *   - Selected state: accent border + glow
 *
 * Semantic zoom (via `useDetailLevel`):
 *   'box'    – coloured box only; all text hidden
 *   'names'  – header text visible; port labels hidden until port is hovered
 *   'full'   – full labels + bus-width annotations  (default)
 *   'detail' – full labels + width annotation on every port
 */

import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useDetailLevel, type DetailLevel } from '../hooks/useZoomLevel';

// ── Data type attached to each ModuleNode ─────────────────────────────────────

export interface ModulePortData {
  name: string;
  direction: 'input' | 'output' | 'inout';
  /** e.g. "[7:0]" for bus, "1" for single-bit */
  width: string;
}

export interface ModuleNodeData extends Record<string, unknown> {
  /** The module definition name (e.g. "full_adder") */
  moduleType: string;
  /** The instance label (e.g. "fa0") */
  instanceName: string;
  ports: ModulePortData[];
  /** Index within the layout batch — used to stagger entrance animations. */
  entranceIndex?: number;
}

/** React Flow node type used as the generic parameter in nodeTypes map */
export type ModuleNodeType = Node<ModuleNodeData, 'module'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when the port width looks like a bus ("[N:M]" notation). */
function isBus(width: string): boolean {
  return width.trim().startsWith('[');
}

const PORT_ROW_HEIGHT = 20; // px, must match PORT_SPACING in converter.ts

// ── Styles ────────────────────────────────────────────────────────────────────

const FONT_FAMILY = '"JetBrains Mono", "Fira Code", monospace';

function nodeContainerStyle(selected: boolean): React.CSSProperties {
  return {
    fontFamily: FONT_FAMILY,
    background: 'var(--color-node-bg)',
    border: `1.5px solid ${selected ? 'var(--color-node-selected)' : 'var(--color-node-border)'}`,
    borderRadius: 4,
    minWidth: 120,
    // boxShadow is controlled by CSS animation classes
    boxShadow: selected ? undefined : '0 2px 6px rgba(0,0,0,0.35)',
    userSelect: 'none',
  };
}

const headerStyle: React.CSSProperties = {
  padding: '5px 10px 3px',
  borderBottom: '1px solid var(--color-node-border)',
  textAlign: 'center',
};

const moduleTypeStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 12,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
};

const instanceNameStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
};

const portsContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '4px 0',
  gap: 16,
};

const portColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

// ── Port row component ────────────────────────────────────────────────────────

interface PortRowProps {
  port: ModulePortData;
  side: 'left' | 'right';
  /** Semantic zoom level forwarded from parent. */
  detailLevel: DetailLevel;
}

function PortRow({ port, side, detailLevel }: PortRowProps) {
  const [hovered, setHovered] = useState(false);

  const bus = isBus(port.width);
  const isInput = side === 'left';

  // ── Visibility rules per level ──────────────────────────────────────────
  // 'box'    → handles only, all text invisible (opacity 0 to keep dimensions)
  // 'names'  → label visible only when this port row is hovered
  // 'full'   → label always visible; width annotation only for buses
  // 'detail' → label always visible; width annotation for all ports
  const showLabel =
    detailLevel !== 'box' && (detailLevel !== 'names' || hovered);
  const showWidth =
    showLabel &&
    (detailLevel === 'detail' || (detailLevel === 'full' && bus));

  // ── Handle style ─────────────────────────────────────────────────────────
  const handleStyle: React.CSSProperties = {
    background: isInput
      ? 'var(--color-port-input)'
      : 'var(--color-port-output)',
    border: bus
      ? `1.5px solid ${isInput ? 'var(--color-port-input)' : 'var(--color-port-output)'}`
      : 'none',
    width: bus ? 7 : 5,
    height: bus ? 7 : 5,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: PORT_ROW_HEIGHT,
    gap: 5,
    paddingLeft: isInput ? 6 : 0,
    paddingRight: isInput ? 0 : 6,
    justifyContent: isInput ? 'flex-start' : 'flex-end',
    position: 'relative',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    opacity: showLabel ? 1 : 0,
    transition: 'opacity 0.12s ease',
    // Keep label in DOM so node width / height stays constant.
    pointerEvents: showLabel ? undefined : 'none',
  };

  const widthStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-muted)',
  };

  return (
    <div
      style={rowStyle}
      onMouseEnter={detailLevel === 'names' ? () => setHovered(true) : undefined}
      onMouseLeave={detailLevel === 'names' ? () => setHovered(false) : undefined}
    >
      {isInput && (
        <Handle
          type="target"
          position={Position.Left}
          id={port.name}
          style={handleStyle}
        />
      )}

      {isInput ? (
        /* Input side: handle · label [width] */
        <span style={labelStyle}>
          {port.name}
          {showWidth && (
            <span style={widthStyle}>&thinsp;{port.width}</span>
          )}
        </span>
      ) : (
        /* Output side: [width] label · handle */
        <span style={labelStyle}>
          {showWidth && (
            <span style={widthStyle}>{port.width}&thinsp;</span>
          )}
          {port.name}
        </span>
      )}

      {!isInput && (
        <Handle
          type="source"
          position={Position.Right}
          id={port.name}
          style={handleStyle}
        />
      )}
    </div>
  );
}

// ── ModuleNode ────────────────────────────────────────────────────────────────

export function ModuleNode({ data, selected }: NodeProps<ModuleNodeType>) {
  const detailLevel = useDetailLevel();
  const prevSelectedRef = useRef(selected);
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation each time the node becomes selected
  useEffect(() => {
    if (selected && !prevSelectedRef.current) {
      setPulseKey((k) => k + 1);
    }
    prevSelectedRef.current = selected;
  }, [selected]);

  const entranceDelay = `${(data.entranceIndex ?? 0) * 20}ms`;
  const animClass = selected ? 'rf-node-selected-pulse' : 'rf-node-enter';
  // Use key on the pulse span so the animation restarts each time
  const pulseSpanKey = selected ? pulseKey : 0;

  const inputPorts = data.ports.filter(
    (p) => p.direction === 'input' || p.direction === 'inout',
  );
  const outputPorts = data.ports.filter((p) => p.direction === 'output');

  // At 'box' level, hide header text but keep structural height.
  const headerTextVisible = detailLevel !== 'box';

  return (
    <div
      key={pulseSpanKey}
      className={animClass}
      style={{
        ...nodeContainerStyle(selected ?? false),
        animationDelay: selected ? '0ms' : entranceDelay,
      }}
    >
      {/* ── Header ── */}
      <div style={headerStyle}>
        <div
          style={{
            ...moduleTypeStyle,
            opacity: headerTextVisible ? 1 : 0,
            transition: 'opacity 0.12s ease',
          }}
        >
          {data.moduleType}
        </div>
        {data.instanceName !== data.moduleType && (
          <div
            style={{
              ...instanceNameStyle,
              opacity: headerTextVisible ? 1 : 0,
              transition: 'opacity 0.12s ease',
            }}
          >
            {data.instanceName}
          </div>
        )}
      </div>

      {/* ── Ports ── */}
      <div style={portsContainerStyle}>
        {/* Left column — inputs / inouts */}
        <div style={portColumnStyle}>
          {inputPorts.map((port) => (
            <PortRow
              key={port.name}
              port={port}
              side="left"
              detailLevel={detailLevel}
            />
          ))}
        </div>

        {/* Right column — outputs */}
        <div style={portColumnStyle}>
          {outputPorts.map((port) => (
            <PortRow
              key={port.name}
              port={port}
              side="right"
              detailLevel={detailLevel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModuleNode;
