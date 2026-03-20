// ==========================================================================
// HDLBits — 4-variable (3)
// https://hdlbits.01xz.net/wiki/kmap4
// ==========================================================================
//
// Implement the circuit described by the Karnaugh map below.
//
// [Figure: Kmap4.png]
//
// *Try to simplify the k-map before coding it. Try both product-of-sums and
// sum-of-products forms. We can't check whether you have the optimal
// simplification of the k-map. But we can check if your reduction is
// equivalent, and we can check whether you can translate a k-map into a
// circuit.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Kmap4.png
//
//    4-variable Karnaugh Map (3):
//    Hint: output toggles when any single input changes
//  
//                cd
//            00   01   11   10
//          ┌─────┬─────┬─────┬─────┐
//    ab=00 │  0  │  1  │  0  │  1  │
//          ├─────┼─────┼─────┼─────┤
//    ab=01 │  1  │  0  │  1  │  0  │
//          ├─────┼─────┼─────┼─────┤
//    ab=11 │  0  │  1  │  0  │  1  │
//          ├─────┼─────┼─────┼─────┤
//    ab=10 │  1  │  0  │  1  │  0  │
//          └─────┴─────┴─────┴─────┘
//  
//    f = a ^ b ^ c ^ d  (4-input XOR)
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// For this function, changing the value of any one input always inverts the
// output. It is a simple logic function, but one that can't be easily
// expressed as SOP nor POS forms.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input a,
    input b,
    input c,
    input d,
    output out  );

endmodule
