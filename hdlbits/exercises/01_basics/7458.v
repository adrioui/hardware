// ==========================================================================
// HDLBits — 7458 chip
// https://hdlbits.01xz.net/wiki/7458
// ==========================================================================
//
// The 7458 is a chip with four AND gates and two OR gates. This problem is
// slightly more complex than 7420.
//
// Create a module with the same functionality as the 7458 chip. It has 10
// inputs and 2 outputs. You may choose to use an `assign` statement to drive
// each of the output wires, or you may choose to declare (four) wires for use
// as intermediate signals, where each internal wire is driven by the output of
// one of the AND gates. For extra practice, try it both ways.
//
// [Figure: 7458.png]
// **
// ***Expected solution length:** Around 2–10 lines.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: 7458.png
//
//    ┌─────────────────────────────────────────────────────────┐
//    │  7458 chip                                              │
//    │                                                         │
//    │  p1a ──►┐                                               │
//    │  p1b ──►├──►[AND]──┐                                    │
//    │  p1c ──►┘          ├──►[OR]──────────────────────► p1y  │
//    │  p1d ──►┐          │                                    │
//    │  p1e ──►├──►[AND]──┘                                    │
//    │  p1f ──►┘                                               │
//    │                                                         │
//    │  p2a ──►┐                                               │
//    │         ├──►[AND]──┐                                    │
//    │  p2b ──►┘          ├──►[OR]──────────────────────► p2y  │
//    │  p2c ──►┐          │                                    │
//    │         ├──►[AND]──┘                                    │
//    │  p2d ──►┘                                               │
//    │                                                         │
//    │  p1y = (p1a & p1b & p1c) | (p1d & p1e & p1f)            │
//    │  p2y = (p2a & p2b) | (p2c & p2d)                        │
//    └─────────────────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// You need to drive two signals (`p1y` and `p2y`) with a value.
// ──────────────────────────────────────────────────────────────────────────


module top_module ( 
    input p1a, p1b, p1c, p1d, p1e, p1f,
    output p1y,
    input p2a, p2b, p2c, p2d,
    output p2y );
    assign p1y = (p1a & p1b & p1c) | (p1d & p1e & p1f);
    assign p2y = (p2a & p2b) | (p2c & p2d);
endmodule
