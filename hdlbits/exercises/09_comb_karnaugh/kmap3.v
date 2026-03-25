// ==========================================================================
// HDLBits — 4-variable (2)
// https://hdlbits.01xz.net/wiki/kmap3
// ==========================================================================
//
// Implement the circuit described by the Karnaugh map below.
//
// [Figure: Kmap3.png]
//
// *Try to simplify the k-map before coding it. Try both product-of-sums and
// sum-of-products forms. We can't check whether you have the optimal
// simplification of the k-map. But we can check if your reduction is
// equivalent, and we can check whether you can translate a k-map into a
// circuit.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Kmap3.png
//
//    4-variable Karnaugh Map (2):
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
//    (See the HDLBits page for the exact cell values)
//    Simplify to SOP or POS form.
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  a,
    input  b,
    input  c,
    input  d,
    output out
);

endmodule
