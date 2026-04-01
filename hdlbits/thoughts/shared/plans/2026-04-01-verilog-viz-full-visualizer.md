# Verilog Visualizer (verilog-viz) — Full Implementation Plan

## Overview

Build a progressive, modern web-based Verilog visualizer that lives at `hdlbits/verilog-viz/`. Three tiers of functionality unlock progressively: instant hierarchy view (custom parser, ~600KB), on-demand RTL schematic (Yosys WASM, lazy-loaded ~12MB), and client-side simulation with waveforms. Dark mode default, React Flow canvas, CodeMirror 6 editor, ELK.js layout.

## Current State Analysis

- No `verilog-viz/` directory exists — clean start
- The `hdlbits/` repo contains HDLBits exercises with Verilog `.v` files that serve as natural test inputs
- Node v24.11.0 and npm 11.11.1 are available
- Research completed: DigitalJS, Makerchip, Bitspinner, HDElk, netlistsvg, d3-hwschematic, React Flow, CodeMirror 6, ELK.js, Yosys WASM all analyzed

### Key Discoveries:
- DigitalJS Online's Yosys WASM (~47MB) exceeds Chrome's WASM code cache ceiling (~150MB compiled), causing re-compilation on every page load
- Amaranth-Yosys has a stripped build pattern (no ABC/TCL/plugins) that could reduce WASM to ~4-7MB
- `prep` (not `synth`) produces readable word-level netlists — the right level for a learning tool
- React Flow v12 has built-in dark mode, ELK.js integration docs, port handles, and minimap
- CodeMirror 6 is ~150-300KB vs Monaco's 5-10MB; Sourcegraph migrated away from Monaco for this reason
- No existing web tool combines: dark mode + offline hierarchy + on-demand synthesis + simulation + modern UI

## Desired End State

A single-page web app at `verilog-viz/` that:

1. Loads in <1s with a ~600KB initial bundle
2. Instantly shows module hierarchy as interactive block diagrams when the user types/pastes Verilog
3. On "Synthesize" click, lazy-loads Yosys WASM (~12MB one-time) and renders RTL-level schematics
4. Simulates the synthesized circuit client-side with interactive input toggling
5. Displays synchronized waveforms alongside the schematic
6. Has dark mode by default, split-pane code/diagram layout, semantic zoom, and example circuits

### Verification:
- `npm run build` produces a working static site under 1MB initial bundle (excluding lazy-loaded WASM)
- All six phases' success criteria pass
- Can visualize the HDLBits exercise files (full adder, counters, FSMs) at all three tiers

## What We're NOT Doing

- Server-side synthesis API — purely client-side (WASM) for V1
- Building a custom stripped Yosys WASM from source — use `@yowasp/yosys` npm package as-is for V1
- Mobile/tablet responsive layout — desktop-first for V1
- Collaborative editing / multi-user
- SystemVerilog full support — Verilog-2005 subset sufficient for HDLBits exercises
- AI-assisted features (explain circuit, suggest fixes) — future V2
- Custom Lezer grammar for CodeMirror 6 — use CM5 legacy Verilog mode via `@codemirror/language` StreamParser adapter for V1

## Implementation Approach

Build bottom-up in six phases. Each phase produces a working, testable increment. Phases 1-3 deliver Tier 1 (hierarchy view). Phase 4 adds Tier 2 (RTL schematic). Phase 5 adds Tier 3 (simulation). Phase 6 is polish/PWA.

### Tech Stack

| Component | Package | Version | Size (gzip) |
|-----------|---------|---------|-------------|
| Build tool | `vite` | ^6 | dev only |
| Framework | `react` + `react-dom` | ^19 | ~45KB |
| Diagram canvas | `@xyflow/react` | ^12 | ~45KB |
| Layout engine | `elkjs` | ^0.9 | ~550KB |
| Code editor | `@codemirror/view` + deps | ^6 | ~150KB |
| CM5 Verilog mode | `@codemirror/legacy-modes` | ^6 | ~5KB |
| Split panes | `react-resizable-panels` | ^2 | ~8KB |
| Waveforms | `@wavedrom/doppler` | latest | ~15KB |
| Synthesis (lazy) | `@yowasp/yosys` | latest | ~12MB lazy |
| Netlist converter | `yosys2digitaljs` | ^0.9 | ~135KB lazy |

### Project Structure

```
verilog-viz/
├── index.html
├── vite.config.js
├── package.json
├── tsconfig.json                 # TypeScript for type safety
├── public/
│   └── examples/                 # Example .v files
│       ├── full_adder.v
│       ├── counter.v
│       ├── mux4.v
│       ├── alu.v
│       └── fsm.v
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Top-level layout: split panes + state
│   ├── index.css                 # Global styles + CSS custom properties (theme)
│   ├── components/
│   │   ├── Editor.tsx            # CodeMirror 6 wrapper with Verilog highlighting
│   │   ├── Toolbar.tsx           # Run/Synthesize buttons, example selector, theme toggle
│   │   ├── DiagramCanvas.tsx     # React Flow wrapper for hierarchy + RTL views
│   │   ├── ModuleNode.tsx        # Custom React Flow node: module box with ports
│   │   ├── WireEdge.tsx          # Custom React Flow edge: orthogonal wire
│   │   ├── Waveform.tsx          # WaveDrom waveform display panel
│   │   └── StatusBar.tsx         # Bottom bar: parse status, synthesis progress
│   ├── core/
│   │   ├── parser.ts             # Custom Verilog hierarchy parser (~400 LOC)
│   │   ├── converter.ts          # Parser output → ELK graph JSON
│   │   ├── elk-layout.ts         # ELK.js wrapper (runs in main thread or Worker)
│   │   ├── rtl-converter.ts      # Yosys JSON netlist → React Flow nodes/edges
│   │   └── simulator.ts          # Event-driven JS simulator
│   ├── workers/
│   │   ├── yosys.worker.ts       # Yosys WASM Web Worker
│   │   └── simulator.worker.ts   # Simulation Web Worker
│   ├── hooks/
│   │   ├── useParser.ts          # Parse on code change (debounced)
│   │   ├── useSynthesis.ts       # Lazy-load Yosys + synthesize
│   │   ├── useSimulation.ts      # Simulation control (play/pause/step)
│   │   └── useLayout.ts          # ELK layout computation
│   ├── theme/
│   │   ├── tokens.css            # CSS custom properties for dark/light
│   │   └── colors.ts             # Signal color constants
│   └── types/
│       ├── parser.ts             # ParsedModule, Port, Instance types
│       ├── graph.ts              # ELK graph types
│       └── simulation.ts         # SimState, Signal types
└── tests/
    ├── parser.test.ts            # Parser unit tests
    ├── converter.test.ts         # Converter unit tests
    └── examples/                 # Test fixture .v files
```

---

## Phase 1: Project Scaffold + Custom Verilog Parser

### Overview
Set up the Vite + React + TypeScript project, install core dependencies, and implement the custom Verilog parser that extracts module hierarchy from source code.

### Changes Required:

#### 1. Project Initialization

```bash
cd hdlbits
npm create vite@latest verilog-viz -- --template react-ts
cd verilog-viz
npm install @xyflow/react elkjs react-resizable-panels
npm install -D @types/node vitest
```

#### 2. Custom Verilog Parser
**File**: `src/core/parser.ts` (~400 LOC)

The parser operates in two phases:

**Phase A — Strip comments and strings:**
- Remove `//` line comments and `/* */` block comments
- Remove string literals
- Preserve line/column tracking for error reporting

**Phase B — Scan for module declarations and instantiations:**
- Match `module <name> (` or `module <name> #(` for module declarations
- Extract port declarations: `input`, `output`, `inout` with optional `[N:M]` ranges
- Detect instantiations: at module scope, `identifier identifier (` is always a module instantiation (no ambiguity with function calls)
- Handle `#(` parameter overrides on instantiations
- Flatten `generate` blocks (extract all instantiations regardless of conditions)
- Include all `ifdef` branches

**Output type:**

```typescript
interface ParsedDesign {
  modules: Map<string, ParsedModule>;
  errors: ParseError[];
}

interface ParsedModule {
  name: string;
  ports: Port[];
  instances: Instance[];
  parameters: Parameter[];
  loc: SourceLocation;
}

interface Port {
  name: string;
  direction: 'input' | 'output' | 'inout';
  width: string;        // e.g., "[7:0]" or "1" for single-bit
  loc: SourceLocation;
}

interface Instance {
  moduleName: string;   // the type being instantiated
  instanceName: string; // the instance label
  connections: Map<string, string>; // port → signal mapping
  parameters: Map<string, string>; // parameter overrides
  loc: SourceLocation;
}
```

**V1 edge case decisions (from handoff):**

| Pattern | V1 Action |
|---------|-----------|
| `generate if/for` blocks | Flatten — extract all instantiations |
| `` `ifdef `` guards | Include all branches |
| Escaped identifiers `\name ` | Skip (~5% of RTL) |
| Parameterized widths `[WIDTH-1:0]` | Show as expression string |
| Packages/imports | Ignore |
| Non-ANSI module headers | Warn + skip port extraction |

#### 3. Parser Unit Tests
**File**: `tests/parser.test.ts`

Test cases:
- Single module with ANSI ports
- Module with both input/output/inout ports and bus widths
- Module instantiation with named port connections (`.port(signal)`)
- Module instantiation with positional connections
- Parameterized module instantiation (`#(.WIDTH(8))`)
- Multiple modules in one file
- Nested instantiations (A instantiates B, B instantiates C)
- Comments and strings are properly stripped
- `generate` blocks — instances inside are extracted
- `ifdef` — instances from all branches are extracted
- Empty module (no ports, no instances)
- Error recovery: malformed module still parses remaining modules

#### 4. Example Verilog Files
**Directory**: `public/examples/`

Create 5 example files from HDLBits-style exercises:
- `full_adder.v` — simple hierarchy (full_adder instantiates half_adder)
- `counter.v` — single module with ports, no sub-instances
- `mux4.v` — mux4 built from mux2 instances
- `alu.v` — ALU with multiple operation submodules
- `fsm.v` — finite state machine (single module, tests port extraction)

### Success Criteria:

#### Automated Verification:
- [ ] `cd verilog-viz && npm install` completes without errors
- [ ] `npm run build` produces output in `dist/`
- [ ] `npx vitest run` — all parser tests pass
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] Parser correctly extracts modules, ports, and instances from all 5 example files

#### Manual Verification:
- [ ] `npm run dev` starts Vite dev server and loads the page (blank is fine — just React root)

---

## Phase 2: Hierarchy Visualization (Tier 1)

### Overview
Convert parser output to ELK graph format, run ELK.js layout, and render the result as an interactive React Flow diagram with custom module nodes and wire edges. Dark theme.

### Changes Required:

#### 1. Parser → ELK Converter
**File**: `src/core/converter.ts`

Converts `ParsedDesign` → ELK JSON graph format:

```typescript
interface ElkGraph {
  id: string;
  children: ElkNode[];
  edges: ElkEdge[];
  layoutOptions: Record<string, string>;
}

interface ElkNode {
  id: string;
  width: number;
  height: number;
  ports: ElkPort[];
  labels: ElkLabel[];
  layoutOptions: Record<string, string>;
}
```

Logic:
- Each module instance becomes an `ElkNode` with `ports` derived from the instantiated module's port declarations
- Each port connection becomes an `ElkEdge` from source port to destination port
- Top-level module ports become special "boundary" nodes (input ports on left, output ports on right)
- ELK layout options: `algorithm: 'layered'`, `edgeRouting: 'ORTHOGONAL'`, `portConstraints: 'FIXED_ORDER'`, `direction: 'RIGHT'`
- Node height scales with port count: `base_height + (port_count * port_spacing)`

#### 2. ELK Layout Wrapper
**File**: `src/core/elk-layout.ts`

```typescript
import ELK from 'elkjs/lib/elk.bundled.js';

export async function layoutGraph(graph: ElkGraph): Promise<ElkGraph> {
  const elk = new ELK();
  return elk.layout(graph);
}
```

Wraps ELK.js call. Returns positioned graph with x/y coordinates on all nodes, ports, and edge bend points.

#### 3. Custom React Flow Node — ModuleNode
**File**: `src/components/ModuleNode.tsx`

Renders a module instance as a rectangle with:
- Module type name (top, bold, monospace)
- Instance name (subtitle, dimmer)
- Left-side input ports (circles + labels)
- Right-side output ports (circles + labels)
- Port labels in JetBrains Mono, 11px
- Bus ports rendered with thicker line indicator
- Background: `var(--color-surface)`, border: `var(--color-border)`
- Selected state: accent border glow

#### 4. Custom React Flow Edge — WireEdge
**File**: `src/components/WireEdge.tsx`

Renders wires between ports:
- Orthogonal (Manhattan) routing using ELK bend points
- Single-bit: 1px line
- Bus (multi-bit): 2.5px line with diagonal slash mark and width label
- Color based on signal type (data=cyan, clock=amber, reset=red — configurable)
- Hover: wire thickens to 2px, tooltip shows signal name and width

#### 5. Diagram Canvas
**File**: `src/components/DiagramCanvas.tsx`

React Flow instance configured with:
- `colorMode="dark"` (default, toggle-able)
- `<MiniMap />` in bottom-right corner
- `<Controls />` for zoom buttons
- `<Background variant="dots" />` for grid
- `fitView` on initial render and on code change
- Node types: `{ module: ModuleNode }`
- Edge types: `{ wire: WireEdge }`

#### 6. useLayout Hook
**File**: `src/hooks/useLayout.ts`

- Takes `ParsedDesign` as input
- Runs converter → ELK layout → maps to React Flow nodes/edges
- Returns `{ nodes, edges, isLayouting }`
- Memoized: only re-runs when parser output changes

#### 7. useParser Hook
**File**: `src/hooks/useParser.ts`

- Takes editor content as input
- Debounces by 300ms
- Runs parser, returns `{ design, errors, isParsing }`

#### 8. Dark Theme Tokens
**File**: `src/theme/tokens.css`

CSS custom properties based on Tokyo Night palette:

```css
:root {
  --color-bg-canvas: #1a1b26;
  --color-bg-surface: #24283b;
  --color-bg-panel: #1f2335;
  --color-border: #3b4261;
  --color-text-primary: #c0caf5;
  --color-text-secondary: #565f89;
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

[data-theme="light"] {
  --color-bg-canvas: #f8fafc;
  --color-bg-surface: #ffffff;
  --color-bg-panel: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  /* ... light versions of all tokens */
}
```

#### 9. Signal Colors
**File**: `src/theme/colors.ts`

```typescript
export const SIGNAL_COLORS = {
  clock: 'var(--color-wire-clock)',
  reset: 'var(--color-wire-reset)',
  data: 'var(--color-wire-data)',
  control: 'var(--color-wire-control)',
  default: 'var(--color-wire-data)',
} as const;

// Heuristic: detect signal type from name
export function inferSignalType(name: string): keyof typeof SIGNAL_COLORS {
  if (/clk|clock/i.test(name)) return 'clock';
  if (/rst|reset/i.test(name)) return 'reset';
  if (/en|sel|ctrl|valid|ready/i.test(name)) return 'control';
  return 'data';
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npx vitest run` — converter tests pass (parser output → ELK graph → valid node/edge structure)
- [ ] `npm run build` — builds successfully, `dist/` bundle < 1MB (excluding lazy chunks)

#### Manual Verification:
- [ ] `npm run dev` — paste `full_adder.v` in editor → see module hierarchy diagram with ports and wires
- [ ] Diagram uses dark theme by default
- [ ] Modules show as rectangles with input ports on left, output ports on right
- [ ] Wires route orthogonally between ports
- [ ] Bus wires are visually thicker than single-bit wires
- [ ] Pan, zoom, and minimap all work
- [ ] `fitView` centers the diagram on load

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Split-Pane Layout + Editor Integration

### Overview
Wire up the CodeMirror 6 editor with Verilog syntax highlighting, resizable split-pane layout, toolbar with example selector, and cross-panel signal highlighting.

### Changes Required:

#### 1. CodeMirror 6 Editor Component
**File**: `src/components/Editor.tsx`

```bash
npm install @codemirror/view @codemirror/state @codemirror/language \
  @codemirror/legacy-modes @codemirror/commands @codemirror/search \
  @codemirror/autocomplete @codemirror/lang-javascript  # for StreamLanguage
npm install @fontsource/jetbrains-mono
```

Setup:
- Use `StreamLanguage.define()` with the CM5 Verilog mode from `@codemirror/legacy-modes/mode/verilog`
- Theme: `oneDark` as base, customized with our CSS tokens
- Font: JetBrains Mono, 14px
- Extensions: line numbers, bracket matching, active line highlight, search (Ctrl+F), code folding
- `onChange` callback wired to `useParser` hook
- `highlightSignal(name)` imperative method: highlight all occurrences of a signal name when user clicks a wire in the diagram

#### 2. App Layout with Split Panes
**File**: `src/App.tsx`

```tsx
<PanelGroup direction="horizontal">
  <Panel defaultSize={40} minSize={20}>
    <div className="editor-panel">
      <Toolbar />
      <Editor />
    </div>
  </Panel>
  <PanelResizeHandle className="resize-handle" />
  <Panel defaultSize={60} minSize={30}>
    <DiagramCanvas />
  </Panel>
</PanelGroup>
```

- Left panel (40%): toolbar + editor
- Right panel (60%): diagram canvas
- Resize handle: 4px, visible on hover, keyboard accessible

#### 3. Toolbar
**File**: `src/components/Toolbar.tsx`

Contains:
- **Example selector**: `<select>` dropdown listing example files from `public/examples/`
  - On select: fetch the `.v` file and load into editor
- **"Parse" indicator**: green dot when parsed successfully, red when errors
- **Theme toggle**: dark/light switch (stores preference in localStorage)
- **Future**: "Synthesize" button (Phase 4), "Simulate" button (Phase 5)

#### 4. StatusBar
**File**: `src/components/StatusBar.tsx`

Bottom bar showing:
- Parse status: "Parsed 3 modules, 5 instances" or "Parse error at line 12"
- Module count and instance count
- Future: synthesis progress, simulation time

#### 5. Cross-Panel Signal Highlighting

When user clicks a wire in the diagram:
1. The wire edge highlights with accent color + thicker stroke
2. The signal name is passed to `Editor.highlightSignal(name)`
3. Editor scrolls to and highlights the signal declaration/usage
4. Clicking in the editor on a signal name highlights the corresponding wire(s)

Implementation: shared `selectedSignal` state in App, passed to both Editor and DiagramCanvas.

#### 6. Global Styles
**File**: `src/index.css`

- Import `@fontsource/jetbrains-mono`
- Apply theme tokens from `tokens.css`
- Style the resize handle, panels, scrollbars
- Responsive: panels stack vertically on narrow screens (nice-to-have, not required for V1)

### Success Criteria:

#### Automated Verification:
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run build` — builds successfully

#### Manual Verification:
- [ ] Editor shows Verilog syntax highlighting (keywords blue, comments green, strings orange)
- [ ] Selecting an example from the dropdown loads it into the editor and diagram updates
- [ ] Resizing the split pane works smoothly
- [ ] Theme toggle switches between dark and light modes
- [ ] Clicking a wire in the diagram highlights the signal in the editor
- [ ] Status bar shows parse results
- [ ] JetBrains Mono font is used in editor

**Implementation Note**: After completing this phase, pause for manual confirmation. Tier 1 (hierarchy view) is now complete and usable.

---

## Phase 4: Yosys WASM Integration (Tier 2 — RTL Schematic)

### Overview
Add a "Synthesize" button that lazy-loads Yosys WASM in a Web Worker, runs `prep` to produce a JSON netlist, converts it to React Flow nodes/edges, and renders an RTL-level schematic alongside the hierarchy view.

### Changes Required:

#### 1. Install Lazy-Loaded Dependencies

```bash
npm install yosys2digitaljs
# @yowasp/yosys will be dynamically imported at runtime from CDN
```

Note: `@yowasp/yosys` is NOT installed as a regular dependency — it's loaded lazily from jsDelivr CDN to avoid bloating the main bundle.

#### 2. Yosys Web Worker
**File**: `src/workers/yosys.worker.ts`

```typescript
// Worker receives Verilog source, returns Yosys JSON netlist
self.onmessage = async (e: MessageEvent) => {
  const { source, topModule } = e.data;

  try {
    self.postMessage({ type: 'status', message: 'Loading synthesis engine...' });

    // Dynamic import from CDN — cached after first load
    const { runYosys } = await import(
      'https://cdn.jsdelivr.net/npm/@yowasp/yosys/gen/bundle.js'
    );

    self.postMessage({ type: 'status', message: 'Running synthesis...' });

    // Write source to virtual filesystem, run prep, read JSON output
    const result = await runYosys([
      '-p', `read_verilog ${topModule}.v`,
      '-p', `prep -top ${topModule}`,
      '-p', 'write_json output.json',
    ], {
      '/src/': { [`${topModule}.v`]: source },
    });

    // Read the JSON output
    const netlistJson = result['/output.json'];
    self.postMessage({ type: 'result', netlist: JSON.parse(netlistJson) });

  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
  }
};
```

Note: The exact `runYosys` API may differ from the above sketch. During implementation, consult the actual `@yowasp/yosys` docs and `yosys2digitaljs` source to get the correct invocation pattern. The above is a structural guide, not copy-paste code.

#### 3. useSynthesis Hook
**File**: `src/hooks/useSynthesis.ts`

- Manages the Yosys worker lifecycle
- States: `idle` → `loading` (WASM downloading) → `synthesizing` → `done` / `error`
- Progress messages from worker are surfaced to the StatusBar
- Returns `{ synthesize, netlist, status, error }`
- Caches last synthesis result; only re-synthesizes when code changes + user clicks "Synthesize"

#### 4. RTL Netlist → React Flow Converter
**File**: `src/core/rtl-converter.ts`

Converts Yosys JSON netlist (or yosys2digitaljs output) to React Flow nodes and edges:

- Each `cell` in the netlist becomes a node
  - `$add`, `$sub`, `$mul` → rendered as labeled operation blocks
  - `$mux` → rendered as trapezoid/mux symbol
  - `$dff`, `$adff` → rendered as flip-flop symbol (rectangle with triangle clock indicator)
  - `$and`, `$or`, `$not` → rendered as standard gate shapes (or labeled rectangles for simplicity in V1)
- Each port connection becomes an edge
- Wire bit-widths are preserved from the netlist `bits` arrays
- Use ELK layout with same orthogonal routing config as hierarchy view

#### 5. RTL-Specific Node Components
**File**: `src/components/RtlNode.tsx` (new)

Custom React Flow node types for RTL cells:
- `OperatorNode` — for `$add`, `$sub`, `$mul`, `$eq`, `$lt`, etc. Labeled rectangle with operator symbol
- `MuxNode` — trapezoid shape for `$mux`, `$pmux`
- `DffNode` — rectangle with clock triangle for `$dff`, `$adff`, `$sdff`
- `GateNode` — for `$and`, `$or`, `$not`, `$xor` — labeled rectangle (V1), proper IEEE shapes (V2)
- `ConstantNode` — small label for constant drivers (`1'b0`, `8'hFF`)

#### 6. View Tabs in Diagram Canvas
**File**: `src/components/DiagramCanvas.tsx` (modify)

Add a tab bar above the diagram:
- **Hierarchy** tab — shows the parser-based hierarchy view (always available)
- **RTL Schematic** tab — shows the Yosys-based RTL view (available after synthesis)
- Tab shows a spinner/disabled state while synthesis is in progress

#### 7. Synthesize Button in Toolbar
**File**: `src/components/Toolbar.tsx` (modify)

Add "Synthesize" button:
- Disabled when code is empty or has parse errors
- Shows "Loading engine (12MB)..." on first click (one-time download)
- Shows "Synthesizing..." during Yosys run
- Shows checkmark when done
- Re-click to re-synthesize after code changes

#### 8. StatusBar Updates
**File**: `src/components/StatusBar.tsx` (modify)

Show synthesis progress:
- "Downloading synthesis engine (~12MB, one-time)..." with thin progress bar
- "Synthesizing with Yosys..." with spinner
- "Synthesis complete: 15 cells, 23 wires" on success
- Red error message on failure

### Success Criteria:

#### Automated Verification:
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run build` — builds successfully, main bundle still < 1MB (Yosys WASM is lazy)
- [ ] `npx vitest run` — rtl-converter unit tests pass (mock Yosys JSON → valid React Flow nodes/edges)

#### Manual Verification:
- [ ] Click "Synthesize" with `full_adder.v` loaded → progress indicator appears → RTL schematic renders
- [ ] RTL schematic shows individual operators ($add, $mux, $dff) as distinct node shapes
- [ ] Wires between cells route orthogonally
- [ ] Switching between Hierarchy and RTL tabs works
- [ ] Second synthesis is faster (WASM cached)
- [ ] Synthesis errors display clearly in the status bar
- [ ] The initial page load is still fast (<1s) — no WASM downloaded until "Synthesize" is clicked

**Implementation Note**: After completing this phase, pause for manual confirmation. Tier 2 (RTL schematic) is now functional.

---

## Phase 5: Simulation + Waveforms (Tier 3)

### Overview
Add a client-side event-driven simulator that runs on the synthesized netlist, with interactive input toggling, signal propagation visualization on the schematic, and a WaveDrom-based waveform panel.

### Changes Required:

#### 1. Event-Driven Simulator
**File**: `src/core/simulator.ts`

A JavaScript event-driven simulator modeled after DigitalJS's approach:

```typescript
interface SimState {
  signals: Map<string, SignalValue>;   // signal ID → current value
  time: number;                         // simulation ticks
  eventQueue: SimEvent[];               // pending events
}

interface SignalValue {
  bits: ('0' | '1' | 'x' | 'z')[];     // per-bit state
  width: number;
}

interface SimEvent {
  time: number;
  signalId: string;
  newValue: SignalValue;
}
```

Core logic:
- Initialize all signals to `x`
- Process the event queue in time order
- When a cell's input changes, evaluate its output function and schedule output change
- Cell evaluation functions for each Yosys cell type:
  - `$and`, `$or`, `$xor`, `$not` — bitwise logic
  - `$add`, `$sub` — arithmetic (JS BigInt for wide buses)
  - `$mux` — select based on control input
  - `$dff` — update output on clock edge
  - `$eq`, `$lt`, `$gt` — comparison
  - `$reduce_and`, `$reduce_or` — reduction operators
- Zero-delay mode (default): all combinational propagation is instant
- Record signal history for waveform display

#### 2. Simulation Web Worker
**File**: `src/workers/simulator.worker.ts`

Runs the simulator in a separate thread:
- Receives: netlist + input state changes
- Sends back: updated signal states per tick
- Supports: `step(n)`, `run()`, `pause()`, `reset()` commands
- Emits signal history updates for waveform recording

#### 3. useSimulation Hook
**File**: `src/hooks/useSimulation.ts`

- Takes synthesized netlist as input
- Manages worker lifecycle
- Provides: `step()`, `run()`, `pause()`, `reset()`, `toggleInput(signalId)`
- Returns: `{ simState, isRunning, time, signalHistory }`
- Updates signal values on the React Flow nodes/edges in real-time

#### 4. Interactive Input Controls

On RTL schematic view, top-level input ports become interactive:
- Single-bit inputs: click to toggle 0/1
- Multi-bit inputs: click to open a small popover with hex/decimal input field
- Visual indicator: input nodes have a distinct "clickable" style (cursor pointer, subtle pulse on hover)

Implementation: In `DiagramCanvas.tsx`, detect top-level input nodes and attach click handlers that call `useSimulation.toggleInput()`.

#### 5. Signal Propagation Visualization

When simulation is running/stepping:
- Wire colors update based on signal value:
  - Logic `1`: green (`#9ece6a`)
  - Logic `0`: dim blue-gray (`#565f89`)
  - Unknown `x`: red (`#f7768e`)
  - High-Z `z`: dashed line, light gray
- On signal transition: brief 150ms CSS pulse animation on the wire
- Cell nodes show current output value as a small label

#### 6. Waveform Panel
**File**: `src/components/Waveform.tsx`

```bash
npm install @wavedrom/doppler
```

- Appears as a collapsible bottom panel (horizontal split below the diagram)
- User adds signals to the waveform by right-clicking a wire → "Add to waveform"
- Displays WaveDrom-style timing diagrams for selected signals
- Scrollable timeline, zoom in/out
- Synchronized with simulation time: clicking a point on the waveform steps the simulation to that tick

If `@wavedrom/doppler` integration proves difficult, fallback to a custom canvas-based waveform renderer (draw signal transitions as step functions on an HTML5 canvas).

#### 7. Simulation Controls in Toolbar
**File**: `src/components/Toolbar.tsx` (modify)

Add simulation controls (visible after synthesis):
- Play/Pause toggle button
- Step button (advance one clock cycle)
- Reset button (return to initial state)
- Simulation time counter display
- Speed control (1x, 10x, 100x ticks per frame)

#### 8. Bottom Panel Layout
**File**: `src/App.tsx` (modify)

Add a vertical split for the waveform panel:

```tsx
<PanelGroup direction="horizontal">
  <Panel> {/* Editor */} </Panel>
  <PanelResizeHandle />
  <Panel>
    <PanelGroup direction="vertical">
      <Panel> {/* DiagramCanvas */} </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={30} collapsible>
        {/* Waveform */}
      </Panel>
    </PanelGroup>
  </Panel>
</PanelGroup>
```

Waveform panel starts collapsed; opens when user adds a signal to it.

### Success Criteria:

#### Automated Verification:
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npx vitest run` — simulator unit tests pass:
  - AND gate: `(1,1)→1`, `(1,0)→0`, `(0,x)→0`
  - MUX: selects correct input
  - DFF: output updates on clock edge, not before
  - Full adder: all 8 input combinations produce correct sum and carry
- [ ] `npm run build` — builds successfully

#### Manual Verification:
- [ ] Load `full_adder.v`, synthesize, switch to RTL tab
- [ ] Click input ports to toggle values → wire colors update showing signal propagation
- [ ] Click "Step" → simulation advances, DFF outputs update on clock edge
- [ ] Right-click a wire → "Add to waveform" → waveform panel opens showing the signal
- [ ] Play/pause simulation: wires animate continuously while running
- [ ] Reset: all signals return to `x`, simulation time resets to 0
- [ ] Waveform timeline is synchronized with the simulation state

**Implementation Note**: After completing this phase, pause for manual confirmation. All three tiers are now functional.

---

## Phase 6: Polish + PWA

### Overview
Add progressive web app capabilities (Service Worker for WASM caching), semantic zoom detail levels, keyboard shortcuts, SVG export, URL sharing, and general UI polish.

### Changes Required:

#### 1. Service Worker for WASM Caching
**File**: `vite.config.js` (modify)

```bash
npm install -D vite-plugin-pwa
```

Configure PWA plugin:
- Precache all app assets
- Runtime cache strategy `CacheFirst` for `.wasm` files
- This means Yosys WASM is downloaded once, then served from cache on all subsequent visits
- Cache name: `wasm-cache`, max age: 1 year (WASM binary is immutable per version)

#### 2. Semantic Zoom
**File**: `src/components/DiagramCanvas.tsx` (modify)

Use React Flow's `useViewport()` hook to implement detail levels:

| Zoom level | What to render |
|------------|----------------|
| < 30% | Module boxes only, filled with type color, no labels |
| 30%–80% | Module names visible, port names on hover only |
| 80%–150% | Full port labels, signal names on wires, bus width annotations |
| > 150% | Bit-range annotations, parameter values, source location |

Implementation: pass `zoomLevel` to custom node components, conditionally render details.

#### 3. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Parse / re-layout diagram |
| `Ctrl+Shift+Enter` | Synthesize (Tier 2) |
| `Space` (when diagram focused) | Play/pause simulation |
| `→` (when diagram focused) | Step simulation |
| `Ctrl+Shift+R` | Reset simulation |
| `Ctrl+E` | Toggle example selector |
| `Ctrl+\` | Toggle editor panel |
| `Ctrl+J` | Toggle waveform panel |
| `F` | Fit diagram to view |

Implementation: global `useEffect` with `keydown` listener, respecting when editor has focus (don't capture editor shortcuts).

#### 4. SVG/PNG Export

Add export buttons to toolbar:
- **SVG Export**: serialize the React Flow viewport to SVG using `@xyflow/react`'s `toSvg()` utility
- **PNG Export**: render SVG to canvas, then `canvas.toBlob()` → download
- Include a white/dark background based on current theme

#### 5. URL Sharing

Encode the current state in the URL hash:
- `#code=<base64(gzip(verilog_source))>` — compressed Verilog source
- `#example=full_adder` — reference to built-in example
- On page load: if hash is present, decode and load into editor
- "Share" button in toolbar: copies URL to clipboard with toast notification

Use `CompressionStream` API (supported in all modern browsers) for gzip.

#### 6. Loading Skeleton

When Yosys WASM is loading for the first time:
- Show a skeleton diagram canvas with faint placeholder rectangles and lines
- Thin progress bar at top of diagram panel (not blocking, not a spinner)
- Editor remains fully interactive during loading

#### 7. UI Polish

- **Transitions**: node entrance `opacity 0→1` over 200ms, staggered 20ms per node
- **Selection**: selected node gets `box-shadow` pulse (300ms, once), then static accent border
- **Wire hover**: thickness `1px→2px`, 100ms ease
- **Resize handle**: `background-color` transition on hover, 150ms
- **Toast notifications**: bottom-right, auto-dismiss after 3s, for "Copied URL", "Export saved", etc.
- **Error display**: parse errors shown as red underlines in editor (CodeMirror diagnostics)
- **Favicon**: simple circuit icon SVG

#### 8. README
**File**: `verilog-viz/README.md`

Brief README with:
- What it is (one paragraph)
- Screenshot/GIF placeholder
- How to run locally (`npm install && npm run dev`)
- Tech stack list
- License note (ELK.js is EPL-2.0)

### Success Criteria:

#### Automated Verification:
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run build` — builds successfully, main chunk < 1MB
- [ ] `npx vitest run` — all tests pass
- [ ] PWA manifest is present in `dist/`

#### Manual Verification:
- [ ] First visit: Yosys WASM downloads with progress indicator
- [ ] Second visit: "Synthesize" is near-instant (WASM served from Service Worker cache)
- [ ] Zooming in/out on diagram: detail levels change (labels appear/disappear)
- [ ] All keyboard shortcuts work
- [ ] SVG export produces a valid SVG file matching the current diagram
- [ ] "Share" button copies URL with encoded Verilog; pasting URL in new tab loads the same state
- [ ] Node entrance animations play smoothly
- [ ] Parse errors show as red underlines in the editor
- [ ] Light/dark theme toggle is smooth with no flash

---

## Testing Strategy

### Unit Tests (vitest):
- **Parser**: all edge cases from Phase 1 test list
- **Converter**: parser output → ELK graph structure validation
- **RTL Converter**: mock Yosys JSON → React Flow nodes/edges
- **Simulator**: cell evaluation functions for all supported Yosys cell types
- **URL encoding**: round-trip encode → decode produces identical source

### Integration Tests (vitest + jsdom):
- Full pipeline: Verilog source string → parser → converter → ELK layout → React Flow nodes with correct positions
- Simulation: full adder netlist → set inputs → step → verify outputs

### Manual Testing Steps:
1. Load each of the 5 example circuits, verify hierarchy diagram renders
2. Synthesize each example, verify RTL schematic renders
3. Simulate full_adder: toggle all 8 input combinations, verify sum/carry
4. Share URL for each example, open in new tab, verify state restores
5. Export SVG for a diagram, open in browser, verify it looks correct
6. Test with a large-ish design (RISC-V picorv32 if available) — performance should be acceptable

## Performance Considerations

- **Parser**: runs synchronously in main thread — fine for files < 10,000 lines. If perf becomes an issue, move to a Worker.
- **ELK.js**: can take 100-500ms for large graphs. Run in `requestIdleCallback` or a Worker if it causes jank.
- **Yosys WASM**: first load ~3-8s (download + compile). Subsequent synthesis ~0.2-6s depending on design size. Always in a Worker — never blocks UI.
- **Simulation**: event-driven in Worker. For simple circuits (< 100 cells), 60fps animation is feasible. For larger circuits, batch updates and render at 30fps.
- **React Flow**: handles 100-500 nodes well. For 1000+ nodes (gate-level of large designs), consider virtualization or switching to Canvas2D renderer.

## References

- Handoff: `thoughts/shared/handoffs/general/2026-03-31_16-30-27_verilog-hierarchy-visualizer.md`
- React Flow docs: https://reactflow.dev
- ELK.js layered algorithm: https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html
- YoWASP: https://yowasp.org/
- yosys2digitaljs: https://github.com/tilk/yosys2digitaljs
- DigitalJS: https://github.com/tilk/digitaljs
- HDElk: https://davidthings.github.io/hdelk/
- netlistsvg: https://github.com/nturley/netlistsvg
- d3-hwschematic: https://github.com/Nic30/d3-hwschematic
- CodeMirror 5 Verilog mode: https://codemirror.net/5/mode/verilog/
- WaveDrom: https://wavedrom.com/
- Amaranth-Yosys stripped build: https://github.com/amaranth-lang/amaranth-yosys/blob/develop/build.sh
