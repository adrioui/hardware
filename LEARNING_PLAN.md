# 🔧 Hardware Learning: Move Fast & Break Things

## Geoffrey Huntley's Core Principles (Applied to Hardware)

Everything below is distilled from ghuntley's blog posts ([stdlib](https://ghuntley.com/stdlib/), [specs](https://ghuntley.com/specs/), [dothings](https://ghuntley.com/dothings/), [oh-fuck](https://ghuntley.com/oh-fuck/)) and adapted for hardware learning.

### The 6 Principles

**1. You can PROGRAM the LLM — build a "stdlib" for hardware learning**
- Don't use Claude/ChatGPT as Google Search
- Create reusable prompt templates (your "stdlib") for hardware topics
- Example: a prompt template that says "explain this circuit, then give me 3 exercises that build on each other, then verify my Verilog solution"
- Save these as `.md` files in your project — they compound over time

**2. Specs → Code, not vibes → code**
- Write a design doc / spec FIRST, then have the LLM generate the implementation
- For hardware: sketch the block diagram → write the spec → generate Verilog/VHDL → simulate → verify
- The spec is the artifact, the code is the output

**3. Compiler errors = reinforcement signal = FAST FEEDBACK LOOP**
- Huntley's key insight: *"The stronger the type system and the better the compiler errors, the harder you can drive these LLMs"*
- For hardware this translates to: **simulation errors are your compiler errors**
- Use Verilator, Icarus Verilog, or HDLBits — they give immediate pass/fail
- Every failed simulation is a learning signal for BOTH you and the LLM

**4. Fast inner loop = faster learning**
- *"Compilation times matter, and your test suite needs to run fast. The faster the inner loop, the faster you can provide reinforcement"*
- Choose tools with INSTANT feedback: browser simulators > FPGA synthesis > physical hardware
- Stack: HDLBits (instant) → Verilator (seconds) → FPGA (minutes) → Physical (hours)

**5. Be a high-agency person who can "just do things"**
- Don't ask permission, don't wait for the "right" course
- Build something ugly, break it, fix it, repeat
- *"The future belongs to people who can just do things"*

**6. Transpilation is a superpower**
- LLMs are "shockingly good at structure-to-structure conversions"
- Have the LLM convert between representations: schematic ↔ Verilog ↔ VHDL ↔ block diagram ↔ truth table
- This builds intuition FAST because you see the same thing from multiple angles

---

## The Fast Feedback Loop Stack

### Layer 0: INSTANT (Browser, zero setup) — START HERE

| Tool | What | Link |
|------|------|------|
| **HDLBits** | 170+ Verilog exercises with instant simulation feedback | https://hdlbits.01xz.net |
| **Falstad Circuit Simulator** | Drag-and-drop analog/digital circuit sim, runs in browser | https://www.falstad.com/circuit/ |
| **Wokwi** | Arduino/ESP32/RPi Pico simulator in browser | https://wokwi.com |
| **Digital** | Logic gate simulator with built-in exercises | https://github.com/hneemann/Digital |
| **CircuitVerse** | Digital logic simulator in browser | https://circuitverse.org |

### Layer 1: LOCAL SIM (seconds feedback)

| Tool | What | Install |
|------|------|---------|
| **Icarus Verilog** | Open-source Verilog simulator | `sudo dnf install iverilog` |
| **Verilator** | Fast Verilog simulator (C++ backend) | `sudo dnf install verilator` |
| **GTKWave** | Waveform viewer for debugging | `sudo dnf install gtkwave` |
| **Yosys** | Open-source synthesis suite | `sudo dnf install yosys` |
| **cocotb** | Python-based testbench framework | `pip install cocotb` |

### Layer 2: FPGA (minutes feedback, real hardware)

| Board | Price | Why |
|-------|-------|-----|
| **Tang Nano 9K** | ~$15 | Cheapest entry, great community |
| **iCEBreaker** | ~$70 | Fully open-source toolchain (ice40) |
| **DE10-Nano** | ~$130 | Intel/Altera, lots of tutorials |

### Layer 3: PHYSICAL (hours feedback, maximum learning)

| Kit | What |
|-----|------|
| **Ben Eater 8-bit CPU kit** | Build a CPU on breadboards (~$50) |
| **Arduino Starter Kit** | Basics of embedded + electronics |

---

## The Curriculum: Fastest Path

### Phase 1: Digital Logic Fundamentals (1-2 weeks)
**Goal:** Understand gates, combinational & sequential logic

1. **HDLBits** — Do the first 50 exercises (instant browser feedback)
   - Getting Started → Verilog Language → Combinational Logic → Sequential Logic
   - This is your FASTEST possible feedback loop
2. **Use Claude/pi as your tutor** — when stuck on an HDLBits problem:
   ```
   Here's the HDLBits problem: [paste]
   Here's my attempt: [paste]
   Here's the error: [paste]
   Explain what I got wrong, then give me a simpler version of the same concept to try first.
   ```
3. **Falstad** — play with circuits visually to build intuition

### Phase 2: Build a CPU (2-4 weeks)
**Goal:** Understand how a processor works from NAND gates up

Pick ONE:

| Path | Style | Link |
|------|-------|------|
| **Nand2Tetris** | Structured course, HW simulator included | https://nand2tetris.org + [Coursera Part I](https://www.coursera.org/learn/build-a-computer) |
| **From the Transistor** (geohot) | Hardcore, Verilog + Verilator, build ARM7 | https://github.com/geohot/fromthetransistor |
| **Ben Eater 8-bit** | Physical breadboard CPU, YouTube series | https://eater.net/8bit |

**Recommended: Nand2Tetris** — it has the BEST feedback loop (built-in HW simulator, auto-grading).

Use the LLM to:
- Explain each chapter before you start
- Review your HDL code
- Generate test cases
- Convert between representations (truth table → HDL → schematic)

### Phase 3: FPGA + Real Hardware (2-4 weeks)
**Goal:** Run your designs on real silicon

1. Get a **Tang Nano 9K** (~$15)
2. Install open-source toolchain: Yosys + nextpnr + openFPGALoader
3. Port your Nand2Tetris CPU to real Verilog → synthesize → run on FPGA
4. Add peripherals: UART, LED matrix, VGA output (Ben Eater style)

### Phase 4: From the Transistor (ongoing)
**Goal:** Deep understanding, transistor → web browser

Follow geohot's **From the Transistor** curriculum:
- Section 1-2: FPGA + Verilog bringup (0.5-1 week)
- Section 3: Build an ARM7 CPU in Verilog (3 weeks)
- Section 4: Build a C compiler (3 weeks)
- Section 5: Build an OS (3 weeks)
- Section 6: TCP stack + browser (1 week)
- Section 7: Run on real FPGA hardware (1 week)

---

## Your "stdlib" — Prompt Templates for Hardware Learning

Save these and reuse them. This is the Huntley method applied to hardware.

### `explain-circuit.md`
```markdown
You are a hardware engineering tutor. I'm learning digital logic.

CIRCUIT/CONCEPT: [describe or paste Verilog]

1. Explain what this does in plain English
2. Draw the truth table (if combinational) or state diagram (if sequential)
3. Show me the equivalent circuit using only NAND gates
4. Give me 3 progressively harder exercises that build on this concept
5. After I solve each, verify my solution by checking the truth table
```

### `debug-verilog.md`
```markdown
Here is my Verilog code that isn't working:

```verilog
[paste code]
```

Simulation output / error:
```
[paste error]
```

Expected behavior: [describe]

1. Identify the bug
2. Explain WHY it's wrong (what hardware does the buggy code actually describe?)
3. Show the fix
4. Show me how to write a testbench that would have caught this
```

### `convert-representations.md`
```markdown
Convert between these representations to help me build intuition:

INPUT: [truth table / Verilog / schematic description / state diagram / boolean expression]

Generate ALL of these:
1. Truth table
2. Boolean expression (simplified)
3. Verilog module
4. Gate-level schematic description
5. Timing diagram for key inputs
```

### `spec-to-hardware.md` (The Huntley "specs" method)
```markdown
I want to build: [describe the hardware module]

1. Write a detailed design spec with:
   - Interface (inputs/outputs with bit widths)
   - Behavioral description
   - Timing requirements
   - Edge cases
2. Generate the Verilog implementation
3. Generate a comprehensive testbench
4. List what I should verify in simulation
```

---

## Daily Practice Loop (The "Move Fast" Schedule)

```
Morning (30 min):
  → 3-5 HDLBits problems (instant feedback)
  → Use LLM to understand mistakes

Afternoon/Evening (1-2 hours):
  → Work on current Phase project
  → Simulate → fail → debug → repeat
  → Use LLM as tutor, not as Google

Weekly:
  → Build something that DOESN'T work
  → Debug it yourself first (30 min max)
  → Then use LLM to understand the gap
  → Write down what you learned in a TIL.md
```

---

## Key Resources Summary

| Resource | Type | Feedback Speed | Link |
|----------|------|---------------|------|
| HDLBits | Browser exercises | ⚡ Instant | https://hdlbits.01xz.net |
| Falstad | Circuit sim | ⚡ Instant | https://falstad.com/circuit/ |
| Nand2Tetris | Full course | ⚡ Instant (built-in sim) | https://nand2tetris.org |
| Wokwi | Arduino/ESP32 sim | ⚡ Instant | https://wokwi.com |
| Ben Eater | YouTube + kits | 🔧 Physical | https://eater.net |
| From the Transistor | Full stack curriculum | 🔧 Sim + Physical | https://github.com/geohot/fromthetransistor |
| Verilator | Local sim | ⏱️ Seconds | https://github.com/verilator/verilator |
| Tang Nano 9K | FPGA board | ⏱️ Minutes | ~$15 on AliExpress |

## Books (Reference, not primary learning)
- **"Code" by Charles Petzold** — Best intro, read like a novel
- **"The Elements of Computing Systems"** (Nand2Tetris textbook)
- **"Digital Design and Computer Architecture"** by Harris & Harris
- **"Computer Organization and Design"** by Patterson & Hennessy (RISC-V edition)

---

## The Meta-Principle

Geoffrey Huntley's core insight adapted for hardware:

> **Don't learn hardware by reading about hardware.**
> **Learn hardware by BUILDING hardware with the fastest possible feedback loop.**
> **Use LLMs as your on-demand tutor + code generator + debugger.**
> **The simulation error is your compiler error — it's the reinforcement signal.**
> **Write specs first, generate implementations second.**
> **Build your personal "stdlib" of prompts that reliably produce learning outcomes.**

Start HDLBits RIGHT NOW. First problem takes 30 seconds. Go.
→ https://hdlbits.01xz.net/wiki/step_one
