# Research: Where Software Analogies Break Down in Verilog/Digital Logic Teaching

## Summary

Every common software-to-hardware analogy smuggles in a fundamentally wrong assumption:
**that hardware executes sequentially in time**. In reality, hardware exists spatially as
a network of concurrently-operating physical structures. Each analogy fails at precisely
the point where sequentiality, scoping, or abstraction diverges from physical concurrency,
continuous signals, and timing constraints. Experts consistently recommend abandoning
execution-centric mental models entirely in favor of **netlist thinking**, **timing diagram
thinking**, and **"what hardware does this synthesize to?"** as the primary cognitive frame.

---

## Findings

### Analogy 1: `wire` = variable

#### The analogy
Students treat `wire` like a variable: something you can assign a value to, read from,
and that holds its last-written value.

#### Where it breaks down

**1. Wires must be driven continuously by exactly one source (normally)**
A variable can be uninitialized or written from multiple places safely (in managed
languages) or dangerously (in C). A `wire` net must have *exactly one combinational
driver* in synthesizable code. Two drivers = electrical contention — the wire voltage
is determined by the fight between two output stages, likely producing heat, damage,
or logic `X`. No driver = floating (`Z`), a third logic value with no software analog.

```verilog
// This compiles but is WRONG — two assign drivers on the same wire
wire out;
assign out = a & b;
assign out = c | d;   // X in simulation, physical fight in silicon
```

**2. Wires are not updated — they ARE the continuously-computed result**
A variable holds a value until overwritten. A wire's value is *whatever its driving
logic currently computes*. There is no "update step" — the wire is always reflecting
the live combinational output of whatever drives it. Changing any input to the driving
logic *immediately* propagates (after gate delay) to the wire.

**3. The `reg` vs `wire` naming disaster**
Verilog's `reg` type does NOT mean hardware register (flip-flop). It means "this
signal can be driven from a procedural block (always/initial)." A `reg` inside
`always @(*)` synthesizes to *combinational logic*, not a flip-flop. The synthesizer
decides whether a `reg` becomes a FF or combinational logic based on whether it has a
clock edge in its always block — not based on its type keyword. This naming is
considered one of the worst design decisions in Verilog; SystemVerilog's `logic` type
unifies them.

**4. 4-value logic: `0`, `1`, `X`, `Z`**
Wires exist in a 4-value logic system. `X` (unknown/conflict) and `Z` (high-impedance/
floating) have no software equivalent. `Z` is a physical state — the wire is disconnected
from any driver, floating at some indeterminate voltage. Students who treat wires as
variables never develop intuition for bus contention or tri-state buffers.

**5. Physical geometry matters**
A wire is a conductor with resistance, capacitance, and inductance. Longer wires have
more capacitance → slower propagation. Wide buses routed close together have coupling
capacitance → crosstalk. Variables have no spatial extent; wires are literally geometry
on a chip.

#### Hardware-native replacement
Think of a wire as a **labeled node in a circuit schematic** — a connection point in
a graph of logic gates. Its value is not stored; it is *computed* by the gates driving
it, continuously, as a function of all inputs.

---

### Analogy 2: `module` = function

#### The analogy
A module is like a function: it takes inputs, processes them, and produces outputs.
You "call" it when you need it.

#### Where it breaks down

**1. Instantiation ≠ calling — modules never return**
A function is invoked, executes, and returns. A module is *instantiated* — it describes
hardware that is physically present and operating for as long as power is applied. There
is no return, no stack frame, no call site. When you write:
```verilog
adder u0 (.a(x), .b(y), .sum(s));
```
you are not calling an adder — you are *placing a physical adder circuit* in your design
that will always be there, continuously computing `x + y` and putting the result on `s`.

**2. Multiple instances = multiple hardware copies, all running simultaneously**
Calling a function 8 times runs the same code 8 times, sequentially, reusing the same
instructions. Instantiating a module 8 times creates 8 *separate physical circuits*,
all operating simultaneously. Each copy costs area (gates, flip-flops) on the chip.
Software engineers dramatically underestimate resource costs because they think of
"reuse" in the function-call sense.

**3. Ports are persistent wired connections, not parameter passing**
Function arguments are values copied at call time. Module ports are *physical wire
connections* — they are continuously driven/observed. The module isn't "given" an input;
it permanently observes whatever is on its input wires. This is why you can't "call"
a module — its ports are always connected.

**4. Parameters are elaboration-time constants, not runtime values**
Verilog `parameter` values are resolved at synthesis/elaboration time, not at runtime.
You can't pass a variable as a parameter. This is closer to C++ template parameters
or `#define` macros. Students expect to be able to configure a module dynamically
(like a function argument); instead, each unique parameter combination creates a
*new, distinct hardware circuit*.

**5. The hierarchy is spatial (block diagram), not temporal (call stack)**
Module hierarchy describes the *structure* of the design — what is connected to what.
It is a nesting of boxes-in-boxes (like block diagrams or schematics), not a call graph.
There is no "execution path" through the hierarchy; all levels operate concurrently.

#### Hardware-native replacement
Think of a module as a **component in a block diagram** — a box with labeled input/output
pins, drawn on a schematic, wired to other boxes. You're not calling it; you're placing
and wiring it. The hierarchy describes *structure*, not *execution order*.

---

### Analogy 3: `always` block = event loop

#### The analogy
An `always` block is like an event loop or callback: it registers for events
(sensitivity list) and runs its handler code when they occur.

#### Where it breaks down

**1. `always @(*)` is not a loop — it describes combinational logic that permanently exists**
For combinational always blocks, "always" means *the logic is always present*, not
"always polling." The synthesis tool converts the procedural code into gates and wires.
There is no loop, no iteration, no execution — just a permanent circuit that outputs
a function of its current inputs.

**2. ALL always blocks are concurrent — there is no dispatcher**
An event loop runs one handler at a time, in a queue. In Verilog, *all* always blocks
are active simultaneously. In simulation, multiple always blocks sensitive to the same
event are scheduled to evaluate in the same delta time step, with no defined order
between them. In synthesis, they each produce their own independent circuits.

**3. Non-blocking assignments (`<=`) do not execute sequentially**
This is the most dangerous misconception. In an event-loop model, you'd expect:
```verilog
always @(posedge clk) begin
    a <= b;
    b <= a;  // "a" already changed, so b gets the new a?
end
```
to execute sequentially (failing as a swap). But `<=` schedules all RHS evaluations
*first* (capturing current values), then applies all updates *simultaneously* at the
end of the time step. This correctly models all flip-flops in a clock domain updating
at the same instant. The swap works. Students burned by this write buggy state machines
for weeks before understanding it.

**4. Blocking assignments (`=`) in synthesis create combinational priority logic**
Software developers use `=` assuming it means "execute this line now, then the next."
In a synthesizable always block, a chain of `=` statements produces combinational logic
with muxes and priority encoding — the synthesizer sees the *dataflow*, not the sequence.
Race conditions between blocking assignments in concurrent always blocks (both driven by
`@(*)`) produce simulation/synthesis mismatches.

**5. The sensitivity list is not an event queue — it is a clock/data input**
`@(posedge clk)` doesn't mean "register a callback for the next rising clock edge."
It means "this hardware has a clock input and captures its data on the rising edge."
There is no queue, no dispatcher, no polling. The hardware simply *has* a clock input.

**6. No idle state**
An event loop has an explicit idle state. A clocked always block never "idles" —
the flip-flops always hold their state, and the combinational logic feeding them
is always computing.

#### Hardware-native replacement
Think of an always block as a **schematic shorthand** for describing either:
- A bank of flip-flops with their D inputs wired to combinational logic (clocked blocks)
- A block of combinational gates with feedback-free dataflow (combinational blocks)

The "always" means the hardware is always there. The synthesis tool converts the code
into a gate-level netlist.

---

### Analogy 4: Flip-flop = variable that updates on a schedule

#### The analogy
A flip-flop is like a variable that gets updated at tick time (like a game loop variable
that only changes at the end of each frame).

#### Where it breaks down

**1. A flip-flop is a physical bistable circuit, not a memory location**
A flip-flop is built from typically 20–30 transistors (for a D flip-flop with set/reset
and scan). It is a physical device with electrical characteristics: power consumption,
leakage current, area, and most critically, *timing requirements*. A variable is a
memory location — a pure abstraction. The difference is not academic: every FF in your
design consumes power proportional to its toggle rate and clock frequency.

**2. Setup and hold time — the concept with no software analog**
This is the most profound failure of the analogy. Around every clock edge there is:
- **Setup time (t_su)**: How long before the clock edge the D input must be stable
- **Hold time (t_h)**: How long after the clock edge the D input must remain stable

If either constraint is violated, the FF can enter **metastability** — an indeterminate
electrical state that is *physically neither 0 nor 1*. The FF's output slowly drifts
toward 0 or 1, but the resolution time is exponentially distributed and potentially
unbounded. This can corrupt downstream logic in unpredictable, intermittent ways.

No software variable has anything like this. A "variable that updates on a schedule"
implies atomic, instantaneous updates. Flip-flops do not guarantee this.

**3. True simultaneity has no software equivalent**
All flip-flops in a clock domain update at literally the same physical instant (modulo
clock skew). In software, even with concurrent programming primitives, there is always
a serialization order — compare-and-swap, memory ordering, mutex acquisition all impose
ordering. In hardware, 10,000 flip-flops update truly simultaneously, with no ordering
between them.

**4. The D input is continuously driven, not set before the clock**
The "updates on a schedule" model implies something writes to the FF shortly before the
clock tick. In hardware, the D input is continuously driven by combinational logic since
the last clock edge. The FF doesn't "read" a prepared value — it *samples* whatever is
on the wire at the instant of the clock edge. The combinational logic has been settling
toward its new value throughout the entire clock period.

**5. Clock domain crossing: the synchronization problem has no managed-language parallel**
When a signal crosses between two unrelated clock domains (e.g., a 100 MHz domain to
a 133 MHz domain with no phase relationship), the receiving FF may see a D input that
changes within its setup/hold window — causing metastability. This is solved with
synchronizer circuits (double-flop) that accept a probability of metastability
rather than eliminating it. No software primitive works this way; mutexes and channels
either succeed atomically or block — they never produce indeterminate intermediate states
that must be managed probabilistically.

#### Hardware-native replacement
Think of a flip-flop as a **D-latch edge-triggered on the clock**: on the rising clock
edge, it takes a snapshot of its D input and holds it until the next rising edge.
The critical insight is that D is driven by a circuit that has been computing since the
last edge, and the clock edge is a physical sampling event with strict timing constraints
around it. Draw timing diagrams: show the combinational settling, the setup window,
the clock edge, the Q output update.

---

### Analogy 5: Clock = cron job

#### The analogy
The clock signal is like a cron job or timer interrupt: it fires periodically, triggering
the "hardware code" to run and update state.

#### Where it breaks down

**1. The clock doesn't trigger execution — it triggers a physical sampling event**
A cron job fires a process that executes and completes. A clock edge causes all
flip-flops in the domain to simultaneously *sample their D inputs* and update their Q
outputs. No "code executes." The combinational logic was already computing the new
values continuously throughout the clock period. The clock edge just captures the result.

**2. Between clock edges, combinational logic is continuously computing — nothing is idle**
The cron model implies nothing happens between triggers. In hardware, between clock
edges, all combinational logic is active: it continuously computes new values based on
the current FF outputs. This is the clock *period* — the combinational logic must
fully settle (all signals reach their final values) before the next clock edge. The
maximum clock frequency is determined by the longest combinational path (critical path),
which must be shorter than the clock period minus setup time.

```
|--[FF Q]--[comb logic: ~5ns critical path]--[FF D]--|
|<------------- clock period must be > 5ns + t_su ----------->|
```

**3. Clock jitter and skew are physical phenomena with no scheduling equivalent**
- **Jitter**: The clock edge doesn't arrive at precisely the same time every cycle;
  there is cycle-to-cycle variation in the clock period (picoseconds to nanoseconds).
  This consumes timing budget — with 100ps of jitter, your timing analysis must assume
  the clock could be 100ps early or late.
- **Skew**: Different flip-flops in the same clock domain see the clock edge at slightly
  different physical times due to routing delays through the clock distribution network.
  Positive skew can cause hold time violations; negative skew reduces setup time margin.
  Cron jobs share the same system clock reference — clock skew is a physical
  topology problem with no software analog.

**4. True simultaneity — all FFs fire together, not queued**
If a cron fires while the previous job is still running, the new job is queued or
dropped (depending on implementation). If a clock edge fires while FFs are "processing"
— impossible; FFs complete their capture in femtoseconds.
More importantly, 50,000 flip-flops all respond to the same clock edge truly
simultaneously. There is no queue.

**5. Gated clocks vs clock enables — a dangerous distinction**
You can prevent a FF from updating by either:
- **Clock gating**: Physically ANDing the clock signal with an enable — *dangerous*,
  because glitches on the enable signal can create runt clock pulses that corrupt state
- **Clock enable**: Adding an `if (en)` condition inside the clocked always block —
  safe, the FF still clocks but retains its value when `en` is low

Both look similar to "only run the cron job when enabled," but the implementation
details create physical timing hazards with no cron equivalent.

**6. PLL-generated clocks are not schedulers**
System clocks come from oscillators and PLLs (Phase-Locked Loops) — analog circuits
that lock to a reference frequency. They have voltage-controlled characteristics,
lock time, jitter transfer functions, and noise properties. Cron jobs come from
the OS scheduler.

#### Hardware-native replacement
Think of the clock as a **metronome that gates a snapshot across the entire chip
simultaneously**. Between beats, all the combinational logic is playing music (computing).
At the beat, every FF captures its D input. The constraint is: all the music must finish
playing before the next beat, or you get cacophony (setup time violation → metastability).

---

## Hardware-Native Mental Models Experts Recommend

### 1. Netlist / Schematic Thinking (Primary Model)
*Source: Dan Gisselquist (ZipCPU), Harris & Harris "Digital Design and Computer Architecture"*

Before writing any HDL, draw a block diagram or schematic. Every module is a box.
Every signal is a wire between boxes. Ask: "What component am I placing? What is it
connected to?" Write code that *describes* this circuit, not code that *computes* it.
Gisselquist's community summarizes this as: **"If you can't draw it, you can't code it."**

### 2. Timing Diagram Thinking
*Source: Sutherland, Davidmann, Flake "SystemVerilog for Design"*

Draw waveforms before writing code. Time moves left to right. Signals transition.
The question is always: "Given these input waveforms, what does the output waveform
look like?" This makes setup/hold constraints, pipeline stages, and latency natural
rather than confusing.

### 3. "What hardware does this synthesize to?" (Synthesis Discipline)
*Source: Clifford Wolf (Yosys), Doulos Verilog training materials*

For every line of RTL code, ask: what gates, muxes, and flip-flops does this become?
- `if/else` in combinational logic → MUX
- `case` → priority MUX or decoder
- `always @(posedge clk)` → flip-flops with their Q outputs wired back through combinational logic to their D inputs
- `assign a = b & c` → AND gate

If you can't answer this question for a construct, don't use it in synthesizable code.
Synthesizable Verilog is a *hardware description language*, not a programming language.

### 4. Separate Combinational and Sequential Mental Worlds
*Source: ZipCPU community "one always block per FF" style guide*

Experts enforce a strict mental (and code) separation:
- **Combinational world**: Stateless. Output = f(current inputs). No memory. Always settling.
- **Sequential world**: Stateful. FF outputs only change on clock edges. All FFs update simultaneously.

The clock edge is the *boundary* between these worlds. It snapshots the combinational
world's current output and feeds it back into the combinational world as new inputs.
This is the fundamental operating cycle of all synchronous digital logic.

### 5. Concurrency as the Default, Sequencing as the Exception
*Source: sachin_bhutada via ZipCPU Twitter roundup: "Think in hardware — parallel execution, not serial"*

Software developers must actively coordinate concurrency. In hardware, you must
actively coordinate *sequencing*. Everything runs in parallel by default. If you need
sequential behavior, you must explicitly build a state machine or pipeline to sequence it.
The discipline is inverted.

### 6. Physical Resource Awareness
*Source: Marcus Muller via ZipCPU; Xilinx/Intel FPGA synthesis guides*

Every construct in hardware costs area (LUTs, FFs, DSPs, BRAMs) and power. Unlike
software where function calls are "free" after the first, every module instantiation
costs physical resources. Deeply nested loops synthesize to exponentially large circuits.
Multiplications cost DSP blocks or large LUT chains. Resource budgeting is a fundamental
design activity with no software analog.

### 7. Distinguish RTL, Behavioral, and Structural Code
*Source: Palnitkar "Verilog HDL: A Guide to Digital Design and Synthesis"*

HDL code exists at multiple abstraction levels:
- **Structural**: Explicit gate/module instantiations — closest to a schematic
- **RTL (Register-Transfer Level)**: Describes how data moves between registers through combinational logic — the primary synthesizable style
- **Behavioral**: Describes behavior without caring about hardware structure — generally not synthesizable or produces unexpected hardware

Students from software backgrounds write behavioral code (it looks most like programs)
and are surprised when synthesis produces wrong hardware or fails entirely.

---

## The Meta-Failure: Sequential Execution Bias

All five analogies share one root cause: they all model hardware as something that
*executes* — sequentially processing inputs and producing outputs. The correct
mental model is that hardware *exists* as a spatial network of physical structures
that all operate simultaneously. Verilog code is not a program to be run; it is a
*description* of a circuit to be built.

Dan Gisselquist (ZipCPU) puts it directly:
> "Hardware design is not like software design. In software, you can use printf() or
> a debugger to see every variable in your algorithm. In an FPGA, you will struggle to
> see anything."

The invisibility of hardware state isn't just a tooling problem — it reflects a
fundamentally different relationship between the code and the artifact. Software code
*is* the artifact (executable instructions). HDL code *describes* an artifact (a circuit)
that then operates independently of the description.

---

## Sources

**Kept:**
- **ZipCPU "Rules for new FPGA designers"** (zipcpu.com/blog/2017/08/21/rules-for-newbies.html) — Primary practitioner source; explicit "Rules for software engineers" section; direct quotes on parallel vs serial thinking
- **ZipCPU "The Actual FPGA Design Process"** (zipcpu.com/blog/2017/06/02/design-process.html) — Expert vs student design process; FPGA debugging invisibility; simulation discipline
- **Harris & Harris "Digital Design and Computer Architecture"** — Standard textbook used in both EE and CS/CE programs; establishes RTL mental model explicitly
- **Sutherland/Davidmann/Flake "SystemVerilog for Design"** — Authoritative source on synthesis-directed thinking and timing diagram methodology
- **Clifford Wolf (Yosys) documentation** — Open-source synthesis tool author; synthesis-first HDL perspective
- **Palnitkar "Verilog HDL"** — Standard Verilog reference; RTL/behavioral/structural distinction

**Dropped:**
- SEO tutorial sites (hardwarebee, various "beginner's guide" posts) — High keyword density, low analytical depth, don't address analogy failures specifically
- Generic Stack Overflow threads on `reg` vs `wire` — Correct factually but shallow; miss the pedagogical dimension

---

## Gaps

1. **Empirical/pedagogical research data**: No controlled studies found on which specific analogies cause the most student errors or take longest to correct. This is likely published in IEEE Transactions on Education or ASEE conference proceedings — worth searching specifically.

2. **CS→EE transition curriculum design**: What structured curricula (MIT 6.004, CMU 18-240, etc.) do specifically to address these misconceptions. Course syllabi and lecture notes from open courseware would fill this.

3. **SystemVerilog's improvements**: SystemVerilog's `logic` type, `always_comb`/`always_ff`/`always_latch` keywords, and interfaces were explicitly designed to reduce these confusions. How well they succeed in practice for software-background students is unresearched here.

4. **Formal analogy replacement proposals from EE educators**: While practitioners (ZipCPU community, Clifford Wolf) are clear that software analogies fail, there's no single canonical paper proposing a replacement pedagogical framework targeting CS students. IEEE Edu Transactions likely has this.

**Suggested next searches (when provider available):**
- `site:ieeexplore.ieee.org "teaching HDL" OR "teaching Verilog" "software engineers" OR "CS students"`
- `"digital design" pedagogy misconceptions "sequential thinking" hardware concurrency`
- `MIT OCW 6.004 OR CMU 18-240 "hardware description language" lecture notes`
