# Phase 5: Simulation + Waveforms (Tier 3)

## Overview

Client-side event-driven simulator on synthesized netlist, interactive input toggling, signal propagation visualization, WaveDrom-based waveform panel.

## Event-Driven Simulator

**File**: `src/core/simulator.ts`

```typescript
interface SimState {
  signals: Map<string, SignalValue>;
  time: number;
  eventQueue: SimEvent[];
}

interface SignalValue {
  bits: ('0' | '1' | 'x' | 'z')[];
  width: number;
}
```

Core logic:
- Initialize all signals to `x`
- Process event queue in time order
- Cell evaluation functions for each Yosys cell type:
  - `$and`, `$or`, `$xor`, `$not` — bitwise logic
  - `$add`, `$sub` — arithmetic (JS BigInt for wide buses)
  - `$mux` — select based on control
  - `$dff` — update output on clock edge
  - `$eq`, `$lt`, `$gt` — comparison
  - `$reduce_and`, `$reduce_or` — reduction
- Zero-delay mode (default): all combinational propagation instant
- Record signal history for waveform display

## Simulation Web Worker

**File**: `src/workers/simulator.worker.ts`

- Receives: netlist + input state changes
- Commands: `step(n)`, `run()`, `pause()`, `reset()`
- Emits: signal history updates per tick

## useSimulation Hook

**File**: `src/hooks/useSimulation.ts`

- Takes synthesized netlist as input
- Provides: `step()`, `run()`, `pause()`, `reset()`, `toggleInput(signalId)`
- Returns: `{ simState, isRunning, time, signalHistory }`

## Interactive Input Controls

On RTL schematic, top-level input ports become interactive:
- Single-bit: click to toggle 0/1
- Multi-bit: click for hex/decimal input popover
- Distinct "clickable" style (cursor pointer, subtle pulse on hover)

## Signal Propagation Visualization

Wire colors update based on signal value:
- Logic `1`: green (`#9ece6a`)
- Logic `0`: dim blue-gray (`#565f89`)
- Unknown `x`: red (`#f7768e`)
- High-Z `z`: dashed line, light gray
- On transition: 150ms CSS pulse animation

## Waveform Panel

**File**: `src/components/Waveform.tsx`

```bash
npm install @wavedrom/doppler
```

- Collapsible bottom panel (horizontal split below diagram)
- Right-click wire → "Add to waveform"
- WaveDrom-style timing diagrams
- Scrollable timeline, zoom
- Synchronized with simulation time

Fallback: custom canvas-based waveform renderer if `@wavedrom/doppler` integration is difficult.

## Simulation Controls in Toolbar

- Play/Pause, Step (one clock cycle), Reset
- Simulation time counter
- Speed control (1x, 10x, 100x)

## Bottom Panel Layout

Modify `src/App.tsx` — nested vertical split for waveform panel:
- Waveform starts collapsed; opens when user adds a signal
- `defaultSize={30} collapsible`

## Success Criteria

- `npx tsc --noEmit` — no TypeScript errors
- `npx vitest run` — simulator tests pass (AND gate, MUX, DFF, full adder)
- `npm run build` — builds successfully
- Load full_adder.v, synthesize, toggle inputs → wire colors update
- Step simulation → DFF outputs update on clock edge
- Right-click wire → waveform panel opens
- Play/pause/reset work
