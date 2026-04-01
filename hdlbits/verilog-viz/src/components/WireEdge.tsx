/**
 * Custom React Flow edge for Verilog wire connections.
 *
 * Features:
 *  - Orthogonal (Manhattan) routing: uses ELK bend points when available,
 *    otherwise falls back to React Flow's getSmoothStepPath.
 *  - Single-bit: 1 px stroke.
 *  - Bus (multi-bit): 2.5 px stroke + diagonal slash + width label.
 *  - Stroke colour derived from signal type (data/clock/reset/control).
 *  - Hover: stroke widens to 2 px, tooltip shows signal name + width.
 */

import React, { useState } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps, type Edge } from '@xyflow/react';
import { inferSignalType, SIGNAL_COLORS } from '../theme/colors';

// ── Data type ─────────────────────────────────────────────────────────────────

export interface WireEdgeData extends Record<string, unknown> {
  /** Net / signal name (e.g. "sum", "clk") */
  signalName: string;
  /**
   * Bit-width descriptor.
   * "[7:0]" → 8-bit bus, "[3:0]" → 4-bit bus, "1" or "" → single-bit.
   */
  width: string;
  /** Optional ELK-computed bend points (populated by useLayout). */
  bendPoints?: { x: number; y: number }[];
}

export type WireEdgeType = Edge<WireEdgeData, 'wire'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when the width string denotes a multi-bit bus. */
function isBus(width: string): boolean {
  if (!width) return false;
  if (width.trim().startsWith('[')) return true;
  const n = parseInt(width, 10);
  return !isNaN(n) && n > 1;
}

/**
 * Build an SVG path string from a sequence of (x, y) waypoints
 * using horizontal–vertical–horizontal segments (Manhattan routing).
 */
function buildPolylinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  return `M ${first.x} ${first.y} ${segments}`;
}

/**
 * Compute the midpoint of a polyline (used to anchor the bus annotation).
 */
function polylineMidpoint(
  points: { x: number; y: number }[],
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const mid = Math.floor(points.length / 2);
  const a = points[mid - 1];
  const b = points[mid];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ── WireEdge component ────────────────────────────────────────────────────────

export function WireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  markerStart,
  style,
  selected,
}: EdgeProps<WireEdgeType>) {
  const [hovered, setHovered] = useState(false);

  // ── Resolve signal metadata ──────────────────────────────────────────────
  const signalName = data?.signalName ?? '';
  const width = data?.width ?? '';
  const bus = isBus(width);

  const sigType = inferSignalType(signalName);
  const color = SIGNAL_COLORS[sigType];

  const strokeWidth = hovered
    ? 2
    : bus
      ? 2.5
      : 1;

  // ── Build SVG path ────────────────────────────────────────────────────────
  let pathStr: string;
  let labelX: number;
  let labelY: number;

  const bendPoints = data?.bendPoints;

  if (bendPoints && bendPoints.length >= 2) {
    // Use ELK-provided orthogonal bend points
    const allPoints = [
      { x: sourceX, y: sourceY },
      ...bendPoints,
      { x: targetX, y: targetY },
    ];
    pathStr = buildPolylinePath(allPoints);
    const mid = polylineMidpoint(allPoints);
    labelX = mid.x;
    labelY = mid.y;
  } else {
    // Fallback: smooth-step path (orthogonal-ish)
    [pathStr, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 0,
    });
  }

  // ── Tooltip text ──────────────────────────────────────────────────────────
  const tooltip = bus
    ? `${signalName} ${width}`
    : signalName;

  // ── Bus annotation (diagonal slash + label) ───────────────────────────────
  const SLASH_LEN = 7;
  const slashPath = bus
    ? `M ${labelX - SLASH_LEN / 2} ${labelY + SLASH_LEN / 2} L ${labelX + SLASH_LEN / 2} ${labelY - SLASH_LEN / 2}`
    : null;

  // ── Edge style ────────────────────────────────────────────────────────────
  const edgeStyle: React.CSSProperties = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    transition: 'stroke-width 0.1s ease',
    ...style,
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible wide hit area */}
      <path
        d={pathStr}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible wire */}
      <BaseEdge
        id={id}
        path={pathStr}
        labelX={labelX}
        labelY={labelY}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={edgeStyle}
      />

      {/* Bus annotation */}
      {bus && (
        <g>
          {/* Diagonal slash */}
          {slashPath && (
            <path
              d={slashPath}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Width label */}
          <text
            x={labelX + 6}
            y={labelY - 4}
            style={{
              fontSize: 9,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fill: color,
              opacity: 0.9,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {width}
          </text>
        </g>
      )}

      {/* Tooltip (shown on hover) */}
      {hovered && tooltip && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={labelX + 4}
            y={labelY - 22}
            width={tooltip.length * 6.5 + 8}
            height={16}
            rx={3}
            fill="var(--color-bg-surface, #24283b)"
            stroke="var(--color-border, #3b4261)"
            strokeWidth={0.75}
            opacity={0.92}
          />
          <text
            x={labelX + 8}
            y={labelY - 11}
            style={{
              fontSize: 10,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fill: 'var(--color-text-primary, #c0caf5)',
              userSelect: 'none',
            }}
          >
            {tooltip}
          </text>
        </g>
      )}
    </g>
  );
}

export default WireEdge;
