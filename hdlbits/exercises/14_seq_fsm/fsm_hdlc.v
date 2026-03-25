// ==========================================================================
// HDLBits — Sequence recognition
// https://hdlbits.01xz.net/wiki/fsm_hdlc
// ==========================================================================
//
// Synchronous HDLC framing involves decoding a continuous bit stream of data
// to look for bit patterns that indicate the beginning and end of frames
// (packets). Seeing exactly 6 consecutive 1s (i.e., `01111110`) is a "flag"
// that indicate frame boundaries. To avoid the data stream from accidentally
// containing "flags", the sender inserts a zero after every 5 consecutive 1s
// which the receiver must detect and discard. We also need to signal an error
// if there are 7 or more consecutive 1s.
//
// Create a finite state machine to recognize these three sequences:
//
// • `0111110`: Signal a bit needs to be discarded (`disc`).
//
// • `01111110`: Flag the beginning/end of a frame (`flag`).
//
// • `01111111...`: Error (7 or more 1s) (`err`).
//
// When the FSM is reset, it should be in a state that behaves as though the
// previous input were 0.
//
// Here are some example sequences that illustrate the desired operation.
//
// Discard `0111110`:
//
// { signal: [{ name: "clk", wave: "p.........." },
// { name: "in", wave:   "x01....0x..", node:".......a..." },
// { name: "disc", wave: "0.......10.", node:"........b.." },
// { name: "flag", wave: "0.........." },
// { name: "err", wave: "0.........." },
// ], edge: [ 'a-~>b']
// }
//
// Flag `01111110`:
//
// { signal: [{ name: "clk", wave: "p..........." },
// { name: "in", wave:   "x01.....0x..", node:"........a..." },
// { name: "disc", wave: "0..........." },
// { name: "flag", wave: "0........10.", node:".........b.." },
// { name: "err", wave: "0..........." },
// ], edge: [ 'a-~>b']
// }
//
// Reset behaviour and error `01111111...`:
//
// { signal: [{ name: "clk", wave: "p.............." },
// { name: "reset", wave:"x10.......|...." },
// { name: "in", wave:   "x.1.......|.0x.", node:"........a...c." },
// { name: "disc", wave: "0.........|...." },
// { name: "flag", wave: "0.........|...." },
// { name: "err",  wave: "0........1|..0.", node:".........b...d." },
// ], edge: [ 'a-~>b', 'c-~>d']
// }
//
// Implement this state machine.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Fsm_hdlc.png
//
//    HDLC Framing FSM:
//    Detect: 0111110 (disc), 01111110 (flag), 01111111... (err)
//
//    ┌────┐ 1 ┌────┐ 1 ┌────┐ 1 ┌────┐ 1 ┌────┐ 1 ┌────┐
//    │ S0 ├──►│ S1 ├──►│ S2 ├──►│ S3 ├──►│ S4 ├──►│ S5 │
//    └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘
//       │0       │0       │0       │0       │0       │
//       ▼        ▼        ▼        ▼        ▼        │
//      S0       S0    (back to S0)                 1│    │0
//                                                   ▼    ▼
//    After 5 ones:                               ┌────┐┌──────┐
//      +0  → disc (discard)                      │ S6 ││disc  │
//      +10 → flag (frame boundary)               └──┬─┘└──────┘
//      +11... → err (error)                         │
//                                                1│ │0
//                                                 ▼  ▼
//                                              ┌────┐┌──────┐
//                                              │err ││flag  │
//                                              └────┘└──────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Use a Moore state machine with around 10 states.
// Hint...
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  clk,
    input  reset,  // Synchronous reset
    input  in,
    output disc,
    output flag,
    output err
);

endmodule
