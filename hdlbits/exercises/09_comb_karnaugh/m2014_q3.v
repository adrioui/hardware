// ==========================================================================
// HDLBits — Karnaugh map
// https://hdlbits.01xz.net/wiki/exams/m2014_q3
// ==========================================================================
//
// Consider the function *f* shown in the Karnaugh map below.
//
// [Figure: Exams_m2014q3.png]
//
// Implement this function. **d** is don't-care, which means you may choose to
// output whatever value is convenient.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_m2014q3.png
//
//    Karnaugh Map (exam question):
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

// I AM NOT DONE

module top_module (
    input [4:1] x,
    output f
);

endmodule
