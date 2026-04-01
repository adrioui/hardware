# Research: netlistsvg — Deep Dive

## Summary

**netlistsvg** is a lightweight (MIT, ~1.2 MB bundle), browser-ready TypeScript library that converts Yosys JSON netlists to SVG schematics using ELK.js for layout. It renders one flat module at a time via SVG skin templates — no hierarchical drill-down, no simulation, just clean static gate-level SVGs. For a browser-based Verilog toolchain it's the lowest-friction renderer, but its age (~2021 last real activity) and lack of hierarchy support are notable gaps that `d3-hwschematic` and `DigitalJS` address at higher cost.

---

## 1. How It Works Internally

### Pipeline (5 stages)

```
Yosys JSON
  │
  ▼  FlatModule constructor (FlatModule.ts)
  ├─ Pick top module (attribute top=1, else first)
  ├─ Cell.fromYosysCell / Cell.fromPort for every cell & port
  ├─ addConstants()      – inject $constant nodes for '0'/'1' literals
  ├─ addSplitsJoins()    – solve bus splits/joins minimally, add $split/$join cells
  └─ createWires()       – build wire→{drivers,riders,laterals} maps

  │
  ▼  buildElkGraph (elkGraph.ts)
  ├─ Each Cell → ElkModel.Cell {id, width, height, ports[{id,x,y}]}
  ├─ Each Wire → ElkModel.Edge (with sources/targets in ELK hyperedge format)
  ├─ Multi-driver/multi-rider nets get a zero-size $d_N "dummy" node for routing
  ├─ Bus edges (>1 wire) get inline labels ("/ N /") and stroke-width:2
  └─ DFF edges skip direction priority (to handle feedback loops gracefully)

  │
  ▼  elk.layout(graph, {layoutOptions})  — ELK.js async (Promise)
     algorithm: layered, edgeRouting: ORTHOGONAL
     Resolves with x/y positions + bend points for all nodes/edges

  │
  ▼  drawModule(g, flatModule)  (drawModule.ts)
  ├─ Render each Cell via Cell.render(elkChild) → onml.Element
  │    └─ Clones SVG skin template for that cell type
  │       Sets transform="translate(x,y)", injects label text
  ├─ Each edge.sections → <line> segments (start→bend→bend→end)
  ├─ edge.junctionPoints → <circle r=2> dots
  ├─ Bus labels → <rect>+<text> inline labels
  └─ Assemble: ['svg', attrs, style, ...cells, ...lines] → onml.s() → SVG string
```

### Key architectural decisions
- **`onml`** library represents SVG/XML as nested JSON arrays `['tag', {attrs}, ...children]`. This avoids DOM dependency in Node — pure string serialization.
- **`Skin`** class parses the skin SVG at startup. Cell templates are `<g>` elements with custom `s:` namespaced attributes (`s:type`, `s:pid`, `s:x`, `s:y`, `s:width`, `s:height`). Templates are cloned per cell instance.
- **Port positions** are baked into the skin template coordinates (FIXED_POS in ELK), so ELK only places nodes and routes wires, not ports.
- **FlatModule takes only the top module** — it does not recurse into sub-modules.

---

## 2. Bundle Size & Browser Support

### Sizes (raw, unminified)
| File | Size |
|------|------|
| `built/netlistsvg.bundle.js` | **1,247 KB** (1.2 MB) |
| `elk.bundled.js` (ELK.js, required separately) | **~1,320 KB** (1.3 MB, older; newer ~2 MB) |
| **Total** | **~2.5–3 MB** |

With gzip: likely ~350–500 KB total. Perfectly feasible for a web app.

### Browser support: **YES**, explicitly designed for it
```html
<!-- The README documents exactly this pattern -->
<script src="elk.bundled.js"></script>          <!-- creates global ELK -->
<script src="netlistsvg.bundle.js"></script>    <!-- shimmed to use global:ELK -->
<script>
  netlistsvg.render(netlistsvg.digitalSkin, myNetlistJson)
    .then(svgString => document.getElementById('output').innerHTML = svgString);
</script>
```

The bundle is built with **Browserify** + `brfs` (inlines `fs.readFileSync` calls for the skin SVG files) + `browserify-shim` (stubs out the `elkjs` require to use `global.ELK`).

Observable HQ notebooks also support it natively.

---

## 3. Layout Engine

**ELK.js** (Eclipse Layout Kernel, Java→JavaScript via GWT transpilation)

- Algorithm: `layered` (Sugiyama-style directed graph layer assignment)
- Edge routing: `ORTHOGONAL` (rectilinear, no diagonals)
- `org.eclipse.elk.layered.priority.direction: 10` on most edges (forces left→right flow)
- DFFs suppress direction priority (breaks feedback loops so clock doesn't force a right-to-left layer)
- Port side: `WEST` for inputs, `EAST` for outputs (baked into skin template x/y)
- Multi-driver nets: dummy zero-size node inserted to help ELK route fan-out cleanly
- Bus edge thickness: `org.eclipse.elk.edge.thickness: 2` for multi-bit signals

**Not custom** — pure ELK. The `layoutOptions` can be set per-cell via Yosys cell `attributes` (any attribute starting with `org.eclipse.elk` is passed through).

---

## 4. SVG Rendering

**Template-based** (not programmatic drawing).

Two built-in skins:
- `lib/default.svg` — digital gate symbols (AND, OR, NAND, NOR, XOR, NOT, DFF, MUX, adder, comparator, etc.)
- `lib/analog.svg` — analog/PCB component symbols (resistors, capacitors, transistors, etc.)

Each skin has `<g>` templates like:
```svg
<g s:type="$and" s:width="30" s:height="25">
  <rect width="30" height="25" .../>
  <!-- gate shape paths -->
  <circle s:pid="A" s:x="0" s:y="7" .../>   <!-- input port marker -->
  <circle s:pid="B" s:x="0" s:y="18" .../>
  <circle s:pid="Y" s:x="30" s:y="12" .../> <!-- output port marker -->
</g>
```

`Cell.render()` clones the template for a specific cell, sets `transform="translate(x,y)"`, stamps in label text from Yosys cell attributes, and for variable-port cells (split/join/generic) dynamically extends port rows by spacing them at fixed `gap` intervals.

---

## 5. Can We Use netlistsvg Directly in the Browser?

**Yes, and it's straightforward.** But there are important caveats:

### ✅ What works
- Drop-in browser bundle, documented usage pattern
- Async Promise API: `netlistsvg.render(skin, netlist) → Promise<SVGString>`
- No DOM access required (pure string output)
- Custom skins supported (pass custom SVG skin string)
- Can pre-supply ELK layout data to skip re-layout (for caching)
- Skin validates input via JSON Schema (ajv)

### ⚠️ Caveats
1. **ELK must be loaded first** as a global (not bundled in). Load order matters.
2. **1.2 MB + 1.3 MB** scripts before gzip — two large network requests.
3. **No live DOM manipulation** — returns an SVG string you inject with `innerHTML`. No pan/zoom, no click-to-highlight, no tooltips built in.
4. **Stale dependencies**: package.json pins `elkjs: ^0.7.1`. The demo page uses `elk.bundled.js` from GitHub Pages which may lag behind current ELK.
5. **Old TypeScript**: TS 3.x, tslint (deprecated), Browserify (not Webpack/Rollup). The build toolchain is dated.
6. **No module system**: the bundle uses UMD/globals, not ES modules.

### Integration pattern for our use case
```javascript
// Load ELK + netlistsvg
// Then for each exercise:
const svgString = await netlistsvg.render(
  netlistsvg.digitalSkin,    // or custom skin
  yosysJsonNetlist           // from Yosys write_json or YoWASP
);
document.getElementById('schematic').innerHTML = svgString;
```

---

## 6. Quality vs DigitalJS

| Aspect | netlistsvg | DigitalJS |
|--------|-----------|-----------|
| **Output type** | Static SVG string | Interactive JointJS canvas |
| **Simulation** | None | Full event-driven simulator (3vl logic) |
| **Interactivity** | None (SVG has classes for hover CSS) | Drag cells, toggle inputs, see signal values animate |
| **Gate symbols** | Proper IEEE-style gate shapes from skin | Abstract colored boxes with port labels |
| **Subcircuits** | Black-box boxes (no drill-in) | Full drill-in (`zoomInCircuit` handler) |
| **Bundle size** | ~2.5 MB (+ ELK) | ~4–6 MB (JointJS + ELK + jquery + simulation) |
| **Rendering speed** | Fast (ELK async, then static SVG) | Slower (JointJS DOM-heavy) |
| **Input format** | Yosys JSON directly | Requires `yosys2digitaljs` conversion step |
| **Bus handling** | Thick lines + "/N/" labels | Bus splitting shown as colored wires |
| **Schematic style** | Textbook gate-level schematic | Software-block-diagram aesthetic |
| **License** | MIT | BSD-2-Clause |
| **Last release** | 1.0.2 (2021) | 0.14.2 (2024) |

**For a teaching/HDLBits context**: netlistsvg produces better-looking gate schematics (proper symbols, cleaner routing). DigitalJS is better for teaching simulation behavior. Neither is suitable for complex hierarchy navigation without custom work.

---

## 7. Hierarchical Module Views

**netlistsvg: No hierarchical support.**

The `FlatModule` constructor explicitly picks a **single module**:
```typescript
// FlatModule.ts — picks top-marked module or first module only
_.forEach(netlist.modules, (mod, name) => {
    if (mod.attributes && Number(mod.attributes.top) === 1) {
        this.moduleName = name;
    }
});
if (this.moduleName == null) {
    this.moduleName = Object.keys(netlist.modules)[0];
}
```

When sub-modules are NOT inlined by Yosys (using `prep -top` without `flatten`), submodule instances appear as **generic black-box cells** — a labeled rectangle with ports but no internal structure visible.

Issue [#37](https://github.com/nturley/netlistsvg/issues/37) (2018) and [#64](https://github.com/nturley/netlistsvg/issues/64) (2019) both requested hierarchical support. The author acknowledged it was possible (ELK supports nested graphs natively) but it was never implemented. The issues remain open with no progress.

**Workaround**: Run netlistsvg separately for each module in the JSON, and build a navigation UI on top (each black-box module name is a link to that module's schematic).

---

## 8. package.json Dependencies

```json
"dependencies": {
  "@types/clone": "^2.1.0",
  "@types/lodash": "^4.14.170",
  "ajv": "^8.6.1",            // JSON schema validation of input netlist
  "ajv-errors": "^3.0.0",
  "clone": "^2.1.2",          // deep clone SVG skin templates per cell
  "elkjs": "^0.7.1",          // layout engine (NOT bundled in browser build)
  "fs-extra": "^10.0.0",      // CLI file I/O
  "json5": "^2.2.0",          // parsing the schema file (and used in jsmodule)
  "lodash": "^4.17.21",       // utility
  "onml": "^2.1.0",           // SVG/XML ↔ JSON array format
  "yargs": "^17.0.1"          // CLI argument parsing
}
```

**No D3, no jQuery, no React, no heavy UI framework.** Very minimal for a schematic renderer.

Dev: `browserify`, `brfs`, `typescript ~3.x`, `jest`, `tslint`.

---

## Alternatives Landscape

### 1. DigitalJS (`tilk/digitaljs`) — ⭐756
- **What it is**: Full digital circuit simulator + schematic viewer
- **Rendering**: JointJS (SVG-based, DOM-manipulating, interactive)
- **Layout**: ELK.js (`src/elkjs.mjs` with full layered orthogonal layout)
- **Hierarchy**: ✅ Native `Subcircuit` cells with click-to-zoom-in (`open:subcircuit` event)
- **Bundle**: ~4–6 MB (includes JointJS, jQuery, simulation engine, waveform viewer)
- **Input**: Needs `yosys2digitaljs` converter (separate package, handles all Yosys primitives)
- **Best for**: Educational/interactive simulation with visual feedback
- **Weakness**: No proper gate symbols (boxes), heavy, requires jQuery

### 2. d3-hwschematic (`Nic30/d3-hwschematic`) — ⭐118
- **What it is**: D3.js + ELK browser schematic viewer
- **Rendering**: D3.js SVG manipulation, zoom/drag built-in
- **Layout**: ELK.js with caching layer (`elk-d3-cache.js`)
- **Hierarchy**: ✅ Full collapsible hierarchy (D3-style `children`/`_children` toggle)
- **Input**: ELK JSON with `hwMeta` extension. Has `src/yosys.js` Yosys adapter.
- **Features**: Net hover tooltips, CSS class/style per node, custom node renderers (mux, operator, slice), net selection on click
- **Bundle**: D3 v6 (~280 KB) + ELK.js (~1.3 MB)
- **License**: EPL-2.0 ⚠️ (not MIT — copyleft for "programs")
- **Best for**: Rich interactive schematics with hierarchy navigation in web apps
- **Examples**: Used in Sphinx-hwt docs, Jupyter widgets

### 3. HDElk (`davidthings/hdelk`) — ⭐83
- **What it is**: Browser-only HDL diagram tool
- **Input**: Custom JSON format (not Yosys JSON directly)
- **Stack**: ELK.js + SVG.js
- **Best for**: Simple block diagrams, not gate-level netlists

### 4. Yosys `show` / `viz` (built-in)
- `show -format dot` → GraphViz → PNG/SVG
- `viz` command (newer Yosys) uses its own renderer
- **Quality**: Much lower than netlistsvg — no proper gate symbols, generic graph nodes
- **No browser support**

### 5. YoWASP + netlistsvg (full browser pipeline)
- `@yowasp/yosys` provides Yosys compiled to WASM (~8–15 MB) — runs synthesis in browser
- Pipeline: `Verilog source → YoWASP Yosys → write_json → netlistsvg.render() → SVG`
- This is how the [digitaljs.tilk.eu](https://digitaljs.tilk.eu/) online demo works conceptually
- YoWASP is actively maintained (archive warning was for a specific sub-repo)

### 6. @silimate/netlistsvg (fork on npm)
- Published as `@silimate/netlistsvg@1.1.4` (Neil Turley himself, via Silimate company)
- Points back to the same GitHub repo but different npm scope
- Suggests the author is doing commercial work based on netlistsvg (EDA tooling startup)

---

## Decision Matrix for Browser Verilog → Schematic

| Requirement | netlistsvg | DigitalJS | d3-hwschematic |
|-------------|-----------|-----------|----------------|
| Yosys JSON input | ✅ Direct | ⚠️ Needs converter | ⚠️ Needs adapter |
| Browser-ready | ✅ | ✅ | ✅ |
| Static SVG output | ✅ | ❌ (DOM canvas) | ❌ (DOM canvas) |
| Gate symbols | ✅ | ❌ | ❌ |
| Hierarchical view | ❌ | ✅ | ✅ |
| Interactivity | ❌ | ✅ | ✅ |
| MIT license | ✅ | ✅ (BSD-2) | ❌ (EPL-2) |
| Bundle size | ~2.5 MB | ~5 MB | ~1.6 MB |
| Active maintenance | ❌ (2021) | ✅ (2024) | ⚠️ (2022) |
| Single module only | ✅ (limitation) | ✅ | ✅ (collapsible) |

**Recommendation for HDLBits-style use (single module exercises)**: netlistsvg is the right fit — MIT, lightweight, direct Yosys JSON, no hierarchy needed for leaf modules, produces proper textbook gate schematics. The main work is wiring up the ELK loading order and injecting the SVG string into the DOM.

---

## Sources

**Kept:**
- [nturley/netlistsvg source](https://github.com/nturley/netlistsvg) — primary; Cell.ts, FlatModule.ts, elkGraph.ts, drawModule.ts, index.ts, jsmodule/index.js, package.json all read
- [netlistsvg bundle size](https://api.github.com/repos/nturley/netlistsvg/contents/built/netlistsvg.bundle.js) — exact byte count: 1,246,865
- [tilk/digitaljs source](https://github.com/tilk/digitaljs) — subcircuit.mjs, elkjs.mjs, package.json for comparison
- [Nic30/d3-hwschematic](https://github.com/Nic30/d3-hwschematic) — README + package.json for alternative analysis
- [Issue #37: Hierarchical designs](https://github.com/nturley/netlistsvg/issues/37) — confirmed no hierarchy support as of 2019, unresolved

**Dropped:**
- Chinese CSDN blog posts — redundant with primary source
- GraphViz comparison videos — off-topic for browser use question
- hwtLib/Sphinx-hwt links — d3-hwschematic ecosystem tangents

## Gaps

1. **Minified/gzipped bundle size**: only raw bytes measured. Real transfer size unknown without compression test.
2. **ELK layout performance**: no benchmarks found for rendering time on large netlists (e.g., >100 cells).
3. **@silimate/netlistsvg vs nturley/netlistsvg**: unclear what actually differs in the Silimate fork despite the npm package being newer.
4. **YoWASP in-browser latency**: synthesis step timing unknown — relevant for whether full browser pipeline is viable for interactive use.
