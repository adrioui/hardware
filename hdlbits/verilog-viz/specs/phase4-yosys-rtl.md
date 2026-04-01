# Phase 4: Yosys WASM Integration (Tier 2 — RTL Schematic)

## Overview

Add "Synthesize" button that lazy-loads Yosys WASM in a Web Worker, runs `prep` to produce JSON netlist, converts to React Flow nodes/edges, renders RTL-level schematic.

## Dependencies

```bash
npm install yosys2digitaljs
# @yowasp/yosys loaded lazily from CDN at runtime — NOT a regular dependency
```

## Yosys Web Worker

**File**: `src/workers/yosys.worker.ts`

- Receives Verilog source + topModule name
- Dynamic import from CDN: `https://cdn.jsdelivr.net/npm/@yowasp/yosys/gen/bundle.js`
- Runs: `read_verilog` → `prep -top ${topModule}` → `write_json output.json`
- Posts progress messages: `loading`, `synthesizing`, `result`, `error`

Note: The exact `runYosys` API may differ — consult actual `@yowasp/yosys` docs during implementation.

## useSynthesis Hook

**File**: `src/hooks/useSynthesis.ts`

- Manages Worker lifecycle
- States: `idle` → `loading` → `synthesizing` → `done` / `error`
- Progress messages surfaced to StatusBar
- Returns `{ synthesize, netlist, status, error }`
- Caches last result; only re-synthesizes on user click

## RTL Netlist → React Flow Converter

**File**: `src/core/rtl-converter.ts`

Converts Yosys JSON netlist (via yosys2digitaljs) to React Flow nodes/edges:
- `$add`, `$sub`, `$mul` → labeled operation blocks
- `$mux` → trapezoid/mux symbol
- `$dff`, `$adff` → flip-flop with clock triangle
- `$and`, `$or`, `$not` → labeled rectangles (V1)
- Wire bit-widths preserved from netlist `bits` arrays
- ELK layout with same orthogonal routing config

## RTL Node Components

**File**: `src/components/RtlNode.tsx`

Custom React Flow node types:
- `OperatorNode` — `$add`, `$sub`, `$mul`, `$eq`, `$lt` — labeled rectangle with operator symbol
- `MuxNode` — trapezoid for `$mux`, `$pmux`
- `DffNode` — rectangle with clock triangle for `$dff`, `$adff`, `$sdff`
- `GateNode` — `$and`, `$or`, `$not`, `$xor` — labeled rectangle
- `ConstantNode` — small label for constant drivers

## View Tabs in Diagram Canvas

Modify `src/components/DiagramCanvas.tsx`:
- **Hierarchy** tab — parser-based view (always available)
- **RTL Schematic** tab — Yosys-based view (after synthesis)
- Tab shows spinner/disabled during synthesis

## Toolbar Updates

Modify `src/components/Toolbar.tsx`:
- "Synthesize" button: disabled when code empty/has errors
- Shows "Loading engine (12MB)..." on first click
- Shows "Synthesizing..." during run
- Checkmark when done

## Success Criteria

- `npx tsc --noEmit` — no TypeScript errors
- `npm run build` — main bundle still < 1MB (Yosys lazy)
- `npx vitest run` — rtl-converter unit tests pass
- Click "Synthesize" with full_adder.v → RTL schematic renders
- RTL shows operators as distinct node shapes
- Hierarchy/RTL tab switching works
- Initial page load still fast (<1s, no WASM until click)
