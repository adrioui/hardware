# Research: Lightweight Graph Layout for EDA-Style Block Diagrams in the Browser

## Summary

For rectangular blocks with named ports on left/right edges and orthogonal wire routing, **ELK.js is the only mature JavaScript option with first-class port-constraint support**, but it carries a ~1.6 MB pre-gzip payload (GWT-compiled Java monolith, not tree-shakeable). Dagre and d3-dag have no port concept. HDElk and d3-hwschematic are thin EDA-specific wrappers over ELK, so their bundle weight is identical. A custom Sugiyama with orthogonal port routing is not feasible in <500 lines — realistically 800–1,200 lines for quality results.

---

## Findings by Library

### 1. ELK.js (`elkjs`)

| Attribute | Value |
|---|---|
| npm package | `elkjs` |
| Latest version | 0.11.1 (published **March 2026**, actively maintained) |
| npm unpacked size | ~8.11 MB (0.11.0) |
| `elk.bundled.js` (browser drop-in) | **1.61 MB** unminified |
| `elk-worker.min.js` (GWT engine only) | **1.59 MB** minified |
| `elk-api.js` (thin JS wrapper) | **9.16 KB** |
| Gzipped estimate for bundled | ~500–600 KB |
| License | EPL-2.0 ⚠️ (copyleft — check if this matters) |
| Weekly downloads | 1.5M |

**Port support:** Excellent. First-class `portConstraints` option with `FIXED_ORDER`, `FREE`, `FIXED_SIDE`, `FIXED_POS`. Ports can be explicitly placed on NORTH/SOUTH/EAST/WEST sides with defined ordering.

**Orthogonal routing:** Yes — configurable via `org.eclipse.elk.edgeRouting: 'ORTHOGONAL'`. The layered algorithm produces clean Manhattan-style routes.

**Can you use only the layered algorithm?** No. The `algorithms` constructor array controls which algorithms are *registered*, but the worker (`elk-worker.js/min.js`) is a single GWT-compiled Java-to-JS blob containing all algorithm code. [Issue #6 (2017): "Poor modularization"](https://github.com/OpenKieler/elkjs/issues/6) remains open. There is no way to strip to just the layered algorithm.

**Web Worker:** ELK is designed to run in a Web Worker to avoid UI blocking. The `elk-api.js` (9 KB) + `elk-worker.min.js` (1.59 MB, loaded lazily) pattern is the idiomatic browser usage — the worker load can be deferred until first layout call.

**Real-world use:** Used by ReactFlow, reaflow, sprotty, Vega editor. The reaflow team [filed a "Huge bundle size" issue (#224)](https://github.com/reaviz/reaflow/issues/224) noting ELK dominates their bundle. No resolution possible due to the monolith nature.

```js
const elk = new ELK();
elk.layout({
  id: "root",
  layoutOptions: { 'elk.algorithm': 'layered', 'elk.edgeRouting': 'ORTHOGONAL' },
  children: [
    { id: "n1", width: 100, height: 60,
      ports: [{ id: "n1_out", properties: { side: "EAST" } }] }
  ],
  edges: [
    { id: "e1", sources: ["n1_out"], targets: ["n2_in"] }
  ]
})
```

---

### 2. dagre (`@dagrejs/dagre`)

| Attribute | Value |
|---|---|
| npm package | `@dagrejs/dagre` |
| Latest version | 3.0.0 (published **March 22, 2026** — recently revived) |
| npm unpacked size | **1.1 MB** |
| Minified bundle | ~90–110 KB |
| Gzipped | ~28–35 KB |
| License | MIT ✅ |
| Weekly downloads | 1.8M |

**Port support:** **None.** [Issue #106 (2013)](https://github.com/dagrejs/dagre/issues/106) explicitly raised port constraints — acknowledged as a missing feature and never implemented. Dagre operates at the node level only; edges connect nodes, not specific attachment points on node borders.

**Orthogonal routing:** **No.** Dagre produces polyline (straight multi-segment) paths only. The "curves" in tools using dagre (Mermaid, etc.) are added by the renderer as bezier approximations, not true right-angle routing.

**Use for EDA:** Can fake port behavior by: (1) computing port positions manually after layout, and (2) rerouting edges with a post-processing pass. This is hacky and breaks for complex overlapping cases.

**Note on naming:** The original `dagre` package (Chris Pettitt) was abandoned. `@dagrejs/dagre` is the community continuation. Do NOT use the bare `dagre` package — it's years stale.

---

### 3. d3-dag

| Attribute | Value |
|---|---|
| npm package | `d3-dag` |
| Latest version | 1.1.0 (published **September 2023** — in light maintenance) |
| npm unpacked size | ~507 KB |
| `d3-dag.iife.min.js` (browser) | **112 KB** |
| Gzipped estimate | ~35–45 KB |
| License | MIT ✅ |

**Port support:** **None.** The library has no concept of ports or attachment points. Layout is purely node-to-node.

**Orthogonal routing:** **No.** Layout produces `(x, y)` coordinates per node and `points[]` arrays per edge (bezier control points).

**Algorithms available:**
- `sugiyama()` — Layered Sugiyama layout. Internally uses an LP solver (`javascript-lp-solver`) for crossing minimization, which contributes significantly to the 112 KB size.
- `zherebko()` — Linear topological layout (compact, good for chains)
- `grid()` — Grid-based topological layout

**Status warning:** The author [explicitly states](https://github.com/erikbrinkman/d3-dag) this is in "light maintenance mode" — no new features, simple bug fixes only. Recommends alternatives for production use.

**Use for EDA:** Not suitable without significant custom post-processing to add port-level routing.

---

### 4. HDElk (`davidthings/hdelk`)

| Attribute | Value |
|---|---|
| npm package | ❌ None — static files only |
| GitHub | [davidthings/hdelk](https://github.com/davidthings/hdelk) (83 ⭐) |
| Files required | `elk.bundled.js` + `svg.min.js` + `hdelk.js` |
| Effective bundle weight | **~1.6 MB** (dominated by elk.bundled.js) |
| License | Apache-2.0 ✅ |
| Last active | ~2021 (stale) |

**What it is:** A thin JavaScript wrapper that (1) converts a simpler HDL-oriented JSON spec into ELK JSON via `hdelk.transform()`, then (2) calls ELK for layout, then (3) renders the result to inline SVG via SVG.js in `hdelk.diagram()`.

**Port support:** Yes — via `inPorts`, `outPorts`, `northPorts`, `southPorts`, `eastPorts`, `westPorts` arrays. Very ergonomic API for HDL block diagrams:

```js
var graph = {
  children: [
    { id: "adder", inPorts: ["A", "B", "Cin"], outPorts: ["Sum", "Cout"] },
    { id: "reg",   inPorts: ["D", "clk"],      outPorts: ["Q"] }
  ],
  edges: [
    ["adder.Sum", "reg.D"],
    ["adder.Cout", "reg.clk"]
  ]
}
hdelk.layout(graph, "diagram_div_id");
```

**Orthogonal routing:** Yes (ELK does it). Also supports bus edges (thick lines), highlights, edge labels, reverse edges, hierarchical nesting, "constant" nodes, and "parameter" ports (top-side).

**Verdict for EDA:** The nicest API for HDL block diagrams in the group, but inherits all of ELK's bundle weight and EPL-2.0 concern. Not packaged for npm — you'd vendor the files. Production use requires ELK's license review.

---

### 5. d3-hwschematic

| Attribute | Value |
|---|---|
| npm package | `d3-hwschematic` |
| Latest version | 0.1.6 (published **2018** ⚠️ extremely stale) |
| Dependencies | D3.js + ELK |
| License | EPL-2.0 ⚠️ |
| Stars | 118 |
| Approximate total gzipped | ~700–900 KB (D3 ~200 KB + ELK ~500-600 KB + lib ~50 KB) |

**What it is:** A D3.js-based interactive viewer for hardware netlists. Takes ELK JSON with `hwMeta` property extensions. Built specifically for RTL/FPGA circuit analysis (used in [sphinx-hwt](https://github.com/Nic30/sphinx-hwt) and [jupyter_widget_hwt](https://github.com/Nic30/jupyter_widget_hwt)).

**Port support:** Yes — uses full ELK `LPort` model with `side: "WEST"/"EAST"` and `portConstraints: "FIXED_ORDER"`. Supports hyper-edges (one source → multiple targets), collapsible hierarchical components.

**Orthogonal routing:** Yes (ELK).

**Extra features over HDElk:**
- Collapsible/expandable hierarchical components (click to expand)
- Multiple node renderers: generic, mux, operator, slice (for RTL-specific shapes)
- [Yosys](https://yosyshq.net/yosys/) synthesis output compatible — can visualize actual synthesized netlists
- Tooltip on hover, net highlighting on click, zoom/pan
- CSS class/style per-element via `hwMeta.cssClass` / `hwMeta.cssStyle`

**Verdict for EDA:** The most feature-complete solution, but: (1) 2018 vintage / no npm updates, (2) requires D3 as heavy peer dependency, (3) EPL-2.0 license, (4) still inherits ELK's bundle. Best choice if you need Yosys/RTL netlist visualization.

---

### 6. Custom Sugiyama Layout

**Is <500 lines feasible for port-aware orthogonal routing?**  
**No.** A breakdown:

| Step | Complexity | LOC estimate |
|---|---|---|
| Cycle removal (greedy edge reversal) | Easy | ~50 |
| Longest-path layering (or Coffman-Graham) | Easy | ~60 |
| Dummy node insertion for multi-layer edges | Medium | ~80 |
| Barycenter crossing minimization (2 passes) | Medium | ~120 |
| Brandes-Köpf x-coordinate assignment | Hard | ~200 |
| Node placement (applying port offsets) | Medium | ~80 |
| Orthogonal edge routing (axis-aligned segments) | Hard | ~300 |
| Port stub generation (in/out port positions on node border) | Medium | ~100 |
| Dummy node removal + waypoint extraction | Medium | ~60 |
| **Total** | | **~1,050** |

**"Basic layered + straight edges only"** (skip orthogonal routing): ~300–400 lines. Usable if you're okay with diagonal wires — not EDA-appropriate.

**"Basic + rectilinear (L-shaped) routing"**: ~500–600 lines. Handles most cases but fails on crowded graphs (crossings, overlapping wire segments). No obstacle avoidance.

**True production quality** (what ELK does): tens of thousands of lines of Java, compiled to a 4.78 MB unminified JS worker. The complexity of preventing wire-on-node crossings, handling feedback edges, compacting layouts, and routing in tight spaces is enormous.

**References for a roll-your-own attempt:**
- [Disy Tech-Blog: The Sugiyama Method](https://blog.disy.net/sugiyama-method/) — TypeScript implementation walkthrough
- [Medium: Routing Orthogonal Diagram Connectors in JavaScript](https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70)
- Brandes & Köpf 2001 paper for x-coordinate assignment

---

## Comparison Table

| Library | npm package | Unpacked | Minified (est.) | Gzipped (est.) | Port support | Orthogonal routing | Maintained | License |
|---|---|---|---|---|---|---|---|---|
| **ELK.js** | `elkjs` | 8.11 MB | 1.61 MB | ~550 KB | ✅ Excellent | ✅ Yes | ✅ Active | EPL-2.0 ⚠️ |
| **dagre** | `@dagrejs/dagre` | 1.1 MB | ~100 KB | ~32 KB | ❌ None | ❌ None | ✅ Active | MIT ✅ |
| **d3-dag** | `d3-dag` | 507 KB | 112 KB | ~38 KB | ❌ None | ❌ None | ⚠️ Light | MIT ✅ |
| **HDElk** | (none) | — | ~1.61 MB | ~550 KB | ✅ Yes | ✅ Yes | ⚠️ Stale | Apache-2.0 ✅ |
| **d3-hwschematic** | `d3-hwschematic` | — | ~1.8 MB | ~750 KB | ✅ Yes | ✅ Yes | ❌ 2018 | EPL-2.0 ⚠️ |
| **Custom Sugiyama** | — | — | ~15–30 KB | ~5–10 KB | ✅ If built | ✅ If built | DIY | Your own |

---

## Recommendation by Use Case

### "I need it working today, quality matters"
→ **ELK.js directly.** Accept the 550 KB gzipped payload. Load the worker lazily (`workerUrl` option). The layout quality for port-constrained hardware diagrams is unmatched in JS. If EPL-2.0 is a concern for your project, get a legal review — it's not GPL but has conditions for linked software.

### "I want an EDA-specific API with less boilerplate"
→ **HDElk** for documentation/tooling (Apache-2.0, nicer API). **d3-hwschematic** if you need Yosys-compatible RTL netlist visualization (but it's 2018 code). Both are ELK wrappers — same payload.

### "Bundle size is critical, ports are optional"
→ **dagre** (`@dagrejs/dagre`) at ~32 KB gzipped. Fake ports by manually computing wire attachment points post-layout. Use cubic bezier curves instead of orthogonal routing. Viable for simple flow diagrams but will look less like EDA.

### "I want to build something custom and small"
→ Custom layered layout, but budget **800–1,200 LOC** for anything EDA-quality. Consider starting from d3-dag's Sugiyama implementation (MIT, 112 KB) and adding port-offset logic on top rather than writing from scratch — but note it's in maintenance mode.

### "There's a budget for a real EDA tool"
→ Consider **yFiles for HTML** (commercial, proper EDA support) or **Cytoscape.js** with the [cytoscape-elk](https://github.com/cytoscape/cytoscape.js-elk) adapter.

---

## Bonus: `netlistsvg` (Not in Original List, Worth Knowing)

| Attribute | Value |
|---|---|
| npm | `netlistsvg` / `@silimate/netlistsvg` |
| GitHub | [nturley/netlistsvg](https://github.com/nturley/netlistsvg) (778 ⭐) |
| License | MIT ✅ |
| What it does | Renders gate-level netlists (Yosys JSON) to SVG using ELK |

Specifically designed for **gate-level/cell-level** digital schematics (individual logic gates, flip-flops). Uses ELK under the hood. Good complement to d3-hwschematic for lower-level netlists.

---

## Sources

**Kept:**
- [elkjs npm (npmjs.com)](https://www.npmjs.com/package/elkjs) — version, download stats
- [elkjs README (github.com/kieler/elkjs)](https://github.com/kieler/elkjs) — file structure, API, modularization issue
- [unpkg.com/elkjs@0.11.1/lib/](https://app.unpkg.com/elkjs@0.11.1/files/lib/) — **exact file sizes** (elk-worker.min.js = 1.59 MB, elk.bundled.js = 1.61 MB, elk-api.js = 9.16 KB)
- [@dagrejs/dagre npm](https://www.npmjs.com/package/@dagrejs/dagre) — 1.1 MB unpacked, March 2026 v3.0.0
- [d3-dag npm registry](https://registry.npmjs.org/d3-dag/latest) — unpacked 507 KB
- [d3-dag bundle files (unpkg)](https://app.unpkg.com/d3-dag@1.1.0/files/bundle) — **exact: 112 KB iife.min.js**
- [davidthings/hdelk GitHub](https://github.com/davidthings/hdelk) + [HDElk tutorial](https://davidthings.github.io/hdelk/tutorial) — API, file requirements, port spec
- [Nic30/d3-hwschematic GitHub](https://github.com/Nic30/d3-hwschematic) — README, ELK JSON format, features
- [reaflow bundle issue #224](https://github.com/reaviz/reaflow/issues/224) — real-world ELK bundle complaint
- [dagre port constraints issue #106](https://github.com/dagrejs/dagre/issues/106) — confirms no port support
- [Disy: The Sugiyama Method](https://blog.disy.net/sugiyama-method/) — custom implementation reference

**Dropped:**
- Bundlephobia pages — returned 502 errors; UNPKG gave direct file size data instead
- Old bare `dagre` package (pre-dagrejs fork) — outdated
- Generic "reduce bundle size" blog posts — irrelevant

## Gaps

- **Exact gzip size for elkjs** could not be measured directly (bundlephobia was down); ~550 KB is an estimate. Measure with: `gzip -c elk.bundled.js | wc -c`
- **@dagrejs/dagre v3.0.0** is a recent March 2026 release — its specific changes vs 0.8.x are unknown (changelog not checked)
- **HDElk's `hdelk.js` exact size** not measured; likely 30–60 KB unminified based on source inspection
- **ELK.js EPL-2.0 implications** for embedded commercial use need legal analysis specific to your project
- **`netlistsvg` bundle size** not checked — would need separate research if that path is pursued
