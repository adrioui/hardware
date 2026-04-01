# Research: Lightweight JS Graph Layout for EDA-Style Block Diagrams

## Summary

For hierarchical block diagrams with port connections, **ELK.js is architecturally the right choice** but its ~1.6MB worker must be lazy-loaded as a separate asset (bringing main-bundle cost to ~9KB). **dagre (`@dagrejs/dagre`)** is a viable ~80KB alternative with active development but lacks port constraints and orthogonal routing. **d3-dag** is well-implemented but in "light maintenance mode" and its LP/QP solver dependencies inflate it to ~144KB. A **custom Sugiyama** in ~500–700 LOC is realistic for the layout core, but adding port-aware orthogonal routing doubles the effort.

---

## Findings

### 1. ELK.js — Bundle Size, Tree-Shaking, and Algorithm Access

**Bundle sizes (v0.9.1, from unpkg):**
| File | Size |
|---|---|
| `elk-api.js` (thin JS API) | **8.59 KB** |
| `elk-worker.js` (GWT blob, unminified) | **4.77 MB** |
| `elk-worker.min.js` (minified) | **1.59 MB** |
| `elk.bundled.js` (api + worker, naive import) | **1.61 MB** |

**Tree-shaking: impossible.** ELK.js is Java compiled to JavaScript via [GWT](https://github.com/kieler/elkjs/blob/master/build.gradle), producing a monolithic blob. There is no modular JS source. Issue [#6 "Modularize library"](https://github.com/kieler/elkjs/issues/6) has been open since 2017 with no resolution. Tree-shaking, dead-code elimination, or importing only the layered algorithm are all off the table.

**You cannot select algorithms at build time.** All algorithms (layered, force, box, disco, rectpacking, stress, radial) ship in the same blob. You pick them at runtime via `layoutOptions: { 'elk.algorithm': 'layered' }`.

**The mitigation: split loading.** The intended production pattern is:
```typescript
// Only ~9KB in main bundle
import ELK from 'elkjs/lib/elk-api'

// Worker loaded as separate async asset, runs off main thread
const elk = new ELK({ workerUrl: './elk-worker.min.js' })
```
This means the "main bundle cost" is ~9KB. The 1.59MB worker becomes a separately cached asset, loaded on first diagram render. Open issue [#141](https://github.com/kieler/elkjs/issues/141) and [#142](https://github.com/kieler/elkjs/issues/142) report bundler friction (webpack/Vite `new Worker()` URL resolution fails); `reaflow` hit this and filed a ["Huge bundle size" issue #224](https://github.com/reaviz/reaflow/issues/224).

**License: EPL-2.0** — Eclipse Public License. Not MIT. This is a weak copyleft license; modified versions you distribute must be shared. Many companies treat this as a blocker for embedded/commercial use. [HN discussion confirms this concern.](https://news.ycombinator.com/item?id=45742907)

**Layout quality for EDA:** Exceptional. ELK was literally designed for data-flow diagrams and ports (package.json keywords: `"ports", "dataflow"`). It supports:
- Named port constraints with fixed positions
- Orthogonal edge routing with bend-minimization
- Hierarchical nodes (compound graphs)
- Layer assignment with network simplex
- 200+ layout options

**Performance:** Chinese benchmark (1000 nodes): ELK 1–3 sec vs dagre 2–10 sec. [Source](https://juejin.cn/post/7578699975414120448)

---

### 2. dagre / @dagrejs/dagre — Maintenance, Size, Quality

**Maintenance history:**
- Original `dagre` by Chris Pettitt → deprecated ~2018
- `dagrejs` community org took over as `@dagrejs/dagre`
- [Issue #352 "What's the plan going forward?"](https://github.com/dagrejs/dagre/issues/352) (2023) confirmed the deprecated notice was removed; active TypeScript rewrite in progress
- **v3.0.0 published March 22, 2026** — actively maintained
- 1.8M weekly downloads, 5.5k stars, MIT license

**Bundle sizes:**
- Old `dagre@0.8.5` (UMD): `dagre.min.js` = **567 kB** (includes graphlib bundled in)
- New `@dagrejs/dagre` ESM: source-map is 145KB → actual `dagre.esm.js` is approximately **80–110 kB minified**
- `@dagrejs/graphlib` standalone: `graphlib.core.min.js` = **29.4 kB**

**Tree-shaking:** The new TypeScript rewrite ships both `dagre.cjs.js` and `dagre.esm.js` (see `package.json` exports field). ESM tree-shaking is *possible* but limited — the entire layout pipeline is one big function call chain, so in practice you get the full 80–110KB.

**Layout quality:** Good for simple trees and DAGs. Known limitations:
- No port constraints (edges route to/from node centers)
- No true orthogonal routing (uses splines/polylines, not rectilinear)
- Long-standing algorithm bugs; [d2 (terrastruct) had to shim it significantly](https://github.com/terrastruct/d2/blob/master/d2layouts/d2dagrelayout/layout.go)
- Edge crossings are not minimized as well as ELK for dense graphs
- No compound/hierarchical nodes

**Verdict:** Good for flowcharts and simple DAG visualization. **Not suitable for EDA block diagrams with port connections** without significant custom post-processing.

---

### 3. d3-dag — Size, Layout Quality, Maintenance

**Current state:** v1.1.0, last published ~Sept 2023. Author explicitly states ["light maintenance mode"](https://github.com/erikbrinkman/d3-dag?tab=readme-ov-file#status) — simple PRs accepted, no new feature development.

**Bundle sizes (v1.1.0, from unpkg):**
| File | Size |
|---|---|
| `dist/d3-dag.esm.min.js` (main module, minified) | **144 kB** |
| `dist/` (unminified) | **336 kB** |

**Why 144KB?** The `package.json` dependencies include:
- `javascript-lp-solver` — for optimal layering via network simplex LP
- `quadprog` — for quadratic programming coordinate assignment
- `d3-array`

These solvers are what enable better layout quality than dagre, but they inflate the bundle. The LP solver alone is substantial.

**Tree-shaking:** Pure ESM (`"type": "module"`), so tree-shaking works. If you use only `sugiyama()` with simple options (not the LP/QP-based coord operators), bundlers can potentially drop the solver code. In practice, the ESM min bundle at 144KB is already a pre-built minified artifact.

**Layout quality:** Significantly better than dagre for complex DAGs. Full Sugiyama pipeline with interchangeable components:
- Layering: longest-path, topological, or network-simplex (LP)
- Crossing minimization: DFS, two-layer median, or ILP optimal
- Coordinate assignment: center, greedy, quad (QP), or simplex

**For EDA use:** No port constraints. No orthogonal routing. Better crossing minimization than dagre but no circuit-diagram features.

**The Zherebko and Grid layouts** are interesting alternatives for linear topological arrangements.

---

### 4. Custom Sugiyama — Feasibility in ~300 LOC

**Verdict: 300 LOC is too few. 500–700 LOC is realistic for the layout core. 1200–1500 LOC if you add port-aware orthogonal routing.**

The four steps of Sugiyama (with approximate implementation cost):

**Step 1 — Cycle Removal (~50 LOC):**
DFS-based greedy feedback arc removal. Reverse any back-edge found during DFS. Simple to implement.
```typescript
// ~50 lines — DFS, track stack, reverse back-edges
```

**Step 2 — Layer Assignment (~80 LOC):**
Topological sort → assign each node to a layer. Longest-path heuristic is 30 lines. Network simplex (optimal) is 300+ lines. The Disy blog post's topological approach works for most cases.

**Step 3 — Crossing Minimization (~150 LOC):**
- Insert dummy nodes for multi-layer-spanning edges (~60 LOC)
- Median heuristic: order each layer by median neighbor position, run 24 sweeps (~60 LOC)
- Transpose: swap adjacent pairs if it reduces crossings (~30 LOC)

**Step 4 — Coordinate Assignment (~100–200 LOC):**
Simple: equal spacing within each layer. Good-looking: Brandes & Köpf (block alignment) is ~300 LOC. The Disy post's simple equal-spacing is 20 lines.

**Total for decent hierarchical layout: ~450–600 LOC** (TypeScript). The [Disy blog post](https://blog.disy.net/sugiyama-method/) shows a complete implementation and notes it "works quite well for simple graphs."

**Adding port-aware orthogonal routing (EDA requirement):**
1. Port side assignment: which side (N/S/E/W) each edge exits a node
2. Rectilinear routing: route each edge as a Manhattan path (Dijkstra on grid)
3. Segment bundling: merge parallel segments
This adds ~400–600 LOC using the [grid recipe approach](https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70): build a routing grid between node bounding boxes, Dijkstra with direction-change penalty.

**Critical limitation:** Without crossing minimization quality on par with ELK/d3-dag, custom implementations produce ugly output for graphs with >20 nodes. The 24-iteration median+transpose heuristic is rarely sufficient; ELK runs network simplex + multiple refinement passes.

---

### 5. CSS Grid/Flexbox for Hierarchies

**Works only for strict trees (no cross-edges).**

For a simple pipeline `A → B → C → D`, CSS Flexbox with `flex-direction: row` and SVG overlay for edges is zero-bundle and surprisingly clean. For the [dc.graph.js flexbox_layout](https://dc-js.github.io/dc.graph.js/docs/html/dc_graph.flexbox_layout.html) approach, the browser handles node placement; you draw edges in SVG absolute-positioned overlay.

**Limitations for EDA:**
- Cross-edges (fan-out, reconvergence) require absolute positioning — Flexbox can't route these
- Port positioning requires knowing final node geometry, which CSS doesn't expose to JS during layout
- Multiple outputs per node break any row/column model
- Feedback/cycles require manual cycle-breaking before CSS can handle it

**Verdict:** Viable as a zero-cost option for strictly linear pipelines (adder → register → mux). Completely unworkable for general netlist topology.

---

### 6. graphlib — Minimal Graph Data Structure

`@dagrejs/graphlib` v4.0.1:
- **29.4 kB minified** (core only), 449.9 kB unpacked (includes .d.ts, .map files)
- Directed/undirected multigraph data structure
- 1.9M weekly downloads, MIT license, active (published March 2026)
- Provides: add/remove nodes/edges, adjacency queries, topological sort, DFS/BFS, Dijkstra, Tarjan SCC

Useful as a graph data structure when implementing custom layout — provides the graph traversal primitives so you don't reimplement them.

`antvis/graphlib` is an alternative (TypeScript, 27 stars) with more algorithm coverage.

---

### 7. What's the Minimum for EDA-Style Block Diagrams?

An EDA block diagram with orthogonal edge routing needs:

**Mandatory:**
1. **Layered placement** — nodes grouped into columns (rank/layer assignment)
2. **Port positions** — edges exit/enter at specific named ports on node borders
3. **Orthogonal routing** — edges route as rectilinear (Manhattan) paths, not diagonal
4. **No edge-node overlaps** — edges route around node bounding boxes

**Important but reducible:**
5. **Crossing minimization** — fewer crossings = more readable; approximate is fine
6. **Compact layout** — minimize total diagram area

**ELK provides all 6 natively.** Dagre provides only #1 (approximately), lacks #2–#4. D3-dag provides #1 + #5, lacks #2–#4.

**The irreducible complexity:** Orthogonal routing with port awareness is a standalone problem even after you have a node layout. You need to route edges avoiding other nodes, route from specific port positions (e.g., right-side output port, left-side input port), and avoid crossing other edges where possible. This is approximately the same difficulty as the layout itself.

---

### 8. Comparison Matrix

| | **ELK.js** | **@dagrejs/dagre** | **d3-dag** | **Custom (500 LOC)** |
|---|---|---|---|---|
| **Main-bundle cost** | ~9 KB (api only) | ~80–110 KB | ~144 KB | ~5–15 KB |
| **Async load cost** | ~1.59 MB (worker) | — | — | — |
| **Tree-shakeable** | No (GWT) | Limited (ESM) | Limited (ESM) | N/A |
| **License** | EPL-2.0 ⚠️ | MIT ✅ | MIT ✅ | N/A |
| **Maintenance** | Active | Active | Light mode | N/A |
| **Hierarchical quality** | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ |
| **Port constraints** | ✅ Native | ❌ None | ❌ None | ⚠️ Custom |
| **Orthogonal routing** | ✅ Native | ❌ None | ❌ None | ⚠️ Custom |
| **Compound nodes** | ✅ | ❌ | ❌ | ⚠️ Custom |
| **EDA suitability** | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ | ★★★☆☆ |
| **Implementation effort** | Low | Low | Low | High |
| **Performance (1K nodes)** | 1–3 sec | 2–10 sec | N/A | Varies |

---

## Recommendation

**For EDA block diagrams: ELK.js is the right tool, mitigated by lazy loading.**

1. Import `elkjs/lib/elk-api` (~9KB) in your main bundle
2. Serve `elk-worker.min.js` (~1.59MB) as a separately cached static asset
3. Instantiate with `new ELK({ workerUrl: '/static/elk-worker.min.js' })`
4. The worker runs off the main thread; layout is async
5. On re-render, the worker file is browser-cached

**The EPL-2.0 license may be a blocker.** If it is, the realistic alternatives are:
- **`@dagrejs/dagre` + custom orthogonal router**: ~80KB + ~5KB for a grid-Dijkstra router. Acceptable layout quality for circuits without port constraints; edges will connect to node centers, not named ports.
- **Custom Sugiyama + custom orthogonal router**: ~700 LOC total. Gives you full control, MIT-licensable, but requires ~2–3 engineer-weeks and won't match ELK's layout quality on complex graphs.

**If ports are not required (simple block diagrams, no named connections):**
`@dagrejs/dagre` is the pragmatic choice. It's actively maintained, MIT, ~80KB, and produces good-enough layouts for diagrams up to ~100 nodes.

---

## Sources

**Kept:**
- [kieler/elkjs README](https://github.com/kieler/elkjs) — definitive architecture docs
- [UNPKG elkjs@0.9.1/lib/](https://app.unpkg.com/elkjs@0.9.1/files/lib) — exact file sizes
- [UNPKG dagre@0.8.2/dist/](https://app.unpkg.com/dagre@0.8.2/files/dist) — legacy sizes
- [UNPKG d3-dag@1.1.0/](https://app.unpkg.com/d3-dag@1.1.0) — dist sizes
- [d3-dag README](https://github.com/erikbrinkman/d3-dag) — maintenance status, "light maintenance mode" admission
- [dagre issue #352](https://github.com/dagrejs/dagre/issues/352) — maintenance plan confirmation
- [reaflow issue #224](https://github.com/reaviz/reaflow/issues/224) — ELK bundle size real-world impact
- [elkjs issue #141](https://github.com/kieler/elkjs/issues/141) — web worker bundling problem
- [Disy blog: Sugiyama Method](https://blog.disy.net/sugiyama-method/) — TypeScript implementation walkthrough
- [Medium: Orthogonal connectors in JS](https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70) — grid-Dijkstra routing approach
- [macwright.com graph layout 2026](https://macwright.com/2026/01/11/graph-layout) — state of the art survey
- [HN: Who needs Graphviz](https://news.ycombinator.com/item?id=45742907) — EPL license concerns, ELK comparison
- [Chinese ELK.js perf benchmark](https://juejin.cn/post/7578699975414120448) — dagre vs ELK performance comparison

**Dropped:**
- CSS Grid/Flexbox comparison articles — not relevant to graph layout
- Bundle optimization generic guides — not library-specific
- `d3-hierarchy` docs — only handles trees, not DAGs

---

## Gaps

1. **ELK.js EPL-2.0 scope**: Unclear whether using ELK.js as a layout library (without modifying it) triggers copyleft obligations. Legal review recommended.
2. **`@dagrejs/dagre` v3 actual ESM bundle size**: Not confirmed from Bundlephobia (service blocked); estimated from source-map size at ~80–110KB but needs verification via `npm pack` + `esbuild --bundle`.
3. **Custom port-aware layout libraries**: no well-maintained, MIT-licensed, port-aware JS layout library was found that isn't ELK. The gap is real.
4. **WASM-based alternatives**: `graphviz-wasm` exists (~1MB) but shares ELK's size problem; no port-constraints.
5. **antvis/layout**: AntV maintains a layout library with Dagre + ELK + custom algorithms. Not investigated for bundle size or port support.
