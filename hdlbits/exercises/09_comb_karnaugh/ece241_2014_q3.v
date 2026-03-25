// ==========================================================================
// HDLBits — K-map implemented with a multiplexer
// https://hdlbits.01xz.net/wiki/exams/ece241_2014_q3
// ==========================================================================
//
// For the following Karnaugh map, give the circuit implementation using one
// 4-to-1 multiplexer and as many 2-to-1 multiplexers as required, but using as
// few as possible. You are not allowed to use any other logic gate and you
// must use *a* and *b* as the multiplexer selector inputs, as shown on the
// 4-to-1 multiplexer below.
//
// You are implementing just the portion labelled **top_module**, such that the
// entire circuit (including the 4-to-1 mux) implements the K-map.
//
// [Figure: Ece241_2014_q3.png]
//
// [Figure: Ece241_2014_q3mux.png]
//
// (The requirement to use only 2-to-1 multiplexers exists because the original
// exam question also wanted to test logic function simplification using K-maps
// and how to synthesize logic functions using only multiplexers. If you wish
// to treat this as purely a Verilog exercise, you may ignore this constraint
// and write the module any way you wish.)
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Ece241_2014_q3.png
//
//    K-map for implementation with multiplexer:
//
//                cd
//            00   01   11   10
//          ┌─────┬─────┬─────┬─────┐
//    ab=00 │     │     │     │     │
//          ├─────┼─────┼─────┼─────┤
//    ab=01 │     │     │     │     │
//          ├─────┼─────┼─────┼─────┤
//    ab=11 │     │     │     │     │
//          ├─────┼─────┼─────┼─────┤
//    ab=10 │     │     │     │     │
//          └─────┴─────┴─────┴─────┘
//
//    (See the HDLBits page for exact values)
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Ece241_2014_q3mux.png
//
//    Multiplexer implementation of K-map:
//
//    c ──────►┌──────────┐
//    d ──────►│ 4-to-1   │
//             │   MUX    ├──────────► mux_in[ab]
//    mux_in──►│          │
//             └──────────┘
//
//    mux_in values depend on ab: connect to 0, 1, c, d, ~c, ~d
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input c,
    input d,
    output [3:0] mux_in
);

endmodule
