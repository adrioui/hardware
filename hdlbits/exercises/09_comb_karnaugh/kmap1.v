// ==========================================================================
// HDLBits — 3-variable
// https://hdlbits.01xz.net/wiki/kmap1
// ==========================================================================
//
// Implement the circuit described by the Karnaugh map below.
//
// [Figure: Kmap1.png]
//
// *Try to simplify the k-map before coding it. Try both product-of-sums and
// sum-of-products forms. We can't check whether you have the optimal
// simplification of the k-map. But we can check if your reduction is
// equivalent, and we can check whether you can translate a k-map into a
// circuit.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Kmap1.png
//
//    3-variable Karnaugh Map:
//  
//              ab
//          00  01  11  10
//        ┌────┬────┬────┬────┐
//    c=0 │    │    │    │    │
//        ├────┼────┼────┼────┤
//    c=1 │    │    │    │    │
//        └────┴────┴────┴────┘
//  
//    (See the HDLBits page for the exact cell values)
//    Simplify using K-map grouping.
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input a,
    input b,
    input c,
    output out  );

endmodule
