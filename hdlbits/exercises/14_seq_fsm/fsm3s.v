// ==========================================================================
// HDLBits — Simple FSM 3 (synchronous reset)
// https://hdlbits.01xz.net/wiki/fsm3s
// ==========================================================================
//
// See also: State transition logic for this FSM
//
// The following is the state transition table for a Moore state machine with
// one input, one output, and four states. Implement this state machine.
// Include a synchronous reset that resets the FSM to state A. (This is the
// same problem as Fsm3 but with a synchronous reset.)
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
    input reset,
    output out);
//

    // State transition logic

    // State flip-flops with synchronous reset

    // Output logic

endmodule
