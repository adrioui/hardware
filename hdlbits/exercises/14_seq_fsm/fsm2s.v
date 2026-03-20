// ==========================================================================
// HDLBits — Simple FSM 2 (synchronous reset)
// https://hdlbits.01xz.net/wiki/fsm2s
// ==========================================================================
//
// This is a Moore state machine with two states, two inputs, and one output.
// Implement this state machine.
//
// This exercise is the same as fsm2, but using synchronous reset.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Yes, there are ways to do this other than writing an FSM. But that wasn't
// the point of this exercise.Hint...
//
// This is a JK flip-flop.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input reset,    // Synchronous reset to OFF
    input j,
    input k,
    output out);
//  

    parameter OFF=0, ON=1; 
    reg state, next_state;

    always @(*) begin
        // State transition logic
    end

    always @(posedge clk) begin
        // State flip-flops with synchronous reset
    end

    // Output logic
    // assign out = (state == ...);

endmodule
