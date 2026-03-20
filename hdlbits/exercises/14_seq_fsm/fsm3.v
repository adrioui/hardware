// ==========================================================================
// HDLBits — Simple FSM 3 (asynchronous reset)
// https://hdlbits.01xz.net/wiki/fsm3
// ==========================================================================
//
// See also: State transition logic for this FSM
//
// The following is the state transition table for a Moore state machine with
// one input, one output, and four states. Implement this state machine.
// Include an asynchronous reset that resets the FSM to state A.
//
// StateNext stateOutput
// in=0in=1
// AAB0
// BCB0
// CAD0
// DCB1
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Fsm3.png
//
//    4-state Moore FSM:
//  
//    State transition table:
//    ┌───────┬──────────────┬────────┐
//    │ State │  Next state  │ Output │
//    │       │ in=0 │ in=1  │  out   │
//    ├───────┼──────┼───────┼────────┤
//    │   A   │  A   │   B   │   0    │
//    │   B   │  C   │   B   │   0    │
//    │   C   │  A   │   D   │   0    │
//    │   D   │  C   │   B   │   1    │
//    └───────┴──────┴───────┴────────┘
//  
//           in=0    in=1    in=0
//     ┌──►A ────► B ────► ? ────► ...
//     │  out=0
//    reset
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input in,
    input areset,
    output out);
//

    // State transition logic

    // State flip-flops with asynchronous reset

    // Output logic

endmodule
