// ==========================================================================
// HDLBits — Karnaugh map (2)
// https://hdlbits.01xz.net/wiki/exams/2012_q1g
// ==========================================================================
//
// Consider the function *f* shown in the Karnaugh map below. Implement this
// function.
//
// (The original exam question asked for simplified SOP and POS forms of the
// function.)
//
// [Figure: Exams_2012q1g.png]
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_2012q1g.png
//
//    Karnaugh Map (exam 2012):
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
//    (See the HDLBits page for exact cell values)
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Be careful of the ordering of the x[4:1] input bits in the Karnaugh map.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input [4:1] x,
    output f
);

endmodule
