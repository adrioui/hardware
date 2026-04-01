# Phase 1: Project Scaffold + Custom Verilog Parser

## Overview

Set up Vite + React + TypeScript project, install core dependencies, and implement a custom Verilog parser that extracts module hierarchy from source code.

## Project Initialization

```bash
npm create vite@latest . -- --template react-ts
npm install @xyflow/react elkjs react-resizable-panels
npm install -D @types/node vitest
```

## Custom Verilog Parser

**File**: `src/core/parser.ts` (~400 LOC)

### Two-Phase Parser

**Phase A — Strip comments and strings:**
- Remove `//` line comments and `/* */` block comments
- Remove string literals
- Preserve line/column tracking for error reporting

**Phase B — Scan for module declarations and instantiations:**
- Match `module <name> (` or `module <name> #(` for module declarations
- Extract port declarations: `input`, `output`, `inout` with optional `[N:M]` ranges
- Detect instantiations: at module scope, `identifier identifier (` is always a module instantiation
- Handle `#(` parameter overrides on instantiations
- Flatten `generate` blocks (extract all instantiations regardless of conditions)
- Include all `ifdef` branches

### Output Types

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
  moduleName: string;
  instanceName: string;
  connections: Map<string, string>;
  parameters: Map<string, string>;
  loc: SourceLocation;
}
```

### V1 Edge Case Decisions

| Pattern | V1 Action |
|---------|-----------|
| `generate if/for` blocks | Flatten — extract all instantiations |
| `` `ifdef `` guards | Include all branches |
| Escaped identifiers `\name ` | Skip (~5% of RTL) |
| Parameterized widths `[WIDTH-1:0]` | Show as expression string |
| Packages/imports | Ignore |
| Non-ANSI module headers | Warn + skip port extraction |

## Parser Unit Tests

**File**: `tests/parser.test.ts`

Test cases:
- Single module with ANSI ports
- Module with input/output/inout ports and bus widths
- Module instantiation with named port connections (`.port(signal)`)
- Module instantiation with positional connections
- Parameterized module instantiation (`#(.WIDTH(8))`)
- Multiple modules in one file
- Nested instantiations (A instantiates B, B instantiates C)
- Comments and strings properly stripped
- `generate` blocks — instances inside are extracted
- `ifdef` — instances from all branches extracted
- Empty module (no ports, no instances)
- Error recovery: malformed module still parses remaining modules

## Example Verilog Files

**Directory**: `public/examples/`

Create 5 files:
- `full_adder.v` — hierarchy (full_adder instantiates half_adder)
- `counter.v` — single module with ports, no sub-instances
- `mux4.v` — mux4 built from mux2 instances
- `alu.v` — ALU with multiple operation submodules
- `fsm.v` — finite state machine (single module, tests port extraction)

## Success Criteria

- `npm install` completes without errors
- `npm run build` produces output in `dist/`
- `npx vitest run` — all parser tests pass
- `npx tsc --noEmit` — no TypeScript errors
- Parser correctly extracts modules, ports, and instances from all 5 example files
