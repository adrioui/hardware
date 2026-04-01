# Verilog Visualizer

A progressive web app for visualizing Verilog hardware designs in the browser — no server required. Paste or load a Verilog source file and instantly see an interactive hierarchy diagram. Click **Synthesize** to generate a full RTL schematic via Yosys WASM, or run a cycle-accurate simulation with waveform capture, all client-side.

![Screenshot placeholder](docs/screenshot.png)

---

## Features

- **Tier 1 — Hierarchy View**: Instant module hierarchy diagram from a custom ~400 LOC Verilog parser. No external dependencies, loads in under a second.
- **Tier 2 — RTL Schematic**: Full gate-level netlist rendered with Yosys WASM (~12 MB, lazy-loaded on first "Synthesize" click).
- **Tier 3 — Simulation**: Event-driven simulator with interactive input toggling, signal propagation coloring, and waveform panel.
- **Semantic zoom**: Detail level changes automatically as you zoom (labels → port names → bit annotations).
- **Keyboard shortcuts**: `Ctrl+Enter` to parse, `Ctrl+Shift+Enter` to synthesize, `Space`/`→` to play/step simulation.
- **Export**: SVG and PNG download of the current diagram.
- **Share**: One-click URL sharing with gzip+base64 compressed source.
- **PWA**: Installable, with Service Worker caching for offline use.

---

## Quick Start

```bash
npm install
npm run dev        # dev server at http://localhost:5173
```

### Other commands

```bash
npm run build      # production build → dist/
npx vitest run     # run unit tests
npx tsc --noEmit   # typecheck
```

---

## Usage

1. **Write or paste** Verilog source in the left editor panel.  
   Or pick a built-in example from the **Examples** dropdown in the toolbar.
2. The hierarchy diagram updates automatically as you type (debounced).  
   Press **`Ctrl+Enter`** to force an immediate re-parse.
3. Click **Synthesize** (or press **`Ctrl+Shift+Enter`**) to load Yosys WASM and generate the RTL schematic.  
   Switch between Hierarchy and RTL views with the tab buttons above the diagram.
4. In RTL view, **click input ports** to toggle values and watch signal colors propagate.  
   Press **`Space`** to run continuously, **`→`** to step one clock cycle, or use the toolbar controls.
5. The **waveform panel** at the bottom records signal history — drag the divider to resize.
6. Press **`F`** to fit the diagram to the window.  
   Use **`Ctrl+\`** to hide/show the editor, **`Ctrl+J`** for the waveform panel.
7. Click **Export SVG** or **Export PNG** in the toolbar to download the diagram.  
   Click **Share** to copy a URL that encodes the current source — anyone with the link can open the same design.

---

## Tech Stack

| Component | Package | Notes |
|-----------|---------|-------|
| Build | `vite` ^6 | Dev only |
| Framework | `react` + `react-dom` ^19 | ~45 KB gzip |
| Diagram canvas | `@xyflow/react` ^12 | ~45 KB gzip |
| Graph layout | `elkjs` ^0.9 | ~550 KB gzip — **EPL-2.0** |
| Code editor | `@codemirror/view` + deps ^6 | ~150 KB gzip |
| Split panes | `react-resizable-panels` ^2 | ~8 KB gzip |
| Synthesis (lazy) | `@yowasp/yosys` | ~12 MB, loaded on demand |
| Netlist converter | `yosys2digitaljs` ^0.9 | ~135 KB, loaded on demand |

> **License note:** ELK.js (`elkjs`) is distributed under the [Eclipse Public License 2.0 (EPL-2.0)](https://www.eclipse.org/legal/epl-2.0/). The EPL-2.0 is a weak copyleft license that applies only to the ELK source itself, not to this application as a whole.

---

## Project Structure

```
verilog-viz/
├── public/examples/      # built-in Verilog examples
├── src/
│   ├── components/       # React components (Editor, Toolbar, DiagramCanvas, …)
│   ├── core/             # parser, converters, ELK layout, simulator
│   ├── hooks/            # useParser, useSynthesis, useSimulation, useLayout
│   ├── theme/            # CSS tokens (Tokyo Night palette) + signal colors
│   ├── types/            # TypeScript type definitions
│   └── workers/          # Yosys + simulator Web Workers
├── tests/                # vitest unit tests
└── specs/                # phase-by-phase design specs
```

---

## Built-in Examples

| File | Description |
|------|-------------|
| `full_adder.v` | 1-bit full adder (combinational) |
| `counter.v` | Parameterized up-counter with enable and reset |
| `mux4.v` | 4-to-1 multiplexer |
| `alu.v` | Simple 4-function ALU |
| `fsm.v` | 3-state Moore FSM |
