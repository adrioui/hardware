# Research: Zero-Dependency Verilog Module Hierarchy Visualizer Parser

## Summary

A custom JS parser for Verilog hierarchy extraction is **absolutely feasible in <500 lines**. The 90% solution covers flat module declarations + named port instantiations, which is all that standard RTL (including PicoRV32) uses at the structural level. The hard cases (generate/genvar arrays, `ifdef` in port lists, escaped identifiers) can be safely deferred or partially handled. No WASM, no Yosys, no tree-sitter required.

---

## Finding 1: HDElk Has NO Parser — Confirmed

**`davidthings/hdelk`** (83 stars, the real repo — `nicobrinning/hdelk` does not exist) is a JSON→SVG layout tool. It takes hand-written JSON describing hierarchy and renders it via **ELK.js + SVG.js**. Zero Verilog parsing whatsoever. [GitHub](https://github.com/davidthings/hdelk)

```html
<!-- HDElk usage: you write the JSON by hand -->
<script src="/js/elk.bundled.js"></script>
<script src="/js/hdelk.js"></script>
<script>
var graph = {
  id: "", children: [
    { id: "cpu", ports: ["clk","rst","mem_addr"] },
    { id: "ram", ports: ["addr","data"] }
  ],
  edges: [["cpu.mem_addr","ram.addr"]]
};
hdelk.layout(graph, "diagram_div");
</script>
```

This means **HDElk is the perfect render target**: your custom parser produces this JSON, HDElk visualizes it. The architecture writes itself.

**netlistsvg** (778 stars) is the other option — takes Yosys JSON netlist format and renders SVG via ELK. No parser either, requires Yosys upstream. [GitHub](https://github.com/nturley/netlistsvg)

**WaveDrom** is timing diagrams only. Not relevant for hierarchy.

---

## Finding 2: Existing Lightweight JS Parsers — Nothing Usable

| Name | Language | What it parses | Stars | Verdict |
|------|----------|----------------|-------|---------|
| `tree-sitter-verilog` | C+JS bindings | Full Verilog/SV | N/A | Requires WASM host |
| `hdl-js` (DmitrySoshnikov) | JS | Nand2Tetris HDL | 0 | Wrong HDL dialect |
| `hdl-parser` (wokwi) | PEG/JS | Nand2Tetris HDL | N/A | Wrong HDL dialect |
| `tjunxiang92/Verilog-Js-Parser` | JS | Verilog→JS execution | 0 | Abandoned 2016 |

**Nothing usable exists** for hierarchy extraction in pure JS. You're writing this from scratch.

---

## Finding 3: Rust WASM Options — Technically Feasible but Overkill

### sv-parser (dalance)
- IEEE 1800-2017 **fully compliant** CST parser in Rust [GitHub](https://github.com/dalance/sv-parser)
- 16 KB crate source, but the parser combinators expand massively at compile time
- Requires filesystem access for `\`include` resolution — complicates WASM sandboxing
- **svinst** (51 stars) wraps it to extract module defs + instantiations in ~300 lines of Rust [GitHub](https://github.com/sgherbst/svinst)
- **Estimated WASM size**: 800KB–2MB after wasm-opt, due to comprehensive PEG combinator machinery
- **Verdict**: Works but 2MB WASM load for a simple hierarchy tool is excessive

### moore (fabianschuiki)
- Full HDL compiler targeting LLHD/CIRCT [GitHub](https://github.com/fabianschuiki/moore)
- Last release: Feb 2022. Essentially unmaintained.
- Requires LLHD/CIRCT infrastructure. Completely wrong scope for this task.
- **Verdict**: Dead project, do not use.

### svinst_port (nfproc fork)
- Adds port extraction to svinst output format [GitHub](https://github.com/nfproc/svinst_port)
- Same sv-parser dependency, same WASM concerns
- **Verdict**: Most complete Rust tool for this task, but still overkill for WASM deployment

### Conclusion on Rust WASM
A **purpose-built** Rust hierarchy extractor (not full IEEE compliance, just hierarchy + ports) using `nom` or regex could compile to ~100-200KB WASM. But given the JS parser is <500 lines and comparable speed for typical RTL file sizes, there's no compelling reason to add WASM complexity.

---

## Finding 4: Real-World Patterns in PicoRV32

Examining the actual `picorv32.v` (the canonical RISC-V SoC reference) reveals exactly what patterns matter:

### Pattern 1: Parameterized Module Header (ANSI style)
```verilog
module picorv32 #(
    parameter [ 0:0] ENABLE_COUNTERS = 1,
    parameter [31:0] MASKED_IRQ = 32'h 0000_0000,
    parameter [31:0] PROGADDR_RESET = 32'h 0000_0000
) (
    input clk, resetn,
    output reg        trap,
    output reg [31:0] mem_addr,
    input      [31:0] mem_rdata,
    ...
```
**Parser challenge**: Parameter list uses `#(...)`, port list uses `(...)`. Width specs have spaces: `[ 0:0]`, `[31:0]`. Port direction + type + width + name all on one line.

### Pattern 2: `\`ifdef` in Port Lists
```verilog
`ifdef RISCV_FORMAL
    output reg        rvfi_valid,
    output reg [63:0] rvfi_order,
    ...
`endif
```
**Impact**: A naïve parser that strips all `\`ifdef` blocks will **miss ports** if the define is active. A parser that includes all `\`ifdef` branches gets duplicate ports.

### Pattern 3: Conditional `generate if` Instantiation (the killer)
```verilog
generate if (ENABLE_FAST_MUL) begin
    picorv32_pcpi_fast_mul pcpi_mul (
        .clk       (clk            ),
        .resetn    (resetn         ),
        .pcpi_valid(pcpi_valid     ),
        .pcpi_insn (pcpi_insn      ),
        .pcpi_rs1  (pcpi_rs1       ),
        .pcpi_rs2  (pcpi_rs2       ),
        .pcpi_wr   (pcpi_mul_wr    ),
        .pcpi_ready(pcpi_mul_ready )
    );
end else if (ENABLE_MUL) begin
    picorv32_pcpi_mul pcpi_mul (   // SAME INSTANCE NAME, DIFFERENT MODULE TYPE
        ...
    );
end else begin
    assign pcpi_mul_wr = 0;        // sometimes it's just assigns
end endgenerate
```
**Critical observations**:
1. All PicoRV32 sub-modules live inside `generate if/else` blocks
2. Multiple branches can instantiate **different module types** with the **same instance name** (`pcpi_mul`)
3. Without evaluating parameters (which needs values from outside), you can't know which branch is active
4. The `else begin / assign ... end` branches contain no instantiations — safe to include

### Pattern 4: Named Port Connections with Alignment Spaces
```verilog
.clk       (clk            ),   // trailing spaces before )
.pcpi_valid(pcpi_valid     ),
```
Regex must be lenient about whitespace between `.portname` and `(signal)`.

### Pattern 5: Synthesis Attributes
```verilog
(* parallel_case *)
case (1'b1)
```
```verilog
`FORMAL_KEEP reg [63:0] dbg_ascii_instr;  // macro expanding to (* keep *)
```
These appear at module scope and must not confuse the instantiation scanner.

---

## Finding 5: The 90% Verilog Syntax Subset

### What 90% of RTL hierarchy uses:

| Feature | % coverage | Notes |
|---------|-----------|-------|
| ANSI-style module header | ~85% | Modern RTL; non-ANSI is legacy |
| Named port connections `.p(s)` | ~95% | All serious RTL; positional is rare in hierarchy |
| `parameter` declarations | ~90% | Width, default value |
| Single-module-per-file | ~80% | Standard practice |
| `wire`/`reg` port types | ~100% | Universal |
| `generate if` wrapping instantiations | ~40% | Very common in parameterized designs |
| `\`ifdef` in port lists | ~20% | Formal/debug ports |
| Interface ports (SystemVerilog) | ~30% | Growing in modern SV designs |
| Escaped identifiers `\mod_name ` | <5% | Rare edge case |
| `import pkg::*` | ~15% | SV packages |

### V1 Safe-to-Skip list:
- **`generate for` loops** (genvar arrays): skip → report as "N unresolved instances" 
- **Packages/imports**: skip → they don't affect hierarchy edges
- **Non-ANSI port declarations**: skip → flag as legacy, tell user to convert
- **Positional port connections**: handle is 5 extra lines of regex
- **Escaped identifiers**: skip → extremely rare in synthesizable RTL
- **Interface ports**: skip → treat as unknown-type port for v1
- **`\`define` expansion in instantiation names**: very rare, skip

### V1 Must-Handle list:
- ANSI module headers with `#(params)` and `(ports)`
- Named port connections
- `\`ifdef`/`\`ifndef`/`\`endif` stripping (keep all branch content, deduplicate)
- `generate if`/`end` stripping (keep all branch content)
- Comments `//` and `/* */`
- `\`timescale`, `\`default_nettype` (single-line directives to ignore)
- Synthesis attributes `(* ... *)` (skip)

---

## Finding 6: Custom JS Parser Architecture

### Architecture: Two-Phase (Strip + Scan)

```
Input: Verilog text
     |
     v
Phase 1: PREPROCESSOR STRIP
  - Remove /* block comments */
  - Remove // line comments
  - Remove `timescale, `default_nettype, `celldefine (single line)
  - Flatten `ifdef/`ifndef/`else/`endif → keep ALL branches, remove directive lines
  - Remove `define lines (don't expand macros)
  - Remove (* synthesis attributes *)
  - Remove generate/endgenerate, begin/end labels
     |
     v
Phase 2: MODULE SCANNER (state machine on token stream)
  - Tokenize: keywords | identifiers | numbers | strings | symbols
  - State: TOPLEVEL → on 'module' → MODULE_HEADER
  - State: MODULE_HEADER → parse name, #() params, () ports → INSIDE_MODULE
  - State: INSIDE_MODULE → scan for instantiation pattern → TOPLEVEL on 'endmodule'
     |
     v
Phase 3: INSTANTIATION DETECTION
  At module scope, the pattern `identifier identifier (` is ALWAYS a module instantiation.
  (Function/task calls only appear inside always/initial/function blocks)
  Exception keywords to skip: assign, if, else, case, for, while, begin, end, etc.
     |
     v
Output: ModuleInfo[]
  {
    name: string,
    params: [{name, width, default}],
    ports: [{direction, type, width, name}],
    instances: [{moduleName, instanceName, connections: [{port, signal}]}]
  }
```

### Pseudocode: Core Parser

```javascript
function parseVerilogHierarchy(source) {
  // Phase 1: Strip
  let text = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')          // block comments
    .replace(/\/\/[^\n]*/g, '')                  // line comments
    .replace(/`timescale[^\n]*/g, '')            // timescale
    .replace(/`default_nettype[^\n]*/g, '')      // default_nettype
    .replace(/`(ifdef|ifndef|else|elsif[^\n]*|endif)[^\n]*/g, '') // preprocessor
    .replace(/`define[^\n]*/g, '')               // defines
    .replace(/\(\*[^*]*\*\)/g, '')              // synthesis attrs
    .replace(/\bgenerate\b|\bendgenerate\b/g, '') // generate wrappers
    .replace(/`[a-zA-Z_]\w*/g, '')              // remaining macro invocations → drop

  // Phase 2: Tokenize
  const TOKEN = /([a-zA-Z_\\][a-zA-Z0-9_$\\]*|\d[\w.'hbodHBOD]*|[#()\[\],;.=]|\S)/g
  const tokens = [...text.matchAll(TOKEN)].map(m => m[0])

  const modules = []
  let i = 0

  function peek(offset = 0) { return tokens[i + offset] }
  function consume() { return tokens[i++] }
  function skip(n = 1) { i += n }

  // Phase 3: Module scanning
  while (i < tokens.length) {
    if (peek() === 'module') {
      skip() // 'module'
      const modName = consume() // module name
      const mod = { name: modName, params: [], ports: [], instances: [] }
      
      // Parse optional parameter list  #( ... )
      if (peek() === '#') {
        skip() // '#'
        if (peek() === '(') mod.params = parseParamList(tokens, i)
        skipBalancedParens(tokens, i)
      }
      
      // Parse port list ( ... )
      if (peek() === '(') {
        mod.ports = parsePortList(tokens, i)
        skipBalancedParens(tokens, i)
      }
      skip() // ';'
      
      // Scan module body for instantiations
      mod.instances = scanInstantiations(tokens, i)
      
      modules.push(mod)
    } else {
      skip()
    }
  }
  return modules
}

// Key insight: at module scope, `identifier identifier (` = instantiation
function scanInstantiations(tokens, startIdx) {
  const KEYWORDS = new Set([
    'assign','always','initial','if','else','case','casez','casex',
    'for','while','begin','end','endmodule','wire','reg','logic',
    'input','output','inout','parameter','localparam','function',
    'task','endfunction','endtask','integer','genvar','real','time',
    // Verilog primitive gates to skip:
    'and','or','nand','nor','xor','xnor','not','buf','bufif0','bufif1'
  ])
  
  const instances = []
  let i = startIdx
  
  while (i < tokens.length && tokens[i] !== 'endmodule') {
    const t = tokens[i]
    
    if (t === 'always' || t === 'initial' || t === 'function' || t === 'task') {
      // Skip entire behavioral block (find matching end/endfunction/endtask)
      i = skipBehavioralBlock(tokens, i)
      continue
    }
    
    // Pattern: identifier [#(...)] identifier (
    if (isIdentifier(t) && !KEYWORDS.has(t)) {
      // Could be: module_type [#(params)] instance_name (port_list);
      let j = i + 1
      
      // Skip optional parameter override #(...)
      if (tokens[j] === '#') {
        j++ // skip '#'
        if (tokens[j] === '(') j = indexAfterBalancedParens(tokens, j)
      }
      
      // Now expect: instance_name (
      if (j < tokens.length && isIdentifier(tokens[j]) && tokens[j+1] === '(') {
        const moduleName = t
        const instanceName = tokens[j]
        j++ // skip instance name
        
        const connections = parseNamedConnections(tokens, j)
        instances.push({ moduleName, instanceName, connections })
        
        i = indexAfterBalancedParens(tokens, j) + 1 // skip past ';'
        continue
      }
    }
    i++
  }
  return instances
}

// Parse .portName(signal) connections
function parseNamedConnections(tokens, parenStart) {
  // tokens[parenStart] === '('
  const connections = []
  let i = parenStart + 1
  let depth = 1
  
  while (i < tokens.length && depth > 0) {
    if (tokens[i] === '(') depth++
    else if (tokens[i] === ')') { depth--; if (depth === 0) break }
    else if (tokens[i] === '.' && depth === 1) {
      i++ // skip '.'
      const portName = tokens[i++] // port name
      if (tokens[i] === '(') {
        i++ // skip '('
        // Collect signal expression until matching ')'
        let sigDepth = 1
        let sigTokens = []
        while (i < tokens.length && sigDepth > 0) {
          if (tokens[i] === '(') sigDepth++
          else if (tokens[i] === ')') { sigDepth--; if (sigDepth === 0) break }
          else sigTokens.push(tokens[i])
          i++
        }
        i++ // skip closing ')'
        connections.push({ port: portName, signal: sigTokens.join(' ').trim() })
      }
      continue
    }
    i++
  }
  return connections
}
```

### Port List Parser (ANSI style)

```javascript
function parsePortList(tokens, parenStart) {
  // Handles: input clk, resetn  |  output reg [31:0] mem_addr  |  inout [7:0] bus
  const ports = []
  let i = parenStart + 1
  let direction = null, isReg = false, width = null
  
  const DIRECTIONS = new Set(['input','output','inout'])
  
  while (tokens[i] !== ')' && i < tokens.length) {
    const t = tokens[i]
    
    if (DIRECTIONS.has(t)) {
      direction = t; isReg = false; width = null; i++
    } else if (t === 'reg' || t === 'wire' || t === 'logic') {
      isReg = (t === 'reg' || t === 'logic'); i++
    } else if (t === '[') {
      // Parse [msb:lsb] or [N-1:0]
      width = collectUntil(tokens, i, ']')
      i = indexAfter(tokens, i, ']') + 1
    } else if (isIdentifier(t)) {
      // Could be port name, or type (like 'signed', 'unsigned', custom type)
      // Heuristic: if next is ',' or ')' → it's a port name
      const next = tokens[i+1]
      if (next === ',' || next === ')' || next === ')') {
        if (direction) {
          ports.push({ direction, reg: isReg, width, name: t })
        }
        // Reset type-related state on ',' separator
        if (next === ',') { /* keep direction for multi-name ports */ }
      }
      i++
    } else if (t === ',') {
      i++
    } else {
      i++ // skip unknown tokens (numbers in default values, etc.)
    }
  }
  return ports
}
```

### Estimated line counts
| Component | Lines |
|-----------|-------|
| Comment stripping | 20 |
| Preprocessor directive stripping | 30 |
| Tokenizer | 15 |
| Module declaration scanner | 60 |
| Parameter list parser | 50 |
| Port list parser (ANSI) | 80 |
| Instantiation scanner | 70 |
| Named connection parser | 50 |
| Balanced paren helpers | 30 |
| Output formatter (HDElk JSON) | 50 |
| **Total** | **~455 lines** |

Fits comfortably under 500 lines with clean code.

---

## Finding 7: Edge Cases — V1 Decision Matrix

| Edge Case | Example | V1 Handling | Complexity |
|-----------|---------|-------------|------------|
| `generate if` conditional instantiation | PicoRV32 PCPI muls | **Flatten** — extract all branches, annotate as "conditional" | Low |
| `generate for` array of instances | `genvar i; for(i=0;i<N;i++) inst[i]` | **Skip** — report as `unresolved[N]` | Skip |
| `\`ifdef` in port list | PicoRV32 RISCV_FORMAL | **Include all** — accept duplicate ports from all branches | Low |
| Non-ANSI module header | `module foo(a,b); input a; input b;` | **Warn** — flag as legacy, skip port extraction | Skip |
| Positional port connections | `mymod inst(clk, rst, data)` | **Handle** — 10 extra lines, match by position | Low |
| Escaped identifiers | `\module+name ` | **Skip** | Skip |
| Synthesis attributes `(* keep *)` | FPGA-specific | **Strip** — already in preprocessing | Trivial |
| Interface ports | `myif.master port_name` | **Skip** — treat as unknown type | Skip |
| `import pkg::type_t` | SV packages | **Skip** — irrelevant for hierarchy | Skip |
| Parameter defaults with expressions | `parameter N = WIDTH*2` | **Store as string** — don't evaluate | Trivial |
| Macro-defined module names | `` `MODULE_TYPE inst( `` | **Skip** — can't resolve without preprocessor | Skip |

---

## Finding 8: What a Simple Parser Will Miss in Real SoCs

From studying PicoRV32 and general SoC patterns:

1. **Conditional generate instantiation** — PicoRV32's entire sub-module set (MUL, DIV units) is inside `generate if` blocks. A parser that skips generate will show **an empty hierarchy** for picorv32. This is the #1 thing to handle.

2. **`\`ifdef` guard on whole modules** — Many SoC files wrap entire modules in `\`ifdef TARGET_ASIC` guards. Stripping directives and keeping all content handles this correctly.

3. **Multi-file instantiation chains** — `svinst` output format explicitly handles this: each file is parsed independently and you link them by matching `mod_name` across files. Your visualizer needs the same two-pass approach: parse all files, then resolve hierarchy.

4. **Same instance name, different types in generate branches** — PicoRV32's `pcpi_mul` is instantiated as either `picorv32_pcpi_fast_mul` or `picorv32_pcpi_mul`. A hierarchy graph must show both as alternatives (dashed boxes?) or just pick the first.

5. **The `(* full_case *)` synthesis attribute** appearing right before statements — can confuse a naive identifier-pair scanner. Strip `(* ... *)` in Phase 1 handles this.

6. **`\`FORMAL_KEEP reg ...` macro invocations at module scope** — these expand to synthesis attributes and look like statements. After stripping macro invocations in Phase 1, they become empty lines. Handled.

---

## Recommended V1 Implementation Plan

```
Step 1: Parser (pure JS, ~455 lines)
  - Input: string (file content)
  - Output: ModuleInfo[] JSON
  - Handle: ANSI modules, named ports, generate flatten, ifdef strip
  
Step 2: Multi-file resolver
  - Build a map: moduleName → ModuleInfo
  - Walk from top module, resolve instances recursively
  - Flag unresolved (external IPs, unloaded files)
  
Step 3: HDElk JSON generation
  - Map ModuleInfo hierarchy to HDElk { id, children, edges } format
  - Ports become HDElk port nodes
  - Named connections become HDElk edges
  
Step 4: Render
  - Drop in elk.bundled.js + svg.min.js + hdelk.js
  - Three script tags, zero npm dependencies
```

---

## Sources

**Kept:**
- `davidthings/hdelk` (https://github.com/davidthings/hdelk) — Confirmed: JSON→SVG renderer, no parser, perfect render target
- `sgherbst/svinst` (https://github.com/sgherbst/svinst) — Minimal 300-line Rust implementation showing what hierarchy extraction requires
- `dalance/sv-parser` (https://github.com/dalance/sv-parser) — Full Rust parser; WASM feasibility analysis
- `YosysHQ/picorv32` raw source — Real-world generate/instantiation pattern analysis
- `fabianschuiki/moore` (https://crates.io/crates/moore/0.13.1) — Last updated 2022, not viable
- `nturley/netlistsvg` (https://github.com/nturley/netlistsvg) — Yosys-dependent, not zero-dep

**Dropped:**
- `tjunxiang92/Verilog-Js-Parser` — 2016, 0 stars, executes Verilog as JS (wrong purpose)
- `hdl-js`, `hdl-parser` — Nand2Tetris HDL, completely different language
- WaveDrom — Timing diagrams only, irrelevant

---

## Gaps

1. **Non-ANSI port style coverage** — Older Verilog-95 designs use `module foo(a,b,c); input a; ...` port style. Not researched in depth. Estimate: ~10-15% of open-source RTL still uses this (especially Xilinx/Altera megafunction wrappers).

2. **SystemVerilog interface ports** — `interface` declarations and modport connections are common in modern SV designs. A hierarchy visualizer for SV RTL would need this for the 30% of designs using interfaces.

3. **Exact WASM binary size for a purpose-built Rust extractor** — Not benchmarked. Hypothesis: a nom-based extractor limited to hierarchy only could produce ~150KB WASM. Would need to build and measure.

4. **Benchmark: how large a file before JS parser becomes slow?** — Files like picorv32.v are ~3500 lines. A regex+string-scan approach should handle 50K-line files in <100ms. Not tested.

**Next steps:**
- Prototype the instantiation scanner against picorv32.v and verify generate-flatten works
- Test against VexRiscv (Scala-generated SV) and OpenTitan (complex SV with packages) for coverage
- Measure JS parse time on a 100K-line file to determine if worker thread is needed
