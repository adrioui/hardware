// ==========================================================================
// HDLBits — Mux and DFF (exam)
// https://hdlbits.01xz.net/wiki/exams/2014_q4a
// ==========================================================================
//
// Consider the *n*-bit shift register circuit shown below:
//
// [Figure: Exams_2014q4.png]
//
// Write a Verilog module named top_module for one stage of this circuit,
// including both the flip-flop and multiplexers.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_2014q4.png
//
//    Mux + DFF circuit (exam question):
//
//             ┌──────┐   ┌──────┐
//    d ──────►│ 0    │   │      │
//             │ MUX  ├──►│D    Q├──┬──► q
//    ? ──────►│ 1    │   │      │  │
//             └──┬───┘   │  >   │  │
//                │       └──┬───┘  │
//    sel ────────┘          │      │
//    clk ───────────────────┘      │
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  clk,
    input  w,
    R,
    E,
    L,
    output Q
);

endmodule
