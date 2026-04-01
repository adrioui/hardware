# Research: Lightest Web Stack for Interactive Verilog Visualizer

## Summary

A Verilog **hierarchy visualizer** (block diagrams showing modules, ports, and instantiations) can be built as a **single HTML file under 80 KB gzipped** — no build step, no bundler — using a plain `<textarea>`, Prism.js for syntax highlighting (~7 KB gzipped), a 100-line custom Verilog module parser, Dagre for auto-layout (~60 KB gzipped), and vanilla SVG rendering with matrix-based pan/zoom. Gate-level netlist rendering (as netlistsvg does) requires ELKjs and balloons to ~800 KB+ gzipped. Mermaid.js is a poor fit for EDA diagrams regardless of its size.

---

## Findings

### 1. Editor: Skip CodeMirror — Use Textarea + Prism.js

**You can absolutely avoid CodeMirror** for a Verilog visualizer input panel. The key pattern is an overlay: a transparent `<textarea>` positioned over a syntax-highlighted `<pre><code>` block that mirrors the textarea content. Prism.js re-highlights on every `input` event.

| Solution | Minified | Gzipped | Notes |
|---|---|---|---|
| Plain `<textarea>` | 0 B | 0 B | No highlighting |
| Prism.js core + `prism-verilog.min.js` | ~10 KB | ~4 KB | Static/overlay highlighting |
| highlight.js core + verilog grammar | ~15 KB | ~6 KB | Auto-detects, slightly heavier |
| CodeMirror 5 | 169 KB | 56 KB | Full editor; CM5 has built-in Verilog mode |
| CodeMirror 6 (minimal, no language) | ~200 KB | ~80 KB | Requires bundling; no official Verilog package |
| CodeMirror 6 (+ setup + community Verilog) | ~300–350 KB | ~110–130 KB | Tree-sitter based, still no `@codemirror/lang-verilog` |
| Monaco Editor | ~2–3 MB | ~700 KB–1 MB | Worker files separate; overkill |

**Critical note**: CodeMirror 6 has **no first-party `@codemirror/lang-verilog`** package. You'd need to wrap the CM5 mode or build a tree-sitter grammar. Prism.js ships `prism-verilog.js` out of the box, loaded from jsDelivr as a 1.2 KB standalone file. [Prism CDN](https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-verilog.min.js)

The textarea overlay approach is used by products like CodeFlask. Implementation is ~40 lines of vanilla JS. [Example: Peter Collingridge](https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/)

---

### 2. SVG Pan/Zoom: 30 Lines of Vanilla JS Beats the Library

The `bumbu/svg-pan-zoom` library (~25 KB min / ~8 KB gzip) adds mouse + touch + keyboard pan/zoom but is overkill. The standard matrix transform approach works in **~30–50 lines**:

```js
let matrix = [1,0,0,1,0,0]; // SVG transform matrix [a,b,c,d,e,f]
const g = svg.querySelector('#diagram-group');

svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const scale = e.deltaY < 0 ? 1.15 : 0.87;
  // Zoom centered on mouse position
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
  matrix[4] += (1 - scale) * svgPt.x;
  matrix[5] += (1 - scale) * svgPt.y;
  for (let i = 0; i < 4; i++) matrix[i] *= scale;
  g.setAttribute('transform', `matrix(${matrix.join(' ')})`);
});
// Similar ~15 lines for drag-to-pan with mousedown/mousemove/mouseup
```

Total: **~1 KB gzipped**. Supports pinch-to-zoom if you add Touch events (~+15 lines). [Peter Collingridge tutorial](https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/) covers the matrix math in full detail. [Source](https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/)

---

### 3. Single HTML File with ES Modules from CDNs — Fully Viable

This is the **recommended architecture** for a lightweight tool:

**Pattern A — UMD via `<script src>` (works with `file://`):**
```html
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-verilog.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dagrejs/dagre@2/dist/dagre.js"></script>
<script type="module" src="app.js"></script>  <!-- your code -->
```

**Pattern B — ES Modules + Import Maps (requires HTTPS / localhost):**
```html
<script type="importmap">
{"imports": {
  "dagre": "https://esm.sh/@dagrejs/dagre@2",
  "prismjs": "https://esm.sh/prismjs@1"
}}
</script>
<script type="module">
import dagre from 'dagre';
import Prism from 'prismjs';
</script>
```

- `importmap` is **Baseline 2023** — supported in all modern browsers (Chrome 89+, Firefox 108+, Safari 16.4+). [CanIUse](https://caniuse.com/import-maps)
- `esm.sh` converts CJS/UMD packages to ES modules on-the-fly — even handles CommonJS dependencies
- The only catch: ES modules **cannot load from `file://`** URLs due to CORS. Use a 1-line server: `python3 -m http.server` or deploy to GitHub Pages. [Julia Evans](https://jvns.ca/blog/2024/11/18/how-to-import-a-javascript-library/)
- For truly portable offline files: stick to UMD `<script>` tags with self-contained bundles

**Single file viability**: Yes. The entire tool can be one `.html` file. Inline CSS in `<style>`, inline JS in `<script>`, reference CDN libs. For offline use, download the CDN assets once and reference them locally.

---

### 4. Minimum Viable Bundle for the Full Stack

Three tiers depending on fidelity:

#### Tier 1 — Hierarchy visualizer only (~15–20 KB gzipped, single HTML file)

Shows module→submodule relationships, port names, instance hierarchy. **NOT gate-level.**

| Component | Approach | Size (gzip) |
|---|---|---|
| Editor | `<textarea>` + overlay | 0 B |
| Highlighting | Prism.js + `prism-verilog.min.js` | ~4 KB |
| Verilog parser | Custom 100-line JS (regex-based module/port/instance extraction) | ~2 KB |
| Layout | Custom hierarchical placement (grid/tree) | ~2 KB |
| SVG rendering | Vanilla DOM API | ~3 KB |
| Pan/zoom | Vanilla matrix JS | ~1 KB |
| **Total** | | **~12–15 KB** |

#### Tier 2 — Hierarchy visualizer with auto-layout (~75–80 KB gzipped)

Adds proper directed-graph auto-layout (Dagre, Sugiyama algorithm):

| Component | Approach | Size (gzip) |
|---|---|---|
| Everything from Tier 1 | — | ~12 KB |
| Layout engine | `@dagrejs/dagre` (CDN) | ~60 KB |
| **Total** | | **~72–80 KB** |

Dagre unpacked is 1.1 MB but the browser bundle (treeshaken) is ~200 KB minified / ~60 KB gzipped. Much smaller than ELKjs. [npm](https://registry.npmjs.org/%40dagrejs%2Fdagre)

#### Tier 3 — Gate-level netlist viewer (~800+ KB gzipped)

Shows actual logic gates from Yosys synthesis output. Requires netlistsvg + ELKjs:

| Component | Size (gzip) |
|---|---|
| `elk.bundled.js` | ~700–800 KB |
| `netlistsvg.bundle.js` | ~50–100 KB |
| Editor (CodeMirror 6 minimal) | ~80 KB |
| **Total** | **~850 KB–1 MB** |

Plus: Verilog→JSON requires either server-side Yosys or `@yowasp/yosys` WASM (~10–30 MB download — a compiled C++ synthesis suite).

---

### 5. How Netlistsvg Works

**Architecture** (5-step pipeline): [Source: nturley/netlistsvg](https://github.com/nturley/netlistsvg)

1. **Input**: Yosys JSON netlist — produced by `yosys -p "read_verilog file.v; prep; write_json out.json"`. This is where Verilog is actually parsed/synthesized; netlistsvg doesn't parse Verilog itself.

2. **FlatModule** (`lib/FlatModule.ts`): Parses Yosys JSON into cells (logic gates, DFFs), ports, wires, constants. Adds synthetic "split/join" nodes for bus slicing.

3. **Skin** (`lib/Skin.ts`): Loads an SVG skin file (`lib/default.svg` or `lib/analog.svg`) which contains `<symbol>` definitions for each cell type (AND gate, DFF, MUX, etc.) with port positions encoded as custom attributes.

4. **ELK Graph** (`lib/elkGraph.ts`): Converts `FlatModule` to ELK's JSON input format (nodes with ports, edges with connection semantics). Runs `elk.layout()` — this is the heavy async step.

5. **Draw** (`lib/drawModule.ts`): Receives ELK's output (positioned nodes + routed wire paths as `sections`/`bendPoints`). Uses `onml` (a tiny S-expression XML library) to serialize the SVG. Renders `<line>` elements for wires, `<circle>` for junction dots, and instantiates skin symbols for cells.

**Dependencies summary** (`package.json`):
```
elkjs       ^0.7.1  — layout engine (the big one, ~3.5 MB unpacked)  
lodash      ^4.17.21 — used in drawModule for flatMap/find/minBy
onml        ^2.1.0  — XML/SVG serializer (tiny, ~30 KB)
ajv         ^8.6.1  — JSON schema validation of the Yosys input
clone       ^2.1.2  — deep clone for graph manipulation
json5       ^2.2.0  — JSON with comments for skin files
```

**Web bundle**: Uses `browserify-shim` to treat ELKjs as a global (`window.ELK`), then bundles just the netlistsvg code separately. You load both `<script>` tags manually:

```html
<script src="elk.bundled.js"></script>          <!-- ELK runs in main thread -->
<script src="netlistsvg.bundle.js"></script>    <!-- netlistsvg uses global ELK -->
```

**Key bottleneck**: ELKjs is the Eclipse Layout Kernel compiled from Java via GWT/TeaVM. It cannot be tree-shaken. The entire ~3.5 MB unpacked bundle is required. The `elk.bundled.js` is a self-contained version that includes ELK's layered + orthogonal routing algorithms.

**What netlistsvg does NOT do**: Parse Verilog. It only renders pre-synthesized Yosys JSON. For a browser-only tool you'd need `@yowasp/yosys` (WASM) or a server endpoint. The archived `YoWASP/yosys` npm package was the browser WASM path but is now read-only/archived.

---

### 6. @aspect-build/rules_js — Not Relevant for Minimal Web Tools

`@aspect-build/rules_js` is a Bazel build rules package for JS monorepos (replaces `rules_nodejs`). It's about hermetic, reproducible multi-package builds — the opposite direction from "no build step." 

For a minimal Verilog visualizer tool, the relevant philosophy is **no build tooling at all**:
- Reference CDN scripts directly in HTML
- Use `esm.sh` as an on-demand build system (converts CJS → ESM)
- If you need one build step, `esbuild` is a single binary that bundles in milliseconds: `esbuild app.js --bundle --outfile=bundle.js`

The "no build" approach is production-viable for tools with ≤5 dependencies.

---

### 7. Mermaid.js for Hierarchy — Oversized and Wrong Tool

**Bundle sizes:**
| Build | Minified | Gzipped |
|---|---|---|
| `mermaid.min.js` (v11, full) | ~1.5 MB | ~350–460 KB |
| `@mermaid-js/tiny` (v11, flowchart + sequence only) | ~450 KB | ~100–140 KB |

The `@mermaid-js/tiny` package achieves 69.7% size reduction by removing: sequence, class, state, gantt, gitGraph, mindmap, sankey, timeline, **and block-beta** diagrams. It only ships flowchart + sequence. [PR #4734](https://github.com/mermaid-js/mermaid/pull/4734)

**Can it render EDA-style block diagrams?**

Only at a superficial level using `flowchart` or `block-beta` syntax:
```
flowchart LR
    A[alu] -->|result| B[reg_file]
    C[decode] -->|opcode| A
```

**Hard limitations for EDA use:**
- ❌ No port direction annotations (input/output/inout with directionality)
- ❌ No bus-width labels on wires (e.g., `[7:0]`)
- ❌ No custom cell symbols (NAND gates, DFFs, MUXes as EDA shapes)
- ❌ `block-beta` (the new block diagram type) is excluded from `@mermaid-js/tiny`
- ❌ No clickable signal tracing / net highlighting
- ✅ Auto-layout via Dagre (included in tiny)
- ✅ Renders clean SVG, exportable
- ✅ Works from CDN, no build step

**Verdict**: Mermaid is attractive for documentation-style module hierarchy diagrams but cannot produce EDA-quality visualizations. Even `@mermaid-js/tiny` at ~130 KB gzipped is heavier than Tier 2's custom stack + Dagre (~72 KB) while being far less customizable.

---

## Recommended Stack: Tier 2 Single-File Architecture

For clean EDA-style block diagrams with minimal bundle:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Total CDN payload: ~65 KB gzipped -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css">
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-verilog.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@dagrejs/dagre@2/dist/dagre.js"></script>
</head>
<body>
  <textarea id="editor" placeholder="// Paste Verilog here..."></textarea>
  <svg id="diagram"><g id="g"></g></svg>

  <script type="module">
    // 1. Textarea overlay highlighting (~20 lines)
    // 2. Custom Verilog parser: extract module/port/instance (~80 lines)
    // 3. Dagre graph build + layout (~50 lines)  
    // 4. SVG render: boxes + labeled ports + wires (~80 lines)
    // 5. Matrix pan/zoom (~40 lines)
    // Total custom JS: ~270 lines / ~5 KB min+gzip
  </script>
</body>
</html>
```

**Total payload**: ~72 KB gzipped. Zero build steps. Deployable to GitHub Pages as-is.

---

## Sources

**Kept:**
- [Peter Collingridge — SVG Pan and Zoom](https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/) — canonical vanilla matrix pan/zoom tutorial with complete code
- [Julia Evans — Importing JS without build system](https://jvns.ca/blog/2024/11/18/how-to-import-a-javascript-library/) — definitive guide to UMD vs ESM vs CJS in no-build context
- [Sidharth Vinod — Shrinking Mermaid](https://sidharth.dev/posts/shrinking-mermaid) — precise bundle composition data for mermaid
- [nturley/netlistsvg — GitHub](https://github.com/nturley/netlistsvg) — source code read directly for architecture analysis
- [Mermaid PR #4734](https://github.com/mermaid-js/mermaid/pull/4734) — confirms 69.7% size reduction and which diagram types are excluded from tiny
- [Hacker News CM5 vs CM6](https://news.ycombinator.com/item?id=31667127) — concrete size numbers: CM5 = 56 KB gzip, CM6 larger
- [CodeMirror discuss: minimal v6 setup](https://discuss.codemirror.net/t/minimal-setup-because-by-default-v6-is-50kb-compared-to-v5/4514) — confirms +50 KB overhead in CM6 vs CM5

**Dropped:**
- NPM trends comparisons — popularity data, not size data
- Bundlephobia URLs — returned 502 errors; estimated from HN/forum cross-references instead
- Comparison blog posts (myfix.it, grokipedia) — SEO-optimized, no precise numbers
- YoWASP/yosys WASM size issue — too far into Tier 3 territory for this research focus

---

## Gaps

1. **Exact ELKjs gzipped size**: The `elk.bundled.js` file size on disk wasn't retrieved directly. Estimated ~700–800 KB gzipped based on npm unpacked size (~3.5 MB) and typical GWT-compiled JS compression ratios. Confirm by running `wc -c` on the file from the netlistsvg GitHub Pages host.

2. **Dagre exact browser bundle size**: `@dagrejs/dagre` unpacked = 1.1 MB, but the browser-targeted `dist/dagre.js` gzipped size wasn't confirmed from bundlephobia (returned 502). The ~60 KB gzip estimate is based on typical Dagre v1 measurements from forum posts. Verify with `esbuild --bundle @dagrejs/dagre --analyze`.

3. **@yowasp/yosys WASM size in browser**: The package is archived and the exact `.wasm` file download size is unclear. Reports suggest 10–30 MB. If browser-side Verilog synthesis is a hard requirement, this is the critical unknown — it may render Tier 3 impractical for web delivery without chunked loading.

4. **Verilog regex parser accuracy**: A 100-line regex parser can handle simple Verilog but will struggle with parameterized modules, generate blocks, interface types (SystemVerilog), and conditional compilation. For a production tool, `tree-sitter-verilog` (WASM, ~800 KB) provides a proper CST — but adds significant bundle weight.

5. **Prism.js Verilog grammar completeness**: Not verified against the full IEEE 1364/1800 spec. Complex constructs (packages, interfaces, clocking blocks) may not highlight correctly. Acceptable for a visualizer UX but worth testing against real codebases.
