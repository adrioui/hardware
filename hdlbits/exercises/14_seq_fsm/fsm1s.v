// ==========================================================================
// HDLBits — Simple FSM 1 (synchronous reset)
// https://hdlbits.01xz.net/wiki/fsm1s
// ==========================================================================
//
// This is a Moore state machine with two states, one input, and one output.
// Implement this state machine. Notice that the reset state is B.
//
// This exercise is the same as fsm1, but using synchronous reset.
//
// [Figure: Fsm1s.png]
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Fsm1s.png
//
//    Moore FSM (2 states, synchronous reset to B):
//
//                         in=1
//                  ┌────────────────────┐
//                  │     in=0           ▼
//            ┌─────┴─────┐        ┌───────────┐
//    reset──►│ B (out=1) │◄──────│ A (out=0) │──┐
//            └───────────┘  in=0  └───────────┘  │
//                                      ▲  in=1   │
//                                      └─────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Yes, there are ways to do this other than writing an FSM. But that wasn't
// the point of this exercise.Hint...
//
// This is a TFF with the T input inverted.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

// Note the Verilog-1995 module declaration syntax here:
module top_module(clk, reset, in, out);
    input clk;
    input reset;    // Synchronous reset to state B
    input in;
    output out;
//
    reg out;

    // Fill in state name declarations

    reg present_state, next_state;

    always @(posedge clk) begin
        if (reset) begin
            // Fill in reset logic
        end else begin
            case (present_state)
                // Fill in state transition logic
            endcase

            // State flip-flops
            present_state = next_state;

            case (present_state)
                // Fill in output logic
            endcase
        end
    end

endmodule
