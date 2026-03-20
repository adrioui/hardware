// ==========================================================================
// HDLBits — Q6b: FSM next-state logic
// https://hdlbits.01xz.net/wiki/exams/m2014_q6b
// ==========================================================================
//
// Consider the state machine shown below, which has one input *w* and one
// output *z*.
//
// [Figure: Exams_m2014q6.png]
//
// Assume that you wish to implement the FSM using three flip-flops and state
// codes *y[3:1] =*
// 000, 001, ... , 101 for states A, B, ... , F, respectively. Show a state-
// assigned table for this FSM.
// Derive a next-state expression for the flip-flop *y[2]*.
//
// Implement just the next-state logic for *y[2]*. (This is much more a FSM
// question than a Verilog coding question. Oh well.)
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_m2014q6.png
//
//    FSM state diagram (exam Q6):
//    (See the HDLBits page for exact state transitions)
//  
//    Multiple states with transitions based on w input.
//    One-hot encoding version also required.
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input [3:1] y,
    input w,
    output Y2);

endmodule
