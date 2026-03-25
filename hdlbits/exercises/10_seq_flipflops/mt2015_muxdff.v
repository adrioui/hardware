// ==========================================================================
// HDLBits — Mux and DFF
// https://hdlbits.01xz.net/wiki/mt2015_muxdff
// ==========================================================================
//
// Taken from ECE253 2015 midterm question 5
//
// Consider the sequential circuit below:
//
// [Figure: Mt2015_muxdff.png]
//
// Assume that you want to implement hierarchical Verilog code for this
// circuit, using three instantiations of a submodule that has a flip-flop and
// multiplexer in it. Write a Verilog module (containing one flip-flop and
// multiplexer) named `top_module` for this submodule.
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

// I AM NOT DONE

module top_module (
    input clk,
    input L,
    input r_in,
    input q_in,
    output reg Q
);

endmodule
