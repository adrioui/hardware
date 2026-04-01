# Verilog Visualizer (verilog-viz)

Progressive web-based Verilog visualizer. Three tiers: instant hierarchy view (custom parser, ~600KB), on-demand RTL schematic (Yosys WASM, lazy-loaded ~12MB), client-side simulation with waveforms. Dark mode default, React Flow canvas, CodeMirror 6 editor, ELK.js layout.

## Project Structure

```
verilog-viz/
├── specs/                        ← authoritative specs per phase
├── public/examples/              ← example .v files (test inputs)
├── src/
│   ├── main.tsx                  ← React entry point
│   ├── App.tsx                   ← top-level layout: split panes + state
│   ├── index.css                 ← global styles + CSS custom properties
│   ├── components/               ← React components (Editor, Toolbar, DiagramCanvas, etc.)
│   ├── core/                     ← parser, converters, simulator, elk-layout
│   ├── hooks/                    ← useParser, useSynthesis, useSimulation, useLayout
│   ├── theme/                    ← CSS tokens + signal color constants
│   ├── types/                    ← TypeScript type definitions
│   └── workers/                  ← Web Workers (Yosys WASM, simulator)
├── tests/                        ← vitest unit tests + fixture .v files
├── IMPLEMENTATION_PLAN.md        ← current task tracker (read this first)
├── AGENTS.md                     ← build/validate commands
└── .pi/extensions/ralph.ts       ← /ralph loop orchestrator
```

## Tech Stack

| Component | Package | Size (gzip) |
|-----------|---------|-------------|
| Build | `vite` ^6 | dev only |
| Framework | `react` + `react-dom` ^19 | ~45KB |
| Diagram | `@xyflow/react` ^12 | ~45KB |
| Layout | `elkjs` ^0.9 | ~550KB |
| Editor | `@codemirror/view` + deps ^6 | ~150KB |
| Split panes | `react-resizable-panels` ^2 | ~8KB |
| Synthesis (lazy) | `@yowasp/yosys` | ~12MB lazy |
| Netlist converter | `yosys2digitaljs` ^0.9 | ~135KB lazy |

## Commands

```bash
npm install                    # install deps
npm run dev                    # vite dev server
npm run build                  # production build → dist/
npx vitest run                 # run tests
npx tsc --noEmit               # typecheck
```

## Key Rules

- Specs are authoritative — read the relevant spec in `specs/` before implementing
- Initial bundle must stay under 1MB (Yosys WASM is lazy-loaded, excluded)
- Dark mode (Tokyo Night palette) is the default
- Parser is custom (~400 LOC), no external Verilog parser dependency
- Yosys WASM loads from CDN on first "Synthesize" click, never at startup
- Each phase produces a working, testable increment

## Development Workflow

Read `IMPLEMENTATION_PLAN.md` for current task. Work one task at a time:
1. Read the relevant spec before implementing
2. Implement the task
3. Validate (build, test, typecheck)
4. Update `IMPLEMENTATION_PLAN.md` — mark completed, note issues, advance current task
5. Never put status reports in `AGENTS.md`

## Read When Needed

- **Project scaffold + parser** → `specs/phase1-scaffold-parser.md`
- **Hierarchy visualization** → `specs/phase2-hierarchy-viz.md`
- **Split-pane layout + editor** → `specs/phase3-editor-layout.md`
- **Yosys WASM + RTL schematic** → `specs/phase4-yosys-rtl.md`
- **Simulation + waveforms** → `specs/phase5-simulation.md`
- **Polish + PWA** → `specs/phase6-polish-pwa.md`
- **Current task and progress** → `IMPLEMENTATION_PLAN.md`
- **Full original plan** → `../thoughts/shared/plans/2026-04-01-verilog-viz-full-visualizer.md`
