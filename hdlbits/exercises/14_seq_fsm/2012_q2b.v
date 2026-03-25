// ==========================================================================
// HDLBits — Q2b: One-hot FSM equations
// https://hdlbits.01xz.net/wiki/exams/2012_q2b
// ==========================================================================
//
// The state diagram for this question is shown again below.
//
// [Figure: Exams_2012q2.png]
//
// Assume that a one-hot code is used with the state assignment
// *y[5:0]* = 000001(A), 000010(B), 000100(C), 001000(D), 010000(E), 100000(F)
//
// Write a logic expression for the signal *Y1*, which is the input of state
// flip-flop *y[1]*.
//
// Write a logic expression for the signal *Y3*, which is the input of state
// flip-flop *y[3]*.
//
// (Derive the logic equations by inspection assuming a one-hot encoding. The
// testbench will test with non-one hot inputs to make sure you're not trying
// to do something more complicated).
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
// HINT:
// Logic equations for one-hot state transition logic can be derived by looking
// at in-edges of the state transition diagram.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input [5:0] y,
    input w,
    output Y1,
    output Y3
);

endmodule
