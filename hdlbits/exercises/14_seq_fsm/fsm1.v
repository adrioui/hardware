// ==========================================================================
// HDLBits — Simple FSM 1 (asynchronous reset)
// https://hdlbits.01xz.net/wiki/fsm1
// ==========================================================================
//
// This is a Moore state machine with two states, one input, and one output.
// Implement this state machine. Notice that the reset state is B.
//
// This exercise is the same as fsm1s, but using asynchronous reset.
//
// [Figure: Fsm1.png]
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Fsm1.png
//
//    Moore FSM (2 states, async reset to B):
//  
//                         in=1
//                  ┌────────────────────┐
//                  │     in=0           ▼
//            ┌─────┴─────┐        ┌───────────┐
//    reset──►│ B (out=1) │◄──────│ A (out=0) │
//            └───────────┘  in=0  └─────┬─────┘
//                                       │ in=1
//                                       └──┐
//                                          │
//                                  ┌───────┘
//                                  ▼
//                            ┌───────────┐
//                            │ B (out=1) │
//                            └───────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Yes, there are ways to do this other than writing an FSM. But that wasn't
// the point of this exercise.Hint...
//
// This is a TFF with the T input inverted.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input areset,    // Asynchronous reset to state B
    input in,
    output out);
//  

    parameter A=0, B=1; 
    reg state, next_state;

    always @(*) begin    // This is a combinational always block
        // State transition logic
    end

    always @(posedge clk, posedge areset) begin    // This is a sequential always block
        // State flip-flops with asynchronous reset
    end

    // Output logic
    // assign out = (state == ...);

endmodule
