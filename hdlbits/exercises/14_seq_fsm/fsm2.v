// ==========================================================================
// HDLBits — Simple FSM 2 (asynchronous reset)
// https://hdlbits.01xz.net/wiki/fsm2
// ==========================================================================
//
// This is a Moore state machine with two states, two inputs, and one output.
// Implement this state machine.
//
// This exercise is the same as fsm2s, but using asynchronous reset.
//
// [Figure: Fsmjk.png]
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Fsmjk.png
//
//    2-state Moore FSM (JK flip-flop style):
//
//                 j=0,k=0           j=0,k=0
//                   ┌──┐               ┌──┐
//                   │  ▼               │  ▼
//             ┌───────────┐      ┌───────────┐
//    reset───►│OFF (out=0)│      │ON  (out=1)│
//             └─────┬─────┘      └─────┬─────┘
//                   │   j=1 (set)      │
//                   ├──────────────────►│
//                   │   k=1 (reset)    │
//                   │◄─────────────────┤
//                   │   j=1,k=1(toggle)│
//                   │◄────────────────►│
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Yes, there are ways to do this other than writing an FSM. But that wasn't
// the point of this exercise.Hint...
//
// This is a JK flip-flop.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  clk,
    input  areset,  // Asynchronous reset to OFF
    input  j,
    input  k,
    output out
);
  //

  parameter OFF = 0, ON = 1;
  reg state, next_state;

  always @(*) begin
    // State transition logic
  end

  always @(posedge clk, posedge areset) begin
    // State flip-flops with asynchronous reset
  end

  // Output logic
  // assign out = (state == ...);

endmodule
