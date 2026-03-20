# HDLBits Categories Knowledge Map

A reference map of all 20 HDLBits categories — concepts taught, required skills, pitfalls, and prerequisites.

---

## 00 · Getting Started (2 exercises)
**Concepts:** HDLBits interface, module structure, basic `wire` output.
**Key Skills:** Write a minimal module; connect a constant or wire to an output.
**Pitfalls:** Forgetting the `endmodule` keyword; not matching the given module signature.
**Prerequisites:** None.

---

## 01 · Verilog Language > Basics (8 exercises)
**Concepts:** `wire`, `assign`, simple Boolean gates (AND, OR, NOT, XOR, NAND, etc.), module ports.
**Key Skills:** Continuous assignment; combining gates with `assign`; port declarations.
**Pitfalls:** Operator precedence (use parentheses); `~` vs `!`; forgetting output declarations.
**Prerequisites:** 00 Getting Started.

---

## 02 · Verilog Language > Vectors (9 exercises)
**Concepts:** Multi-bit vectors, part-select `[i:j]`, concatenation `{}`, replication `{N{x}}`, bitwise vs reduction operators.
**Key Skills:** Slicing and joining bit vectors; sign extension; byte reversal.
**Pitfalls:** Wrong bit-order in part-select; replication syntax `{N{expr}}` (not `N*expr`); mixing vector widths in assignments.
**Prerequisites:** 01 Basics.

---

## 03 · Verilog Language > Modules (9 exercises)
**Concepts:** Module instantiation, named vs positional port connections, hierarchical design, port direction.
**Key Skills:** Instantiate provided submodules; wire them together; handle dangling/unused ports.
**Pitfalls:** Positional port order errors; driving an `input` port from the wrong direction; leaving outputs unconnected.
**Prerequisites:** 01 Basics, 02 Vectors.

---

## 04 · Verilog Language > Procedures (8 exercises)
**Concepts:** `always @(*)` (combinational), `always @(posedge clk)` (sequential), blocking `=` vs non-blocking `<=`, `if/else`, `case`.
**Key Skills:** Choose correct always-block type; use correct assignment style; avoid latches.
**Pitfalls:** Using blocking assignment in sequential blocks; missing `default`/`else` causes latches; `reg` vs `wire` type for driven signals.
**Prerequisites:** 01 Basics, 02 Vectors.

---

## 05 · Verilog Language > More Features (7 exercises)
**Concepts:** `casez` / `casex`, conditional `? :`, `generate`/`genvar`, `parameter`, `$signed`, arithmetic operators.
**Key Skills:** Priority logic with casez; parameterized designs; signed arithmetic and shifts.
**Pitfalls:** Forgetting `$signed` for arithmetic right shift; generate block naming; parameter override syntax.
**Prerequisites:** 04 Procedures.

---

## 06 · Circuits > Combinational > Basic Gates (17 exercises)
**Concepts:** Universal gates, multi-input logic, truth tables → Verilog, wire functions, tristate buffers.
**Key Skills:** Translate any truth table to assign statements; NAND/NOR/XNOR; gates with many inputs.
**Pitfalls:** Reduction operators (`&in`, `|in`) vs bitwise; off-by-one in bit indexing; tri-state `buz` types.
**Prerequisites:** 01 Basics, 02 Vectors.

---

## 07 · Circuits > Combinational > Multiplexers (5 exercises)
**Concepts:** 2:1, 4:1, wider muxes; priority mux; mux-based logic functions.
**Key Skills:** Build muxes with ternary operator and `case`; use muxes to implement arbitrary functions.
**Pitfalls:** Missing `default` in case mux (latch!); one-hot select decoding errors.
**Prerequisites:** 04 Procedures, 06 Basic Gates.

---

## 08 · Circuits > Combinational > Arithmetic (7 exercises)
**Concepts:** Adders, subtractors, carry-lookahead concepts, overflow detection, comparators, BCD addition.
**Key Skills:** Bit-width management in addition; signed overflow; chaining adder modules.
**Pitfalls:** Carry-out bit lost if output register is too narrow; signed vs unsigned overflow differ; BCD carry conditions.
**Prerequisites:** 02 Vectors, 03 Modules.

---

## 09 · Circuits > Combinational > Karnaugh Maps (8 exercises)
**Concepts:** K-map minimization, SOP/POS forms, don't-cares, multi-output minimization.
**Key Skills:** Read a K-map or truth table; write minimized Boolean expression as `assign`.
**Pitfalls:** Grouping errors (groups must be power-of-2 size); missing don't-cares as minimization aids; wrong variable ordering.
**Prerequisites:** 01 Basics, 06 Basic Gates.

---

## 10 · Circuits > Sequential > Flip-Flops (18 exercises)
**Concepts:** D-FF, T-FF, JK-FF, SR latch, synchronous/asynchronous reset, clock enable, edge detection, DFF arrays.
**Key Skills:** Instantiate and build flip-flops; manage reset polarity; detect rising/falling edges.
**Pitfalls:** Async reset belongs in sensitivity list; active-high vs active-low reset confusion; edge detector needs two registers.
**Prerequisites:** 04 Procedures.

---

## 11 · Circuits > Sequential > Counters (8 exercises)
**Concepts:** Binary up/down counters, decade counters, arbitrary modulo counters, slow-clock dividers.
**Key Skills:** Synchronous load and reset; terminal count detection; clock dividers.
**Pitfalls:** Off-by-one on terminal count; counter not resetting properly; slow-clock enable vs actual slow clock.
**Prerequisites:** 10 Flip-Flops.

---

## 12 · Circuits > Sequential > Shift Registers (9 exercises)
**Concepts:** SIPO/PISO shift registers, LFSRs, Galois LFSR, barrel shifter, rotate.
**Key Skills:** Shift left/right with concatenation; LFSR tap polynomial; parallel load vs serial shift.
**Pitfalls:** Wrong shift direction; LFSR tap positions (check polynomial); confusing rotate with shift.
**Prerequisites:** 10 Flip-Flops, 02 Vectors.

---

## 13 · Circuits > Sequential > More Circuits (3 exercises)
**Concepts:** Ring counters, Johnson counters, sequence detectors without explicit FSM.
**Key Skills:** Creative reuse of shift register structures; recognizing patterns in bit sequences.
**Pitfalls:** Johnson counter output decoding; ensuring correct initial state for ring/Johnson counters.
**Prerequisites:** 11 Counters, 12 Shift Registers.

---

## 14 · Circuits > Sequential > Finite State Machines (34 exercises)
**Concepts:** Moore vs Mealy FSMs, state encoding, sequence detectors, string recognizers, complex controllers.
**Key Skills:** Two/three always-block FSM style; one-hot encoding; overlapping vs non-overlapping sequences.
**Pitfalls:** Missing `default` state (latch or X); Mealy output not responding to input immediately; state never transitions out of reset; confusing Moore/Mealy output placement.
**Prerequisites:** 10 Flip-Flops, 04 Procedures.

---

## 15 · Circuits > Building Larger Circuits (7 exercises)
**Concepts:** Combining counters, shift registers, FSMs, and datapath components into larger systems.
**Key Skills:** Hierarchical instantiation; coordinating control + datapath; timing across modules.
**Pitfalls:** Control/datapath timing mismatches; forgetting to connect all sub-module resets; bus width mismatches between modules.
**Prerequisites:** 11 Counters, 12 Shift Registers, 14 FSMs.

---

## 16 · Verification > Finding Bugs (5 exercises)
**Concepts:** Identifying bugs in given (broken) Verilog code — logic errors, wrong operators, missing bits.
**Key Skills:** Code reading; tracing signal flow; spotting subtle type and operator errors.
**Pitfalls:** Assuming the code is mostly correct — the bug may be a single wrong character or operator.
**Prerequisites:** All language + combinational categories.

---

## 17 · Verification > Simulation Waveforms (10 exercises)
**Concepts:** Reading waveform diagrams and writing Verilog that matches the shown behavior exactly.
**Key Skills:** Translating waveform timing to procedural stimulus; `initial` blocks; `#delay`.
**Pitfalls:** Off-by-one clock cycle; not matching exact signal transitions shown; forgetting to `$finish`.
**Prerequisites:** 04 Procedures, familiarity with sequential behavior.

---

## 18 · Verification > Writing Testbenches (5 exercises)
**Concepts:** Full testbench authoring: clock gen, reset, stimulus sequences, checking outputs.
**Key Skills:** `initial`/`always` for clocks; applying vectors; `$display`/`$monitor`; task definitions.
**Pitfalls:** Clock never toggles (missing `always #N`); stimulus applied at exactly the clock edge (use small `#delay`); no `$finish` causes infinite simulation.
**Prerequisites:** 04 Procedures, 17 Simulation Waveforms.

---

## 19 · CS450 (4 exercises)
**Concepts:** Advanced: pipelined CPU datapath fragments, hazard detection, forwarding units (university course problems).
**Key Skills:** Multi-stage pipeline reasoning; hazard/forwarding logic; complex conditional assignments.
**Pitfalls:** Conflating pipeline stages; incorrect forwarding conditions; register file read/write ordering.
**Prerequisites:** All prior categories, especially 14 FSMs and 15 Building Larger Circuits.
