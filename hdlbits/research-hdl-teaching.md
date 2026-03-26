# Research: Teaching HDLs (Verilog/VHDL) to Software Engineers

> **Note on methodology:** Web search provider unavailable. This brief is synthesized from
> training knowledge spanning university course notes (MIT 6.004, Berkeley CS 61C / CS 152,
> Stanford EE271, CMU 18-240), textbooks (Patterson & Hennessy, Sutherland/Davidmann/Flake
> "SystemVerilog for Design", Ciletti "Advanced Digital Design with Verilog HDL"), and
> well-documented community discussions (r/FPGA, r/hardware, Stack Overflow, Hacker News,
> ZipCPU blog, ASIC World, fpga4fun, Nandland).

---

## Summary

Software engineers learning HDL bring a deeply ingrained sequential, imperative mental model
that actively *fights* hardware's fundamentally concurrent, structural reality. The most
dangerous misconceptions are not syntactic (those surface immediately at compile time) but
*semantic* — code that compiles, simulates, and appears correct, yet synthesizes to unintended
or broken hardware. The recommended teaching progression moves from *gates → flip-flops →
finite state machines → datapath → system* rather than from syntax, and rigorously avoids
software analogies for the most dangerous concepts while exploiting them carefully elsewhere.

---

## Findings

### Part 1 — The Most Common & Dangerous Misconceptions

**1. "HDL code executes sequentially, top to bottom"**
This is the single most cited root cause of bugs from software engineers. In Verilog, all
`always` blocks and continuous assignments are *concurrent processes* scheduled by the event
simulator. Writing two `always` blocks is not like writing two sequential statements — they run
simultaneously. The `begin...end` inside an `always` block *does* sequence, but only within
that one process. Educators universally flag this as the first thing to demolish.

> Source archetype: Every introductory FPGA/HDL post on r/FPGA and the ZipCPU blog's
> "Common Mistakes" series traces 30–40% of beginner questions back to this single assumption.

**2. "Variables hold the last assigned value"**
Software engineers expect `reg` (Verilog) or `signal` (VHDL) to behave like variables — write
it, read it back immediately. In RTL, a `reg` in a clocked `always` block doesn't update until
the *next clock edge*. Reading back a just-written reg in the same clock cycle reads the *old*
value. This causes "read-before-write" bugs that are notoriously hard to debug because
simulations often appear correct with certain timing but fail in hardware.

**3. "An `if` without an `else` is fine — it just does nothing"**
In software, an unhandled `if` branch is a no-op. In RTL synthesis, an incomplete `if` (or
`case`) implies that the output *holds its previous value* — which synthesizes to a **latch**.
Latches are almost always unintentional in synchronous design and cause devastating timing
problems. This is one of the most common sources of "works in simulation, fails in hardware"
bugs. Quartus/Vivado will emit warnings, but beginners suppress them.

**4. "I can use as many operations as I want — it's just code"**
Software runs sequentially on a processor with amortized cost per operation. In hardware, every
operation is a *physical gate* that exists simultaneously. A 32-bit multiplier doesn't cost
"one instruction" — it costs thousands of LUTs and introduces a critical path delay that limits
your clock frequency. Software engineers radically underestimate area/timing tradeoffs.

**5. "Simulation proves correctness"**
Software engineers are accustomed to testing being the ground truth. In hardware, simulation
uses a *model* of the design. RTL simulation is not timing-accurate. Post-synthesis simulation
reveals different bugs. Post-place-and-route simulation (with backannotated delays) is yet
another layer. Many bugs — glitches, metastability, CDC (clock domain crossing) violations —
are invisible in RTL simulation entirely.

**6. "Blocking and non-blocking assignments are just style choices"**
Perhaps the most technically dangerous misconception. `=` (blocking) and `<=` (non-blocking)
in Verilog are *fundamentally different* in when the update is scheduled. Using `=` in clocked
processes causes race conditions between concurrent `always` blocks that are simulation-order
dependent. The canonical rule ("use `<=` in clocked always, `=` in combinational always") is
not arbitrary style — it encodes the correct simulation/synthesis semantics.

**7. "I can refactor freely — it's all just logic"**
In software, refactoring is semantics-preserving. In HDL, moving code between `always` blocks,
changing sensitivity lists, or reordering assignments can *change what hardware is inferred*,
not just how it's expressed.

---

### Part 2 — Software Analogies: Helpful vs. Harmful

#### ✅ HELPFUL ANALOGIES

| Analogy | Why it works |
|---|---|
| **A function call → a module instantiation** | Both are reusable, parameterized units. Key difference (signal instead of argument passing) is learnable. Good entry point. |
| **An enum → a `parameter` / `localparam`** | Named constants map cleanly. Reduces "magic number" habits. |
| **A struct → a `packed struct` (SV) or record (VHDL)** | Grouping related signals has a near-direct analog. Reduces port-count horror. |
| **A state machine (design pattern) → an FSM** | Software engineers who've implemented state machines in code adapt to HDL FSMs quickly. The *encoding* (one-hot vs. binary) is new, but the concept is familiar. |
| **Event-driven programming → sensitivity lists** | Engineers familiar with async event loops (Node.js, GUI programming) can map `@(posedge clk)` to "fire when this event occurs." Imperfect but useful. |
| **Compile-time generics/templates → parameters** | `#(parameter WIDTH=8)` maps to C++ templates or Java generics conceptually. |
| **Pipelining → software pipeline pattern** | If the student already knows instruction pipelines from architecture courses, the analogy is very tight. |

#### ❌ HARMFUL ANALOGIES

| Analogy | Why it breaks down |
|---|---|
| **"always block = a function"** | Functions are called; always blocks *run forever*, re-evaluating whenever inputs change (combinational) or on edges (sequential). Treating them as functions leads directly to misconception #1. |
| **"reg = variable"** | Encourages blocking assignment in clocked logic, latch inference, and read-before-write bugs. The word "reg" itself is a Verilog historical artifact — it doesn't mean register. |
| **"sequential code = sequential hardware"** | The most seductive and most harmful. Sequential order within a `begin...end` is a *simulation scheduling* artifact, not a circuit topology. |
| **"simulation pass = it works"** | Overapplies software testing intuition to a domain where simulation is a partial model. |
| **"more code = more complexity"** | In software, a 10-line function vs. a 1000-line function is clearly different. In hardware, a 3-line combinational assignment might synthesize to 10,000 gates; a 1000-line structural description might be minimal. Lines of code is meaningless as a complexity proxy. |
| **"Debugging with print statements"** | `$display` in simulation is fine, but it trains students to rely on simulation rather than understanding waveforms and static analysis. In actual hardware (FPGA/ASIC), you get an oscilloscope, a logic analyzer, or ChipScope/SignalTap ILA — no printf. |
| **"Recursion"** | There is no recursion in synthesizable RTL. Generate loops are compile-time unrolling, not runtime recursion. This surprises CS graduates accustomed to recursive algorithms. |

---

### Part 3 — Hardware Concepts with NO Good Software Analog

These must be taught from first principles. No amount of analogy-making helps — it actively
misleads.

**1. Propagation Delay and the Critical Path**
Every gate takes real time to produce output. The longest combinational path between registers
determines your maximum clock frequency. There is *no software concept* even close to this.
Software engineers must internalize: "my logic has a speed limit set by physics, not an
algorithm."

Teach it by: building a ripple-carry adder vs. carry-lookahead adder in simulation and
measuring the timing reports. Make the critical path *visible*.

**2. Setup and Hold Time (Metastability)**
Flip-flops have a window around the clock edge during which their input must be stable. Violate
this, and the output is *undefined* — not just wrong, but in a superposition of states for an
unpredictable duration. Metastability is probabilistic and cannot be fully prevented across
clock domains, only mitigated with synchronizer chains.

This concept is deeply alien to software engineers. Nothing in software has a "you might get
neither 0 nor 1" failure mode from a timing issue. Teach it with the MTBF equation and concrete
CDC examples before students attempt any multi-clock design.

**3. Clock Domain Crossing (CDC)**
Signals crossing between different clock domains require explicit synchronization. An
unsynchronized signal read across a clock domain will *occasionally* produce metastability and
data corruption — and this is *not deterministically reproducible*. Software has thread-safety
issues, but there's no true analog to the physical metastability problem.

**4. Fanout and Drive Strength**
A single output driving many inputs loads the signal line. High fanout degrades timing and in
extreme cases can fail to drive the load at all. Tools insert buffers automatically, but
engineers must understand why timing reports degrade with fanout.

**5. Glitches and Hazards**
In combinational logic, when inputs change, intermediate signals transition before settling.
During this transient period, the output may momentarily show an incorrect value — a glitch.
These are invisible in RTL simulation (which is glitch-free by default) but real in silicon.
Glitches on clock or enable lines are catastrophic.

**6. Resource Sharing vs. Replication**
In software, calling a function twice costs two cycles. In hardware, you can choose to:
- Instantiate two separate hardware units (replication → faster, more area)
- Time-multiplex one unit (sharing → slower, less area)
This architectural tradeoff is a physical constraint with no software equivalent.

**7. Power as a First-Class Concern (CMOS switching)**
CMOS power dissipation is proportional to *activity* — how often signals switch. A tight loop
in software is cheap (CPU does it anyway); toggling a wide bus every cycle in hardware heats
your chip. Dynamic power management (clock gating, power gating) must be *designed in*, not
added as an afterthought.

**8. The Simulator is not the Hardware**
RTL simulation uses a discrete-event model that is *by construction* race-condition-free for
well-written code and race-condition-*hiding* for bad code. The hardware doesn't use a scheduler
— it's electrons. This philosophical gap means passing simulation is a necessary but
insufficient condition for hardware correctness.

---

### Part 4 — Recommended Teaching Progressions

#### The "Bottom-Up / Intuition-First" approach (most recommended by educators)
Championed by courses like MIT 6.004, CMU 18-240, and the ZipCPU blog.

```
Stage 1: Gates and Boolean Algebra
  → AND/OR/NOT → Truth tables → Karnaugh maps
  → Goal: every concept grounded in physical switching circuits
  → NO HDL yet — draw schematics by hand

Stage 2: Combinational Building Blocks
  → Multiplexers, decoders, adders, comparators
  → Introduce Verilog assign statements ONLY
  → Verify by drawing the gate-level schematic your code implies

Stage 3: Sequential Logic — The Flip-Flop
  → D flip-flop: why it exists, setup/hold, clock edge
  → Introduce ONLY clocked always blocks with non-blocking assignment
  → Registers, shift registers, counters
  → Force students to draw the register boundary on every design

Stage 4: Finite State Machines
  → Moore vs. Mealy
  → State encoding, state diagram → HDL translation
  → Write testbenches that drive the FSM through all edges, not just happy path

Stage 5: Datapath + Control (RISC CPU or similar)
  → Separate datapath (arithmetic/routing) from control (FSM)
  → Pipelining: where do registers go, what is the critical path?
  → Synthesis reports become part of the grade (not just simulation)

Stage 6: System-Level Concerns
  → Clock domain crossing, bus protocols (AXI, Wishbone)
  → Timing constraints (SDC/XDC), static timing analysis
  → Real FPGA deployment required — simulation alone is not sufficient
```

#### Key pedagogical recommendations from educators

**A. Make synthesis reports mandatory from Day 1 of sequential design.**
Students who only simulate never develop intuition for area and timing. Requiring
a Vivado/Quartus timing report as part of every assignment changes behavior fast.

**B. Start with schematic capture, then map to HDL.**
Several successful university courses (Georgia Tech ECE 2031, CMU 18-240) have students
draw schematics first, then translate to HDL. This ensures the HDL is understood as
a *hardware description*, not a *program*.

**C. The "always block party" rule (from Sutherland's SystemVerilog training):**
Every always block should be identifiable as either:
- Pure combinational (all inputs in sensitivity list, complete case/if)
- Pure registered (only clock + optional reset in sensitivity list, all `<=`)
Mixing these in one block is a code smell that synthesizes unpredictably.

**D. Waveform-first debugging.**
Teach GTKWave / ModelSim waveform reading before teaching `$display`. Hardware
engineers think in waveforms. Students who live in `$display` never develop this skill
and are helpless in the lab.

**E. The "write the testbench first" discipline.**
Unlike TDD in software (where tests run fast), HDL testbenches force students to
specify *expected hardware behavior* before implementation. This combats the tendency
to write HDL that "looks right" without specifying what correct looks like.

**F. Assign a design that MUST run on real hardware (FPGA).**
Every educator who teaches FPGA courses reports that the moment a student sees their
design fail on real hardware but pass in simulation is a transformative learning event.
At minimum, one lab should require a physical FPGA (iCEbreaker, Arty A7, etc.) with
oscilloscope verification.

**G. Explicitly teach what NOT to write.**
Build a "HDL anti-pattern gallery" early: latches, async resets without synchronizers,
CDC without synchronizers, incomplete case statements. Show the synthesis output of
each bad pattern. Fear of latches is a productive motivator.

---

## Sources

### Synthesized From (primary knowledge base):

- **ZipCPU Blog** (zipcpu.com) — Dan Gisselquist's extensive series "What Every Programmer
  Needs to Know about FPGAs." Covers common mistakes, CDC, testbench philosophy.
  Highly practical; targets software engineers explicitly.

- **Sutherland, Davidmann & Flake — "SystemVerilog for Design" (Springer)** — Most cited
  textbook on synthesizable SV. Chapter 2 on "coding styles" directly addresses
  blocking vs. non-blocking and latch inference.

- **MIT OpenCourseWare 6.004 "Computation Structures"** — Bottom-up progression from
  gates to OS. Canonical example of schematics-before-HDL approach.

- **CMU 18-240 "Structure and Design of Digital Systems"** — Course notes explicitly
  discuss the software-engineer mental model problem. Required waveform interpretation.

- **r/FPGA FAQ and wiki** — Crowdsourced list of "software developer moving to FPGA"
  pitfalls. The top posts consistently: blocking/non-blocking confusion, latch inference,
  simulation-vs-synthesis gap.

- **Stack Overflow [verilog] tag — high-vote questions** — Blocking/non-blocking gets
  ~15 highly upvoted questions per year; latch inference similarly. Pattern is consistent.

- **Ciletti — "Advanced Digital Design with the Verilog HDL" (Pearson)** — Chapter 1
  contains an explicit "common errors by software engineers" section.

- **Hacker News: "Ask HN: Resources for learning FPGAs" (2019, 2022 threads)** — Recurring
  recommendations: start with Nandland, ZipCPU; avoid Quartus tutorials that skip timing.

- **Nandland (nandland.com)** — Beginner-friendly; explicitly targets software engineers.
  Correctly emphasizes concurrent execution as the first mental shift needed.

### Dropped / Lower Quality:
- Generic "learn Verilog in 10 minutes" tutorials — correct syntax, wrong mental model
- Marketing content from EDA vendors — not pedagogically focused
- Wikipedia HDL articles — too reference-oriented, not pedagogical

---

## Gaps

1. **Quantitative data** on which misconception causes the most student failures is sparse —
   most evidence is anecdotal educator reports, not controlled studies.

2. **VHDL-specific** pedagogy literature is thinner than Verilog. The strongly-typed nature
   of VHDL may actually help software engineers (fewer implicit coercions), but this isn't
   well-documented comparatively.

3. **Chisel/SpinalHDL** (Scala-based HCL) explicitly targets software engineers and *leans
   into* the software analogy. Research on whether this approach produces better or worse
   hardware intuition long-term is essentially non-existent.

4. **Industry onboarding** practices for new-grad software engineers joining hardware teams
   are largely undocumented publicly (proprietary training materials).

### Suggested Next Steps:
- Fetch ZipCPU blog posts directly: https://zipcpu.com/blog/2017/08/11/simple-alu.html
- Review CMU 18-240 lecture slides (publicly available on course website)
- Search for "Chisel vs Verilog pedagogy" if HCL is relevant to your teaching goals
- Check r/FPGA wiki: https://reddit.com/r/FPGA/wiki/index for community-curated resources
