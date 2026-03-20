// ==========================================================================
// HDLBits — 3-bit LFSR
// https://hdlbits.01xz.net/wiki/mt2015_lfsr
// ==========================================================================
//
// Taken from 2015 midterm question 5. See also the first part of this
// question: mt2015_muxdff
//
// [Figure: Mt2015_muxdff.png]
//
// Write the Verilog code for this sequential circuit (Submodules are ok, but
// the top-level must be named `top_module`). Assume that you are going to
// implement the circuit on the DE1-SoC board. Connect the `R` inputs to the
// `SW` switches, connect Clock to `KEY[0]`, and `L` to `KEY[1]`. Connect the
// `Q` outputs to the red lights `LEDR`.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Mt2015_muxdff.png
//
//    Mux + DFF submodule:
//  
//             ┌──────┐   ┌──────┐
//    d ──────►│ 0    │   │      │
//             │ MUX  ├──►│D    Q├──┬──► q
//    r ──────►│ 1    │   │      │  │
//             └──┬───┘   │  >   │  │
//                │       └──┬───┘  │
//    sel ────────┘          │      │
//                           │      │
//    clk ───────────────────┘      │
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// This circuit is an example of a Linear Feedback Shift Register (LFSR). A
// maximum-period LFSR can be used to generate pseudorandom numbers, as it
// cycles through 2n-1 combinations before repeating. The all-zeros combination
// does not appear in this sequence.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
	input [2:0] SW,      // R
	input [1:0] KEY,     // L and clk
	output [2:0] LEDR);  // Q

endmodule
