# Phase 6: Polish + PWA

## Overview

Service Worker for WASM caching, semantic zoom, keyboard shortcuts, SVG export, URL sharing, UI polish.

## Service Worker for WASM Caching

```bash
npm install -D vite-plugin-pwa
```

- Precache all app assets
- Runtime cache `CacheFirst` for `.wasm` files
- Cache name: `wasm-cache`, max age: 1 year

## Semantic Zoom

Use React Flow's `useViewport()`:

| Zoom level | Render |
|------------|--------|
| < 30% | Module boxes only, filled color, no labels |
| 30%–80% | Module names, port names on hover only |
| 80%–150% | Full port labels, signal names, bus width annotations |
| > 150% | Bit-range annotations, parameter values, source location |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Parse / re-layout |
| `Ctrl+Shift+Enter` | Synthesize |
| `Space` (diagram focused) | Play/pause simulation |
| `→` (diagram focused) | Step simulation |
| `Ctrl+\` | Toggle editor panel |
| `Ctrl+J` | Toggle waveform panel |
| `F` | Fit diagram to view |

## SVG/PNG Export

- SVG: `@xyflow/react` `toSvg()` utility
- PNG: render SVG to canvas → `canvas.toBlob()` → download
- Include background based on current theme

## URL Sharing

- `#code=<base64(gzip(verilog_source))>` — compressed source
- `#example=full_adder` — reference to built-in example
- "Share" button copies URL to clipboard with toast
- Use `CompressionStream` API for gzip

## UI Polish

- Node entrance: `opacity 0→1` over 200ms, staggered 20ms per node
- Selection: `box-shadow` pulse (300ms), then static accent border
- Wire hover: 1px→2px, 100ms ease
- Toast notifications: bottom-right, auto-dismiss 3s
- Parse errors: red underlines in editor (CodeMirror diagnostics)
- Favicon: simple circuit icon SVG

## README

**File**: `README.md`

- What it is (one paragraph)
- Screenshot placeholder
- How to run (`npm install && npm run dev`)
- Tech stack, license note (ELK.js is EPL-2.0)

## Success Criteria

- `npx tsc --noEmit` — no errors
- `npm run build` — main chunk < 1MB
- `npx vitest run` — all tests pass
- PWA manifest in `dist/`
- Semantic zoom detail levels change on zoom
- Keyboard shortcuts work
- SVG export produces valid file
- Share URL round-trips correctly
- Smooth dark/light toggle
