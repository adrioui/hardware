// ==========================================================================
// HDLBits — XNOR gate
// https://hdlbits.01xz.net/wiki/xnorgate
// ==========================================================================
//
// Create a module that implements an XNOR gate.
//
// [Figure: Xnorgate.png]
// **
// ***Expected solution length:** Around 1 line.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Xnorgate.png
//
//    ┌──────────────────────────────────────────┐
//    │  top_module                              │
//    │                    ┌────┐                │
//    │  a ───────────────►│XNOR├──o───────► out │
//    │  b ───────────────►│    │                │
//    │                    └────┘                │
//    └──────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// The bitwise-XOR operator is `^`. There is no logical-XOR operator.
// ──────────────────────────────────────────────────────────────────────────


module top_module( 
    input a, 
    input b, 
    output out );
    assign out = !(a ^ b);
endmodule
