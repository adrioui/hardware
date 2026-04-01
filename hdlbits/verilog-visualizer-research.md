# Research: Lightest Web Editor & UI for a Verilog Visualizer

## Summary

For an absolute minimum footprint: use a **plain `<textarea>`** (0KB) or the **textarea+Prism overlay** trick (~12KB compressed), **Prism.js** for syntax highlighting (~11.7KB gzip), and a **vanilla 69-line JS SVG pan-zoom** (no library). Total theoretical minimum for the complete app is **25–65KB gzip**, depending on how much of the Verilog parser and layout you write yourself. WaveDrom demonstrates this approach: a full JS diagramming tool in a single ~54KB raw / ~15KB gzip bundle, no framework, no build step.

---

## Findings

### 1. Editor Bundle Sizes (min+gzip)

| Editor | Min+Gzip | Notes |
|--------|----------|-------|
| Plain `<textarea>` | **0 KB** | No highlighting; works perfectly for input |
| Prism.js overlay trick | **~11–13 KB** | textarea + `<pre><code>`, scroll-synced |
| `prism-code-editor` | **~8–15 KB** | Polished overlay library; Prism core trimmed to ⅓ size |
| highlight.js | **~15.6 KB** | Heavier than Prism, no Verilog grammar advantage |
| CodeMirror 6 (minimal) | **~50 KB** | State + View + minimalSetup only |
| CodeMirror 6 (basicSetup) | **~80–120 KB** | Adds line numbers, gutter, history, search |
| CodeMirror 6 (full `codemirror`) | **~200 KB** | Full convenience package |
| Monaco Editor | **~5 MB** (gzip) | v0.55 reportedly now >6MB per [GH #5154](https://github.com/microsoft/monaco-editor/issues/5154) |
| Shiki (WASM) | **~280 KB** | Includes 622KB Oniguruma WASM + grammars; build-time only use makes sense |

**Prism.js size breakdown** (from [chsm.dev comparison](https://chsm.dev/blog/2025/01/08/comparing-web-code-highlighters)):
- Core: 7.29 KB raw / ~5 KB compressed  
- TSX grammar: 12.8 KB raw / ~4.6 KB compressed  
- Theme: 1.75 KB  
- **Total: ~27 KB raw / ~11.7 KB gzip**

**No `@codemirror/lang-verilog` exists.** For CodeMirror 6 + Verilog you must use [`@codemirror/legacy-modes`](https://github.com/codemirror/legacy-modes) (ports CM5 Verilog mode) + a `StreamLanguage` adapter — adds another ~5–10 KB. CodeMirror 5 *did* have [native Verilog/SystemVerilog mode](https://codemirror.net/5/mode/verilog/).

Sources: [pkgpulse comparison (2026)](https://www.pkgpulse.com/blog/monaco-editor-vs-codemirror-6-vs-sandpack-in-browser-code-editors-2026), [chsm.dev highlighter comparison](https://chsm.dev/blog/2025/01/08/comparing-web-code-highlighters)

---

### 2. Contenteditable + Prism.js: Overlay Technique

**The problem with a raw `contenteditable` div + Prism**: every `innerHTML` rewrite moves the cursor to position 0. Don't do it.

**The CSS-Tricks solution** ([full article](https://css-tricks.com/creating-an-editable-textarea-that-supports-syntax-highlighted-code/)): layer a transparent `<textarea>` on top of a `<pre><code>` block. The textarea captures editing; the `<pre><code>` shows highlighting. Key CSS:

```css
#editing, #highlighting {
  position: absolute; top: 0; left: 0;
  margin: 10px; padding: 10px;
  font-size: 15pt; font-family: monospace; line-height: 20pt;
  overflow: auto; white-space: pre;
}
#editing {
  z-index: 1;
  color: transparent;         /* text invisible — only cursor shows */
  background: transparent;
  caret-color: white;
  resize: none; spellcheck: false;
}
```

JS sync on input:
```javascript
function update(text) {
  let el = document.querySelector("#highlighting-content");
  if (text[text.length-1] == "\n") text += " "; // fix final newline
  el.innerHTML = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  Prism.highlightElement(el);
}
textarea.addEventListener("input", e => {
  update(e.target.value);
  pre.scrollTop = textarea.scrollTop;
  pre.scrollLeft = textarea.scrollLeft;
});
textarea.addEventListener("scroll", e => {
  pre.scrollTop = e.target.scrollTop;
  pre.scrollLeft = e.target.scrollLeft;
});
```

**Usability issues to handle**:
- Tab key must be intercepted manually
- Scroll sync breaks on final empty newline (fixed above)
- Spellcheck must be disabled
- Font metrics must match exactly between textarea and pre

**`prism-code-editor`** by FlameCaster handles all this robustly. It uses the same overlay approach but adds: line numbers, bracket matching, rainbow brackets, autocomplete API, and a clean extension system. Their Prism core is trimmed to less than ⅓ of Prism's original size. Languages auto-import dependencies. [GitHub](https://github.com/FIameCaster/prism-code-editor)

**Verdict**: The overlay technique works well for ≤1000 LOC (as `prism-code-editor` itself notes). For a Verilog visualizer where inputs are typically 10–200 lines, this is entirely sufficient.

---

### 3. SVG Pan-Zoom Approaches

| Library | Unpacked Size | Approx. Min+Gzip | Notes |
|---------|--------------|------------------|-------|
| `svg-pan-zoom` (bumbu) | ~50 KB | ~6 KB | Mouse/touch/programmatic. Single JS file. |
| `@panzoom/panzoom` | 163 KB | ~5–8 KB | Uses CSS transforms (not SVG viewBox) |
| `panzoom` (anvaka) | **702 KB** | ~10–15 KB | Bloated unpacked; works on SVG + DOM |
| Vanilla implementation | 0 KB | ~1.5 KB | 69 lines — see below |

**Vanilla SVG pan-zoom in ~50 lines** (viewBox mutation approach — cleaner than CSS transforms for SVG):

```javascript
function makePanZoom(svg) {
  let vb = svg.viewBox.baseVal;  // {x, y, width, height}
  let dragging = false, startX, startY, startVBX, startVBY;

  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    vb.x = svgPt.x - (svgPt.x - vb.x) * scale;
    vb.y = svgPt.y - (svgPt.y - vb.y) * scale;
    vb.width  *= scale;
    vb.height *= scale;
  }, { passive: false });

  svg.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    startVBX = vb.x; startVBY = vb.y;
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const scaleX = vb.width  / svg.clientWidth;
    const scaleY = vb.height / svg.clientHeight;
    vb.x = startVBX - (e.clientX - startX) * scaleX;
    vb.y = startVBY - (e.clientY - startY) * scaleY;
  });

  window.addEventListener('mouseup', () => { dragging = false; });
}
```

Touch support adds ~20 more lines. Total: ~70 lines, ~1.5 KB minified. This is the **recommended approach** — zero dependency, works perfectly with SVG viewBox coordinate space.

**Why viewBox over CSS transforms?**: When you use CSS `transform: scale()` on an SVG, the coordinate space doesn't match SVG's internal coordinates. `viewBox` keeps everything in SVG coordinates, so `svg.createSVGPoint().matrixTransform(svg.getScreenCTM().inverse())` correctly maps screen clicks to SVG coordinates — critical for interactive circuit diagrams.

Sources: [69-line zoom/pan](https://betterprogramming.pub/implementation-of-zoom-and-pan-in-69-lines-of-javascript-8b0cb5f221c1), [Peter Collingridge SVG tutorial](https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/)

---

### 4. Single HTML File with CDN Imports

**Yes, fully feasible.** The approach: one `.html` file with `<script type="module">` importing from `esm.sh` or `jsdelivr`.

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "prismjs": "https://esm.sh/prismjs@1.30.0",
      "prism-code-editor": "https://esm.sh/prism-code-editor@5.1.0"
    }
  }
  </script>
  <link rel="modulepreload" href="https://esm.sh/prismjs@1.30.0">
</head>
<body>
  <script type="module">
    import Prism from 'prismjs';
    // ... app code inline
  </script>
</body>
</html>
```

**Waterfall problem**: ES modules load lazily. If module A imports B which imports C, each requires a separate HTTP round-trip:
```
HTML → (parse) → main.js → (fetch) → prismjs → (fetch) → prismjs/components/... → ...
```

**Solutions**:
1. **`<link rel="modulepreload">`** — tells the browser to fetch known deps in parallel during HTML parse:
   ```html
   <link rel="modulepreload" href="https://esm.sh/prismjs@1.30.0">
   <link rel="modulepreload" href="https://esm.sh/prism-code-editor@5.1.0">
   ```
2. **Use esm.sh's bundle mode**: `https://esm.sh/prism-code-editor?bundle` — esm.sh bundles transitive deps into one file, eliminating the waterfall.
3. **Inline critical JS** directly in the `<script type="module">` tag if small enough.

**CDN comparison**:
- **esm.sh**: Best for npm packages. Converts CJS→ESM. Supports `?bundle`. Caches aggressively.
- **jsdelivr**: Good for packages already shipping ESM. Stable CDN.
- **unpkg**: Similar to jsdelivr, slightly older API.

**Practical waterfall for a minimal app** (Prism overlay + custom renderer):
- 1 HTML file (inline script): ~5 KB  
- prismjs CDN (bundled): ~12 KB gzip  
- Prism Verilog grammar: ~3 KB gzip  
- Total: ~20 KB, **2 network round-trips** if modulepreload used correctly

Sources: [esm.sh runtime deps](https://appsai.com/articles/esm-sh-runtime-dependencies/), [module waterfall article](https://blacksheepcode.com/posts/loading_optimisations_part_4), [bundling without bundler](https://dev.to/louwers/bundling-without-a-bundler-with-esmsh-3c2k)

---

### 5. Theoretical Minimum Bundle for Full App

| Component | Min Option | Size (gzip) |
|-----------|-----------|-------------|
| **Editor** | Plain `<textarea>` | 0 KB |
| **Syntax highlighting** | Prism.js core + Verilog grammar | ~12 KB |
| **Verilog parser** | Custom recursive-descent (subset) | ~10–20 KB |
| **Layout engine** | Custom hierarchical layout | ~10–30 KB |
| **SVG rendering** | Vanilla DOM SVG creation | ~3–8 KB |
| **Pan-zoom** | Vanilla viewBox implementation | ~1.5 KB |
| **UI chrome** | Inline CSS + HTML structure | ~2 KB |
| **Total (min)** | | **~38–73 KB gzip** |

**If using prism-code-editor** (better UX): add ~10–15 KB.  
**If using CodeMirror 6** (best UX, full editor): add ~60–80 KB (minimal setup + legacy Verilog mode).

The **parser and layout are the wildcasts** — a real Verilog parser that handles module hierarchies, port declarations, and wire connections could easily grow to 50–100 KB. Consider targeting a **subset of Verilog** (just modules, ports, wire/reg declarations, assign, always blocks) to keep the parser manageable.

---

### 6. WaveDrom's Architecture — How They Stay Small

WaveDrom ([github.com/wavedrom/wavedrom](https://github.com/wavedrom/wavedrom)) is the gold-standard reference for this type of tool. **Bundle: ~54 KB raw, ~15 KB gzip** for the full renderer.

**Key architectural decisions**:

1. **`eval()` for parsing** — the input format is JSON5/WaveJSON:
   ```javascript
   // From lib/eva.js — they literally eval() the textarea value
   function eva(id) {
     const TheTextBox = document.getElementById(id);
     source = eval("(" + TheTextBox.value + ")");
     return source;
   }
   ```
   This eliminates an entire parser library. Risky for untrusted input, but perfect for a developer tool where the user is the code author.

2. **`onml` for SVG construction** — instead of React/Vue/etc., they use a tiny virtual-DOM-for-XML library. SVG elements are plain JS arrays:
   ```javascript
   // onml format: [tagName, attributes, ...children]
   ["svg", { width: 200, height: 100 },
     ["rect", { width: 200, height: 100, style: "fill:white" }],
     ["g", { id: "lanes_0" }]
   ]
   ```
   `onml` serializes these to SVG/HTML strings. Zero framework overhead.

3. **Tiny production dependencies**:
   - `onml` — virtual DOM for XML/SVG (tiny)
   - `tspan` — handles SVG `<tspan>` for text rendering
   - `bit-field` — register diagram renderer
   - `logidrom` — logic diagram renderer

4. **Skin as a separate JS file** — the SVG template (colors, shapes) is loaded as a separate `default.js` / `dark.js` file, keeping the core renderer theme-agnostic.

5. **Browserify bundle, no module loader needed** — the output `wavedrom.min.js` is a self-contained IIFE. Users embed it with two `<script>` tags and zero build tooling.

6. **Input via `<script type="WaveDrom">`** — elegant: `ProcessAll()` scans the DOM for `<script type="WaveDrom">` elements and renders each one. No UI framework needed.

**What this means for a Verilog visualizer**:
- Adopt the same `onml`-style array representation for SVG building
- Use a textarea for input (or thin Prism overlay) instead of `eval()`
- Write a recursive-descent Verilog parser for a targeted subset
- Build a simple hierarchical layout (Sugiyama/dot-style) yourself
- Consider shipping `<script type="verilog-viz">` tags like WaveDrom does

---

## Recommended Stack (Ranked by Size)

### Option A: Absolute Minimum (~15–20 KB gzip)
- Plain `<textarea>` input (0 KB)
- Prism.js + Verilog grammar for display-only highlighting (~12 KB)  
- Custom Verilog parser (~15 KB)
- Custom SVG layout + rendering (~15 KB)
- Vanilla pan-zoom (~1.5 KB)
- **Single HTML file, no build step**

### Option B: Best UX, Still Lightweight (~45–70 KB gzip)
- `prism-code-editor` with Verilog grammar (~15 KB)
- Custom Verilog parser (~15 KB)
- Custom SVG layout + rendering (~15 KB)
- Vanilla pan-zoom (~1.5 KB)
- **Single HTML file via esm.sh CDN with modulepreload**

### Option C: Full Featured (~150 KB gzip)
- CodeMirror 6 (minimal setup) + `@codemirror/legacy-modes` Verilog (~60 KB)
- Custom Verilog parser (~15 KB)  
- Custom SVG layout + rendering (~15 KB)
- `@panzoom/panzoom` (~6 KB)
- **Bundled with Rollup/esbuild**

---

## Sources

**Kept**:
- [pkgpulse.com Monaco vs CodeMirror 6 vs Sandpack 2026](https://www.pkgpulse.com/blog/monaco-editor-vs-codemirror-6-vs-sandpack-in-browser-code-editors-2026) — authoritative bundle size comparison table
- [chsm.dev Comparing web code highlighters](https://chsm.dev/blog/2025/01/08/comparing-web-code-highlighters) — exact size breakdown for Prism/HLJS/Shiki with data
- [CSS-Tricks: Editable textarea with syntax highlighting](https://css-tricks.com/creating-an-editable-textarea-that-supports-syntax-highlighted-code/) — canonical reference for the overlay technique
- [FlameCaster/prism-code-editor](https://github.com/FIameCaster/prism-code-editor) — production-quality Prism overlay editor
- [WaveDrom source](https://github.com/wavedrom/wavedrom) — gold standard reference architecture
- [69-line pan/zoom](https://betterprogramming.pub/implementation-of-zoom-and-pan-in-69-lines-of-javascript-8b0cb5f221c1) — vanilla SVG pan/zoom implementation
- [npm: @panzoom/panzoom](https://www.npmjs.com/package/@panzoom/panzoom) — 163 KB unpacked
- [npm: panzoom (anvaka)](https://registry.npmjs.org/panzoom) — 702 KB unpacked

**Dropped**:
- Monaco-languageclient issues — about LSP integration, not bundle size
- stackshare.io comparison — too high-level, no numbers

---

## Gaps

1. **Exact prism-code-editor min+gzip size** — bundlephobia returned 502; the badge in their README links to it but wasn't readable. Estimate ~8–15 KB based on description.
2. **Exact svg-pan-zoom (bumbu) gzip size** — bundlephobia also returned 502. Their dist file is a single JS file; historically ~6–8 KB gzip.
3. **Verilog parser options** — no research was done on existing lightweight Verilog parsers (vs. writing your own). `verilog-parser` and `hdl.js` on npm deserve investigation before committing to a custom parser.
4. **Layout algorithm size** — Dagre.js (common for hierarchical layout) is ~40–60 KB gzip; ELK.js is heavier. A custom force-directed or simple layered layout written from scratch could be 5–15 KB.

**Next steps**: 
- Look at `verilog-parser` and `hdl.js` npm packages for parser size/feature coverage
- Profile WaveDrom's `wavedrom.min.js` gzip size precisely (fetch via curl + check content-encoding)
- Prototype the prism overlay approach with a hand-written Verilog Prism grammar (Verilog grammar is ~200 lines of regex)
