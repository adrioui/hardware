// ==========================================================================
// HDLBits — 7420 chip
// https://hdlbits.01xz.net/wiki/7420
// ==========================================================================
//
// The 7400-series integrated circuits are a series of digital chips with a few
// gates each. The 7420 is a chip with two 4-input NAND gates.
//
// Create a module with the same functionality as the 7420 chip. It has 8
// inputs and 2 outputs.
//
// [Figure: 7420.png]
// **
// ***Expected solution length:** Around 2 lines.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: 7420.png
//
//    ┌───────────────────────────────────────────────┐
//    │  7420 chip (dual 4-input NAND)                │
//    │                                               │
//    │  p1a ──►┐                                     │
//    │  p1b ──►├──►[NAND]────────────────────► p1y   │
//    │  p1c ──►│                                     │
//    │  p1d ──►┘                                     │
//    │                                               │
//    │  p2a ──►┐                                     │
//    │  p2b ──►├──►[NAND]────────────────────► p2y   │
//    │  p2c ──►│                                     │
//    │  p2d ──►┘                                     │
//    │                                               │
//    │  p1y = ~(p1a & p1b & p1c & p1d)               │
//    │  p2y = ~(p2a & p2b & p2c & p2d)               │
//    └───────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// You need to drive two signals (`p1y` and `p2y`) with a value.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  p1a,
    p1b,
    p1c,
    p1d,
    output p1y,
    input  p2a,
    p2b,
    p2c,
    p2d,
    output p2y
);

endmodule
