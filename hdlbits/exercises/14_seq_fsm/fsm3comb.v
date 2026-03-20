// ==========================================================================
// HDLBits — Simple state transitions 3
// https://hdlbits.01xz.net/wiki/fsm3comb
// ==========================================================================
//
// The following is the state transition table for a Moore state machine with
// one input, one output, and four states. Use the following state encoding:
// A=2'b00, B=2'b01, C=2'b10, D=2'b11.
//
// **Implement only the state transition logic and output logic** (the
// combinational logic portion) for this state machine. Given the current state
// (`state`), compute the `next_state` and output (`out`) based on the state
// transition table.
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
    input in,
    input [1:0] state,
    output [1:0] next_state,
    output out);
//

    parameter A=0, B=1, C=2, D=3;

    // State transition logic: next_state = f(state, in)

    // Output logic:  out = f(state) for a Moore state machine

endmodule
