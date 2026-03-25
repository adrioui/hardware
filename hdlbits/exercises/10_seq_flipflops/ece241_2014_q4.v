// ==========================================================================
// HDLBits — DFFs and gates
// https://hdlbits.01xz.net/wiki/exams/ece241_2014_q4
// ==========================================================================
//
// Given the finite state machine circuit as shown, assume that the D flip-
// flops are initially reset to zero before the machine begins.
//
// Build this circuit.
//
// [Figure: Ece241_2014_q4.png]
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Ece241_2014_q4.png
//
//    DFFs and gates:
//
//        ┌─────┐    ┌──────┐    ┌─────┐    ┌──────┐
//    x──►│ XOR ├───►│D    Q├───►│ XOR ├───►│D    Q├──►z
//        └──┬──┘    │  >   │    └──┬──┘    │  >   │
//           │       └──┬───┘       │       └──┬───┘
//           │          │           │           │
//           └──────────┘           └───────────┘
//                (feedback)            (feedback)
//    clk ─────────────┴───────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Be careful with the reset state. Ensure that each D flip-flop's Q output is
// really the inverse of its Q output, even before the first clock edge of the
// simulation.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  clk,
    input  x,
    output z
);

endmodule
