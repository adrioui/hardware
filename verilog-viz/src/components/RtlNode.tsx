/**
 * RTL-schematic React Flow node components.
 *
 * Nodes map to Yosys cell types produced by `rtl-converter.ts`:
 *   OperatorNode — $add $sub $mul $div $mod $eq $ne $lt $le $gt $ge $shl $shr …
 *   MuxNode      — $mux $pmux
 *   DffNode      — $dff $adff $sdff $dffe $adffe $sdffe $sdffce $ff
 *   GateNode     — $and $or $not $xor $xnor $nand $nor $buf $reduce_* $logic_*
 *   ConstantNode — constant drivers
 *   PortNode     — module boundary (inputPort / outputPort)
 *
 * All nodes share `RtlNodeData` from `../core/rtl-converter`.
 * Handle IDs follow the converter convention: `${nodeId}::${portName}`.
 */

import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { RtlNodeData } from '../core/rtl-converter';

// ── Re-export for consumers ────────────────────────────────────────────────────

/** Convenience alias used in nodeTypes maps and generics. */
export type RtlFlowNode = Node<RtlNodeData>;

// ── Design tokens ─────────────────────────────────────────────────────────────

const FONT = '"JetBrains Mono", "Fira Code", monospace';
const RADIUS = 4;
const HANDLE_SIZE = 8;

// Per-node-type accent colours (border + header tint)
const ACCENT: Record<string, string> = {
  operator: 'var(--color-wire-data, #7aa2f7)',
  gate:     'var(--color-port-input, #9ece6a)',
  mux:      '#bb9af7',
  dff:      'var(--color-wire-clock, #e0af68)',
  constant: 'var(--color-text-muted, #565f89)',
  inputPort:  'var(--color-port-input, #9ece6a)',
  outputPort: 'var(--color-port-output, #f7768e)',
  unknown:    'var(--color-node-border, #3b4261)',
};

// ── Shared helpers ─────────────────────────────────────────────────────────────

/** Returns the React Flow handle id that matches the converter's convention. */
function hid(nodeId: string, portName: string): string {
  return `${nodeId}::${portName}`;
}

/** True when the port name indicates it carries the clock signal. */
function isClock(name: string): boolean {
  return /^clk$/i.test(name) || /^clock$/i.test(name) || name.toUpperCase() === 'CLK';
}

// ── Shared sub-components ──────────────────────────────────────────────────────

interface PortHandleRowProps {
  nodeId: string;
  portName: string;
  side: 'left' | 'right';
  /** Render a clock triangle instead of a normal bullet. */
  showClockMarker?: boolean;
}

function PortHandleRow({ nodeId, portName, side, showClockMarker }: PortHandleRowProps) {
  const isLeft = side === 'left';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isLeft ? 'flex-start' : 'flex-end',
        height: 22,
        position: 'relative',
        paddingLeft: isLeft ? 8 : 0,
        paddingRight: isLeft ? 0 : 8,
        gap: 4,
      }}
    >
      {isLeft && (
        <Handle
          type="target"
          position={Position.Left}
          id={hid(nodeId, portName)}
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: 'var(--color-port-input, #9ece6a)',
            border: 'none',
          }}
        />
      )}

      {/* Clock triangle marker */}
      {showClockMarker && isLeft && (
        <svg width={10} height={10} style={{ flexShrink: 0 }}>
          <polygon points="0,0 10,5 0,10" fill="var(--color-wire-clock, #e0af68)" />
        </svg>
      )}

      <span
        style={{
          fontFamily: FONT,
          fontSize: 10,
          color: 'var(--color-text-secondary, #a9b1d6)',
          whiteSpace: 'nowrap',
        }}
      >
        {portName}
      </span>

      {!isLeft && (
        <Handle
          type="source"
          position={Position.Right}
          id={hid(nodeId, portName)}
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: 'var(--color-port-output, #f7768e)',
            border: 'none',
          }}
        />
      )}
    </div>
  );
}

// ── Shared layout: two-column port rows + header ───────────────────────────────

interface StandardNodeLayoutProps {
  nodeId: string;
  label: string;
  subtitle?: string;
  accent: string;
  inputs: string[];
  outputs: string[];
  /** Override handle type for CLK-like ports to render a triangle. */
  clockPorts?: Set<string>;
  /** Extra content below the header (e.g. SVG shape). */
  children?: React.ReactNode;
  selected: boolean;
  minWidth?: number;
}

function StandardNodeLayout({
  nodeId,
  label,
  subtitle,
  accent,
  inputs,
  outputs,
  clockPorts,
  children,
  selected,
  minWidth = 90,
}: StandardNodeLayoutProps) {
  return (
    <div
      style={{
        fontFamily: FONT,
        background: 'var(--color-node-bg, #292e42)',
        border: `1.5px solid ${selected ? accent : 'var(--color-node-border, #3b4261)'}`,
        borderRadius: RADIUS,
        minWidth,
        boxShadow: selected
          ? `0 0 0 3px color-mix(in srgb, ${accent} 35%, transparent)`
          : '0 2px 6px rgba(0,0,0,0.35)',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `color-mix(in srgb, ${accent} 18%, var(--color-node-bg, #292e42))`,
          borderBottom: `1px solid var(--color-node-border, #3b4261)`,
          borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
          padding: '4px 10px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: accent,
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: 9, color: 'var(--color-text-muted, #565f89)' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Optional extra content */}
      {children}

      {/* Port rows */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '3px 0',
          gap: 12,
        }}
      >
        {/* Left column — inputs */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {inputs.map((p) => (
            <PortHandleRow
              key={p}
              nodeId={nodeId}
              portName={p}
              side="left"
              showClockMarker={clockPorts?.has(p)}
            />
          ))}
        </div>

        {/* Right column — outputs */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {outputs.map((p) => (
            <PortHandleRow key={p} nodeId={nodeId} portName={p} side="right" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── OperatorNode ───────────────────────────────────────────────────────────────
// $add $sub $mul $div $mod $pow $eq $ne $lt $le $gt $ge $shl $shr $sshl $sshr

export type OperatorNodeType = Node<RtlNodeData, 'operator'>;

export function OperatorNode({ id, data, selected }: NodeProps<OperatorNodeType>) {
  return (
    <StandardNodeLayout
      nodeId={id}
      label={data.label}
      subtitle={data.width !== undefined && data.width > 1 ? `[${data.width - 1}:0]` : undefined}
      accent={ACCENT.operator}
      inputs={data.inputs}
      outputs={data.outputs}
      selected={selected ?? false}
      minWidth={80}
    />
  );
}

// ── GateNode ───────────────────────────────────────────────────────────────────
// $and $or $not $xor $xnor $nand $nor $buf $reduce_* $logic_*

export type GateNodeType = Node<RtlNodeData, 'gate'>;

export function GateNode({ id, data, selected }: NodeProps<GateNodeType>) {
  return (
    <StandardNodeLayout
      nodeId={id}
      label={data.label}
      accent={ACCENT.gate}
      inputs={data.inputs}
      outputs={data.outputs}
      selected={selected ?? false}
      minWidth={80}
    />
  );
}

// ── MuxNode ────────────────────────────────────────────────────────────────────
// $mux $pmux
//
// Renders a trapezoid-shaped MUX symbol using SVG clip-path styling.
// Input ports (D0, D1 …) on the left; SELECT port (S) below; output (Y) right.

export type MuxNodeType = Node<RtlNodeData, 'mux'>;

export function MuxNode({ id, data, selected }: NodeProps<MuxNodeType>) {
  // Separate data inputs from the select input
  const selectPorts = data.inputs.filter((p) => p === 'S' || p === 'SEL' || p.startsWith('S'));
  const dataPorts   = data.inputs.filter((p) => !selectPorts.includes(p));

  const accent = ACCENT.mux;

  return (
    <div
      style={{
        fontFamily: FONT,
        background: 'var(--color-node-bg, #292e42)',
        border: `1.5px solid ${selected ? accent : 'var(--color-node-border, #3b4261)'}`,
        borderRadius: RADIUS,
        minWidth: 90,
        boxShadow: selected
          ? `0 0 0 3px color-mix(in srgb, ${accent} 35%, transparent)`
          : '0 2px 6px rgba(0,0,0,0.35)',
        userSelect: 'none',
        // Trapezoid: full-height on left, tapered on right
        clipPath: 'polygon(0% 0%, 100% 12%, 100% 88%, 0% 100%)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `color-mix(in srgb, ${accent} 20%, var(--color-node-bg, #292e42))`,
          borderBottom: `1px solid var(--color-node-border, #3b4261)`,
          padding: '4px 10px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: accent }}>
          {data.label}
        </span>
      </div>

      {/* Ports */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', gap: 12 }}>
        {/* Left column: data inputs, then select */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {dataPorts.map((p) => (
            <PortHandleRow key={p} nodeId={id} portName={p} side="left" />
          ))}
          {selectPorts.map((p) => (
            <PortHandleRow key={p} nodeId={id} portName={p} side="left" />
          ))}
        </div>

        {/* Right column: output */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.outputs.map((p) => (
            <PortHandleRow key={p} nodeId={id} portName={p} side="right" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DffNode ────────────────────────────────────────────────────────────────────
// $dff $adff $sdff $dffe $adffe $sdffe $sdffce $ff
//
// Renders a rectangle with a clock-triangle marker on the CLK port row.

export type DffNodeType = Node<RtlNodeData, 'dff'>;

export function DffNode({ id, data, selected }: NodeProps<DffNodeType>) {
  const accent = ACCENT.dff;
  const clockPorts = new Set(data.inputs.filter(isClock));

  return (
    <StandardNodeLayout
      nodeId={id}
      label={data.label}
      subtitle={data.width !== undefined && data.width > 1 ? `[${data.width - 1}:0]` : undefined}
      accent={accent}
      inputs={data.inputs}
      outputs={data.outputs}
      clockPorts={clockPorts}
      selected={selected ?? false}
      minWidth={90}
    />
  );
}

// ── ConstantNode ───────────────────────────────────────────────────────────────
// Compact chip for constant drivers.

export type ConstantNodeType = Node<RtlNodeData, 'constant'>;

export function ConstantNode({ id, data, selected }: NodeProps<ConstantNodeType>) {
  const accent = ACCENT.constant;
  return (
    <div
      style={{
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px 3px 4px',
        background: 'var(--color-node-bg, #292e42)',
        border: `1px solid ${selected ? accent : 'var(--color-node-border, #3b4261)'}`,
        borderRadius: 12,
        userSelect: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
    >
      {/* Const label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: accent,
          whiteSpace: 'nowrap',
          paddingLeft: 2,
        }}
      >
        {data.label}
      </span>

      {/* Output handle */}
      {data.outputs.map((p) => (
        <Handle
          key={p}
          type="source"
          position={Position.Right}
          id={hid(id, p)}
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: 'var(--color-port-output, #f7768e)',
            border: 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── PortNode ───────────────────────────────────────────────────────────────────
// Module boundary ports (inputPort / outputPort).

export type InputPortNodeType  = Node<RtlNodeData, 'inputPort'>;
export type OutputPortNodeType = Node<RtlNodeData, 'outputPort'>;

interface PortNodeProps {
  id: string;
  data: RtlNodeData;
  selected: boolean;
  isInput: boolean;
}

function PortNodeInner({ id, data, selected, isInput }: PortNodeProps) {
  const accent = isInput ? ACCENT.inputPort : ACCENT.outputPort;
  const widthLabel =
    data.width !== undefined && data.width > 1 ? `[${data.width - 1}:0]` : '';

  return (
    <div
      style={{
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: 'var(--color-node-bg, #292e42)',
        border: `1.5px solid ${selected ? accent : accent + '88'}`,
        borderRadius: 16,
        userSelect: 'none',
        boxShadow: selected
          ? `0 0 0 3px color-mix(in srgb, ${accent} 35%, transparent)`
          : '0 1px 4px rgba(0,0,0,0.3)',
        position: 'relative',
        minWidth: 70,
        justifyContent: 'center',
      }}
    >
      {/* Direction arrow */}
      <span style={{ fontSize: 10, color: accent }}>
        {isInput ? '→' : '←'}
      </span>

      <span style={{ fontSize: 11, fontWeight: 600, color: accent }}>
        {data.label}
      </span>

      {widthLabel && (
        <span style={{ fontSize: 9, color: 'var(--color-text-muted, #565f89)' }}>
          {widthLabel}
        </span>
      )}

      {/* Input port: source handle on the right */}
      {isInput && data.outputs.map((p) => (
        <Handle
          key={p}
          type="source"
          position={Position.Right}
          id={hid(id, p)}
          style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, background: accent, border: 'none' }}
        />
      ))}

      {/* Output port: target handle on the left */}
      {!isInput && data.inputs.map((p) => (
        <Handle
          key={p}
          type="target"
          position={Position.Left}
          id={hid(id, p)}
          style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, background: accent, border: 'none' }}
        />
      ))}
    </div>
  );
}

export function InputPortNode({ id, data, selected }: NodeProps<InputPortNodeType>) {
  return <PortNodeInner id={id} data={data} selected={selected ?? false} isInput />;
}

export function OutputPortNode({ id, data, selected }: NodeProps<OutputPortNodeType>) {
  return <PortNodeInner id={id} data={data} selected={selected ?? false} isInput={false} />;
}

// ── UnknownNode ────────────────────────────────────────────────────────────────
// Fallback for unrecognised cell types.

export type UnknownNodeType = Node<RtlNodeData, 'unknown'>;

export function UnknownNode({ id, data, selected }: NodeProps<UnknownNodeType>) {
  return (
    <StandardNodeLayout
      nodeId={id}
      label={data.label}
      subtitle={data.cellType}
      accent={ACCENT.unknown}
      inputs={data.inputs}
      outputs={data.outputs}
      selected={selected ?? false}
    />
  );
}
