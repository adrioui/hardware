// ==========================================================================
// HDLBits — Q2a: FSM
// https://hdlbits.01xz.net/wiki/exams/2012_q2fsm
// ==========================================================================
//
// Consider the state diagram shown below.
//
// [Figure: Exams_2012q2.png]
//
// Write complete Verilog code that represents this FSM. Use separate
// **always** blocks for the state
// table and the state flip-flops, as done in lectures. Describe the FSM
// output, which is called *z*,
// using either continuous assignment statement(s) or an **always** block (at
// your discretion). Assign
// any state codes that you wish to use.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_2012q2.png
//
//    FSM diagram (exam 2012 Q2):
//    (See the HDLBits page for exact state transitions)
//  
//    State machine with multiple states.
//    Used for both Q2a (FSM) and Q2b (one-hot equations).
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,   // Synchronous active-high reset
    input w,
    output z
);

endmodule
