# Phase 2: Hierarchy Visualization (Tier 1)

## Overview

Convert parser output to ELK graph format, run ELK.js layout, and render as interactive React Flow diagram with custom module nodes and wire edges. Dark theme.

## Parser → ELK Converter

**File**: `src/core/converter.ts`

Converts `ParsedDesign` → ELK JSON graph format:

```typescript
interface ElkGraph {
  id: string;
  children: ElkNode[];
  edges: ElkEdge[];
  layoutOptions: Record<string, string>;
}
```

Logic:
- Each module instance → `ElkNode` with ports from the instantiated module's port declarations
- Each port connection → `ElkEdge` from source port to destination port
- Top-level module ports → special "boundary" nodes (inputs left, outputs right)
- ELK options: `algorithm: 'layered'`, `edgeRouting: 'ORTHOGONAL'`, `portConstraints: 'FIXED_ORDER'`, `direction: 'RIGHT'`
- Node height scales with port count: `base_height + (port_count * port_spacing)`

## ELK Layout Wrapper

**File**: `src/core/elk-layout.ts`

```typescript
import ELK from 'elkjs/lib/elk.bundled.js';
export async function layoutGraph(graph: ElkGraph): Promise<ElkGraph> {
  const elk = new ELK();
  return elk.layout(graph);
}
```

## Custom React Flow Node — ModuleNode

**File**: `src/components/ModuleNode.tsx`

Renders module instance as rectangle with:
- Module type name (top, bold, monospace)
- Instance name (subtitle, dimmer)
- Left-side input ports (circles + labels)
- Right-side output ports (circles + labels)
- Port labels in JetBrains Mono, 11px
- Bus ports: thicker line indicator
- Background: `var(--color-surface)`, border: `var(--color-border)`
- Selected state: accent border glow

## Custom React Flow Edge — WireEdge

**File**: `src/components/WireEdge.tsx`

- Orthogonal (Manhattan) routing using ELK bend points
- Single-bit: 1px line
- Bus (multi-bit): 2.5px line with diagonal slash mark and width label
- Color based on signal type (data=cyan, clock=amber, reset=red)
- Hover: wire thickens to 2px, tooltip shows signal name and width

## Diagram Canvas

**File**: `src/components/DiagramCanvas.tsx`

React Flow configured with:
- `colorMode="dark"` (default, toggle-able)
- `<MiniMap />` bottom-right, `<Controls />` for zoom, `<Background variant="dots" />`
- `fitView` on initial render and on code change
- Node types: `{ module: ModuleNode }`
- Edge types: `{ wire: WireEdge }`

## Hooks

**`src/hooks/useLayout.ts`**: Takes `ParsedDesign` → converter → ELK layout → React Flow nodes/edges. Returns `{ nodes, edges, isLayouting }`. Memoized.

**`src/hooks/useParser.ts`**: Takes editor content, debounces 300ms, runs parser. Returns `{ design, errors, isParsing }`.

## Dark Theme Tokens

**File**: `src/theme/tokens.css`

Tokyo Night palette CSS custom properties:

```css
:root {
  --color-bg-canvas: #1a1b26;
  --color-bg-surface: #24283b;
  --color-border: #3b4261;
  --color-text-primary: #c0caf5;
  --color-accent: #7dcfff;
  --color-wire-data: #7dcfff;
  --color-wire-clock: #e0af68;
  --color-wire-reset: #f7768e;
  --color-wire-control: #bb9af7;
  --color-port-input: #9ece6a;
  --color-port-output: #ff9e64;
  --color-node-bg: #292e42;
  --color-node-border: #3b4261;
  --color-node-selected: #7aa2f7;
}
```

Include `[data-theme="light"]` overrides.

## Signal Colors

**File**: `src/theme/colors.ts`

```typescript
export function inferSignalType(name: string): 'clock' | 'reset' | 'control' | 'data' {
  if (/clk|clock/i.test(name)) return 'clock';
  if (/rst|reset/i.test(name)) return 'reset';
  if (/en|sel|ctrl|valid|ready/i.test(name)) return 'control';
  return 'data';
}
```

## Success Criteria

- `npx tsc --noEmit` — no TypeScript errors
- `npx vitest run` — converter tests pass
- `npm run build` — builds, `dist/` bundle < 1MB
- `npm run dev` — paste `full_adder.v` → see hierarchy diagram with ports and wires
- Dark theme default, orthogonal wire routing, pan/zoom/minimap work
