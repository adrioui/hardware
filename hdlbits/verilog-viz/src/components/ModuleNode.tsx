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
 */

import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

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
    boxShadow: selected
      ? '0 0 0 3px color-mix(in srgb, var(--color-node-selected) 35%, transparent)'
      : '0 2px 6px rgba(0,0,0,0.35)',
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

// ── Port row components ───────────────────────────────────────────────────────

interface PortRowProps {
  port: ModulePortData;
  side: 'left' | 'right';
}

function PortRow({ port, side }: PortRowProps) {
  const bus = isBus(port.width);
  const isInput = side === 'left';

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
  };

  const widthStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-muted)',
  };

  return (
    <div style={rowStyle}>
      {isInput && (
        <Handle
          type="target"
          position={Position.Left}
          id={port.name}
          style={handleStyle}
        />
      )}

      {isInput ? (
        /* Input: handle · label [width] */
        <span style={labelStyle}>
          {port.name}
          {bus && (
            <span style={widthStyle}>&thinsp;{port.width}</span>
          )}
        </span>
      ) : (
        /* Output: [width] label · handle */
        <span style={labelStyle}>
          {bus && (
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
  const inputPorts = data.ports.filter(
    (p) => p.direction === 'input' || p.direction === 'inout',
  );
  const outputPorts = data.ports.filter((p) => p.direction === 'output');

  return (
    <div style={nodeContainerStyle(selected ?? false)}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        <div style={moduleTypeStyle}>{data.moduleType}</div>
        {data.instanceName !== data.moduleType && (
          <div style={instanceNameStyle}>{data.instanceName}</div>
        )}
      </div>

      {/* ── Ports ── */}
      <div style={portsContainerStyle}>
        {/* Left column — inputs / inouts */}
        <div style={portColumnStyle}>
          {inputPorts.map((port) => (
            <PortRow key={port.name} port={port} side="left" />
          ))}
        </div>

        {/* Right column — outputs */}
        <div style={portColumnStyle}>
          {outputPorts.map((port) => (
            <PortRow key={port.name} port={port} side="right" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModuleNode;
