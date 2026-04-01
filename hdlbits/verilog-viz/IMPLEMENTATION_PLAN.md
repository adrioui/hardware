# Implementation Plan

**Goal:** Build a progressive web-based Verilog visualizer — hierarchy view, RTL schematic, simulation + waveforms.
**Method:** One boomerang per task. Each task reads only what it needs, does one thing, validates, updates this file.

---

## Tasks

### Phase 1: Project Scaffold + Custom Verilog Parser

- [x] **1.1** Initialize Vite + React + TypeScript project, install core deps (`@xyflow/react`, `elkjs`, `react-resizable-panels`, `vitest`)
  - reads: `specs/phase1-scaffold-parser.md`
  - runs: `npm run build`
  - validates: exit code 0, `dist/` directory exists

- [x] **1.2** Create TypeScript type definitions for parser output (`ParsedDesign`, `ParsedModule`, `Port`, `Instance`, `Parameter`, `SourceLocation`, `ParseError`)
  - reads: `specs/phase1-scaffold-parser.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [x] **1.3** Implement custom Verilog parser Phase A — comment/string stripping with line tracking
  - reads: `specs/phase1-scaffold-parser.md`, `src/types/parser.ts`
  - runs: `npx vitest run tests/parser.test.ts`
  - validates: comment/string stripping tests pass

- [x] **1.4** Implement custom Verilog parser Phase B — module declaration + port extraction
  - reads: `specs/phase1-scaffold-parser.md`, `src/core/parser.ts`
  - runs: `npx vitest run tests/parser.test.ts`
  - validates: module/port extraction tests pass

- [x] **1.5** Implement parser Phase B — instantiation detection + connection mapping
  - reads: `specs/phase1-scaffold-parser.md`, `src/core/parser.ts`
  - runs: `npx vitest run tests/parser.test.ts`
  - validates: instantiation tests pass

- [x] **1.6** Implement parser edge cases — generate blocks, ifdef, parameterized modules, error recovery
  - reads: `specs/phase1-scaffold-parser.md`, `src/core/parser.ts`
  - runs: `npx vitest run tests/parser.test.ts`
  - validates: all edge case tests pass

- [x] **1.7** Create 5 example Verilog files (`full_adder.v`, `counter.v`, `mux4.v`, `alu.v`, `fsm.v`)
  - reads: `specs/phase1-scaffold-parser.md`
  - validates: files exist in `public/examples/`, parser extracts correct modules from each

- [x] **1.8** Full Phase 1 validation — typecheck + all tests + build
  - runs: `npx tsc --noEmit && npx vitest run && npm run build`
  - validates: all pass, zero errors

### Phase 2: Hierarchy Visualization (Tier 1)

- [x] **2.1** Implement parser → ELK converter (`src/core/converter.ts`) — ParsedDesign to ELK JSON graph
  - reads: `specs/phase2-hierarchy-viz.md`, `src/types/parser.ts`
  - runs: `npx vitest run tests/converter.test.ts`
  - validates: converter tests pass

- [x] **2.2** Implement ELK layout wrapper (`src/core/elk-layout.ts`)
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [x] **2.3** Create dark theme tokens (`src/theme/tokens.css`) + signal color constants (`src/theme/colors.ts`)
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors, tokens.css has Tokyo Night palette

- [x] **2.4** Implement custom ModuleNode component (`src/components/ModuleNode.tsx`)
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [x] **2.5** Implement custom WireEdge component (`src/components/WireEdge.tsx`)
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [x] **2.6** Implement DiagramCanvas (`src/components/DiagramCanvas.tsx`) with React Flow, MiniMap, Controls, Background
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **2.7** Implement `useParser` hook (`src/hooks/useParser.ts`) — debounced parsing
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **2.8** Implement `useLayout` hook (`src/hooks/useLayout.ts`) — converter → ELK → React Flow nodes/edges
  - reads: `specs/phase2-hierarchy-viz.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **2.9** Wire up App.tsx with basic layout — DiagramCanvas renders parser output via useParser + useLayout
  - reads: `specs/phase2-hierarchy-viz.md`, `src/components/DiagramCanvas.tsx`, `src/hooks/useParser.ts`, `src/hooks/useLayout.ts`
  - runs: `npx tsc --noEmit && npm run build`
  - validates: builds successfully, bundle < 1MB

### Phase 3: Split-Pane Layout + Editor Integration

- [ ] **3.1** Install CodeMirror 6 deps + JetBrains Mono font, implement Editor component with Verilog syntax highlighting
  - reads: `specs/phase3-editor-layout.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **3.2** Implement split-pane layout in App.tsx — left panel (editor + toolbar), right panel (diagram)
  - reads: `specs/phase3-editor-layout.md`, `src/App.tsx`
  - runs: `npx tsc --noEmit && npm run build`
  - validates: builds successfully

- [ ] **3.3** Implement Toolbar component — example selector dropdown, parse indicator, theme toggle
  - reads: `specs/phase3-editor-layout.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **3.4** Implement StatusBar component — parse status, module/instance counts
  - reads: `specs/phase3-editor-layout.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **3.5** Wire cross-panel signal highlighting — click wire → highlight in editor, click signal → highlight wire
  - reads: `specs/phase3-editor-layout.md`, `src/App.tsx`
  - runs: `npx tsc --noEmit && npm run build`
  - validates: builds successfully

- [ ] **3.6** Add global styles (`src/index.css`) — font import, theme application, resize handle, scrollbars
  - reads: `specs/phase3-editor-layout.md`
  - runs: `npm run build`
  - validates: builds successfully

### Phase 4: Yosys WASM Integration (Tier 2)

- [ ] **4.1** Install `yosys2digitaljs`, implement Yosys Web Worker (`src/workers/yosys.worker.ts`)
  - reads: `specs/phase4-yosys-rtl.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **4.2** Implement `useSynthesis` hook — worker lifecycle, status states, caching
  - reads: `specs/phase4-yosys-rtl.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **4.3** Implement RTL netlist → React Flow converter (`src/core/rtl-converter.ts`)
  - reads: `specs/phase4-yosys-rtl.md`
  - runs: `npx vitest run tests/rtl-converter.test.ts`
  - validates: rtl-converter tests pass

- [ ] **4.4** Implement RTL node components (`src/components/RtlNode.tsx`) — OperatorNode, MuxNode, DffNode, GateNode, ConstantNode
  - reads: `specs/phase4-yosys-rtl.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **4.5** Add Hierarchy/RTL tab switching to DiagramCanvas + "Synthesize" button to Toolbar
  - reads: `specs/phase4-yosys-rtl.md`, `src/components/DiagramCanvas.tsx`, `src/components/Toolbar.tsx`
  - runs: `npx tsc --noEmit && npm run build`
  - validates: builds successfully, main bundle < 1MB

- [ ] **4.6** Update StatusBar with synthesis progress display
  - reads: `specs/phase4-yosys-rtl.md`, `src/components/StatusBar.tsx`
  - runs: `npm run build`
  - validates: builds successfully

### Phase 5: Simulation + Waveforms (Tier 3)

- [ ] **5.1** Implement event-driven simulator core (`src/core/simulator.ts`) — cell evaluation functions for all Yosys cell types
  - reads: `specs/phase5-simulation.md`
  - runs: `npx vitest run tests/simulator.test.ts`
  - validates: simulator unit tests pass (AND, MUX, DFF, full adder)

- [ ] **5.2** Implement simulation Web Worker (`src/workers/simulator.worker.ts`)
  - reads: `specs/phase5-simulation.md`, `src/core/simulator.ts`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **5.3** Implement `useSimulation` hook — worker management, step/run/pause/reset/toggleInput
  - reads: `specs/phase5-simulation.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **5.4** Add interactive input controls to RTL schematic — click to toggle, multi-bit popover
  - reads: `specs/phase5-simulation.md`, `src/components/DiagramCanvas.tsx`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **5.5** Implement signal propagation visualization — wire color updates based on signal value
  - reads: `specs/phase5-simulation.md`, `src/components/WireEdge.tsx`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **5.6** Implement Waveform panel (`src/components/Waveform.tsx`) + bottom panel layout
  - reads: `specs/phase5-simulation.md`
  - runs: `npx tsc --noEmit && npm run build`
  - validates: builds successfully

- [ ] **5.7** Add simulation controls to Toolbar — play/pause, step, reset, speed control
  - reads: `specs/phase5-simulation.md`, `src/components/Toolbar.tsx`
  - runs: `npx tsc --noEmit && npm run build`
  - validates: builds successfully

### Phase 6: Polish + PWA

- [ ] **6.1** Add Service Worker for WASM caching (`vite-plugin-pwa`)
  - reads: `specs/phase6-polish-pwa.md`
  - runs: `npm run build`
  - validates: PWA manifest in `dist/`

- [ ] **6.2** Implement semantic zoom — detail levels based on viewport zoom
  - reads: `specs/phase6-polish-pwa.md`, `src/components/DiagramCanvas.tsx`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **6.3** Add keyboard shortcuts
  - reads: `specs/phase6-polish-pwa.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **6.4** Implement SVG/PNG export
  - reads: `specs/phase6-polish-pwa.md`
  - runs: `npx tsc --noEmit`
  - validates: no type errors

- [ ] **6.5** Implement URL sharing — gzip + base64 encoding, Share button with toast
  - reads: `specs/phase6-polish-pwa.md`
  - runs: `npx vitest run tests/url-encoding.test.ts`
  - validates: round-trip encode/decode test passes

- [ ] **6.6** UI polish — animations, transitions, toast notifications, parse error underlines, favicon
  - reads: `specs/phase6-polish-pwa.md`
  - runs: `npm run build`
  - validates: builds successfully

- [ ] **6.7** Write README.md
  - reads: `specs/phase6-polish-pwa.md`
  - validates: README.md exists with usage instructions

- [ ] **6.8** Final validation — full typecheck + all tests + build + bundle size check
  - runs: `npx tsc --noEmit && npx vitest run && npm run build`
  - validates: all pass, main chunk < 1MB

---

## Current Task
2.7

## Completed
- **1.1** — Vite + React + TS scaffold with all core deps. Build produces `dist/` (194KB gzip main chunk).

## Discovered Issues
(none yet)
