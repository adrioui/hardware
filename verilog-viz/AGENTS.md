# AGENTS.md

Start here: `CLAUDE.md`

## Build & Run

```bash
npm install                        # install dependencies
npm run dev                        # dev server at localhost:5173
npm run build                      # production build → dist/
```

## Validation

- Typecheck: `npx tsc --noEmit`
- Tests: `npx vitest run`
- Build: `npm run build`
- Bundle size: `ls -lh dist/assets/*.js` (main chunk must be < 1MB)

## Operational Notes

- Read `CLAUDE.md` for project overview and structure
- Read the relevant spec in `specs/` before implementing any feature
- Read `IMPLEMENTATION_PLAN.md` for current task and progress
- Before making changes, search codebase — don't assume not implemented
- Do not place status reports in this file — update `IMPLEMENTATION_PLAN.md` instead
- Keep responses concise, cite paths

### Codebase Patterns

- Custom React Flow nodes go in `src/components/` with `Node` suffix (e.g., `ModuleNode.tsx`)
- Custom React Flow edges go in `src/components/` with `Edge` suffix (e.g., `WireEdge.tsx`)
- Core logic (parser, converters, layout) goes in `src/core/`
- React hooks go in `src/hooks/` with `use` prefix
- TypeScript types go in `src/types/`
- Web Workers go in `src/workers/` with `.worker.ts` suffix
- Theme tokens are CSS custom properties in `src/theme/tokens.css`
- Example Verilog files go in `public/examples/`
- Test fixtures go in `tests/examples/`
