/**
 * Semantic zoom — maps React Flow viewport zoom to a discrete detail level.
 *
 * Uses `useStore` with a selector so nodes only re-render when the
 * *level* changes (crossing a threshold), not on every zoom/pan pixel.
 */

import { useStore } from '@xyflow/react';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Four detail levels driven by the viewport zoom percentage.
 *
 * | Level    | Zoom       | Rendered content                                  |
 * |----------|------------|---------------------------------------------------|
 * | 'box'    | < 30 %     | Coloured module box only; no labels               |
 * | 'names'  | 30 – 80 %  | Module + instance names; port names on hover      |
 * | 'full'   | 80 – 150 % | Full port labels + bus-width annotations          |
 * | 'detail' | > 150 %    | + width annotation on every port (single-bit too) |
 */
export type DetailLevel = 'box' | 'names' | 'full' | 'detail';

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Pure function — maps a raw zoom number (1.0 = 100 %) to a `DetailLevel`.
 * Exported so it can be unit-tested without a React context.
 */
export function zoomToDetailLevel(zoom: number): DetailLevel {
  if (zoom < 0.3) return 'box';
  if (zoom < 0.8) return 'names';
  if (zoom <= 1.5) return 'full';
  return 'detail';
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the current semantic detail level derived from the React Flow
 * viewport zoom.  Must be called inside a `<ReactFlow>` provider.
 *
 * The selector projects the continuous zoom value to one of four strings,
 * so this hook only triggers a re-render when the level *changes* — not on
 * every zoom/pan event.
 */
export function useDetailLevel(): DetailLevel {
  return useStore((state) => zoomToDetailLevel(state.transform[2]));
}
