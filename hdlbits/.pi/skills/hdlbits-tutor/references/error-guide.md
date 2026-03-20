# HDLBits Error Diagnosis & Fix Guide

## Reading HDLBits Error Output

### "Hint: output X has Y values that differ"
Your module compiled and simulated, but produced wrong signal values.
- **Y values** = number of simulation timesteps where your output ≠ expected.
- Check the waveform viewer: compare your output row vs. the reference row.
- Red/mismatched sections show exactly when the divergence occurs.

### Compile Error Panel
Shown before simulation. Fix these first — no waveform is generated until the design compiles.

---

## Compile Errors

### Syntax Errors
```
Error: near "endmodule": syntax error
```
- Missing `;` at end of `assign`, port declaration, or statement.
- Mismatched `begin`/`end` — every `begin` needs a matching `end`.
- `always @` block missing sensitivity list or body.
- **Fix:** Read upward from the reported line — the real error is often a few lines above.

### Undeclared Wire / Reg
```
Error: 'foo' is not declared
```
- Signal used but never declared (`wire`, `reg`, or input/output).
- Typo in signal name (Verilog is case-sensitive: `Out` ≠ `out`).
- **Fix:** Declare all internal signals; verify exact spelling.

### Port Mismatch
```
Error: port width mismatch — expected 4 bits, got 1
```
- Connecting a scalar to a vector port or vice versa.
- HDLBits top-level port widths are fixed by the problem spec.
- **Fix:** Ensure your port declarations match the problem's module signature exactly.

### Mismatched begin/end
```
Error: syntax error near 'else'
```
- An `if` body with multiple statements but no `begin`/`end`.
- **Fix:** Wrap multi-statement bodies in `begin ... end`.

---

## Incorrect Results (Wrong Logic)

### Wrong Boolean Logic
- Verify operator precedence: `&` binds tighter than `|`; use parentheses.
- `~` is bitwise NOT; `!` is logical NOT (returns 1 bit). Mix-up causes subtle bugs.

### Off-by-One in Counters
- Counter reaches `N` instead of stopping at `N-1`: check `== N` vs `== N-1`.
- BCD counter: boundary condition must be `count == 9`, not `count == 10`.

### Missing Reset / Initial State
- Flip-flop outputs are `x` (unknown) at simulation start without reset.
- **Fix:** Always handle `reset` (or `areset`) to drive outputs to a known value.

### Wrong Bit Ordering
- HDLBits uses `[MSB:LSB]` (e.g., `[3:0]`). Reversing to `[0:3]` is legal but unusual and causes confusion.
- Part-select reversal: `byte[0:3]` ≠ `byte[3:0]`.

### Unsigned vs Signed Arithmetic
- By default, Verilog operands are unsigned.
- `$signed(in) >>> 1` for arithmetic right shift; `in >> 1` is logical (fills with 0).
- Comparisons: `8'hFF > 8'h01` is true unsigned, but if both are `$signed`, `8'hFF` = -1 < 1.

### Blocking vs Non-Blocking in Sequential Logic
- Using `=` (blocking) instead of `<=` (non-blocking) in clocked `always` blocks creates order-dependent behavior.
- **Fix:** Use `<=` in all `always @(posedge clk)` blocks; use `=` in `always @(*)` blocks.

---

## Simulation / Structural Errors

### Combinational Loops
```
Warning: combinational loop detected on signal 'out'
```
- A signal feeds back into its own combinational logic without a register.
- Simulation may hang or produce X values.
- **Fix:** Break the loop with a register (flip-flop) or redesign the logic.

### Inferred Latches (Missing Default / Else)
```
Warning: latch inferred for signal 'out'
```
- A combinational `always @(*)` block does not assign `out` in every code path.
- HDLBits treats latches as incorrect unless the problem specifically asks for one.
- **Fix:** Add a `default` to every `case`, and an `else` to every `if` in combinational blocks.

### Timing / Edge Issues in Testbenches
- Sampling outputs exactly at the clock edge can catch a value mid-transition.
- **Fix:** Sample outputs a small `#delay` after `posedge clk`, or use non-blocking reads.

---

## Common Gotchas by Category

| Category | Typical Mistake |
|---|---|
| Basics | Wrong operator; missing port in module header |
| Vectors | Bit-select out of range; wrong replication syntax `{N{x}}` |
| Modules | Port direction wrong (input vs output); unconnected ports left floating |
| Procedures | Using `assign` inside `always`, or `<=` in combinational block |
| More Features | Forgetting `$signed` for signed ops; wrong `generate` syntax |
| Flip-Flops | Async vs sync reset mixed up; missing enable path |
| Counters | Off-by-one; counter doesn't reset on terminal count |
| Shift Registers | Shift direction reversed; LFSR tap positions wrong |
| FSMs | Missing `default` state; Mealy outputs not updated on input change; state never reaches accepting state |
| Karnaugh Maps | Grouping errors; not minimizing fully; wrong SOP/POS form |
| Verification | Testbench clock not toggling; stimulus applied before reset deasserts |
