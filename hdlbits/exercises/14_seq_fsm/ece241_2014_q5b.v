// ==========================================================================
// HDLBits — Q5b: Serial two's complementer (Mealy FSM)
// https://hdlbits.01xz.net/wiki/exams/ece241_2014_q5b
// ==========================================================================
//
// The following diagram is a **Mealy** machine implementation of the 2's
// complementer.
// Implement using one-hot encoding.
//
// [Figure: Ece241_2014_q5b.png]
//
// {signal: [
// {name: "Input (x)", wave:  '0.101.0.'},
// {name: "Output (z)", wave: "0.1.0.1."}
// ],
// foot: { tock: ['LSB', '', '', '', '', '', '', 'MSB'] }
// }
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Ece241_2014_q5b.png
//
//    Mealy FSM - Serial two's complementer:
//  
//    ┌───────┐  x=0/0  ┌───────┐
//    │       │◄────────│       │
//    │   A   │         │   B   │
//    │       │────────►│       │
//    └───────┘  x=1/1  └───┬───┘
//         ▲                │
//         │   x=1/0        │ x=0/0
//         └────────────────┘
//  
//    Format: input/output (Mealy)
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input areset,
    input x,
    output z
);

endmodule
