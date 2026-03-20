// ==========================================================================
// HDLBits — FSM: Sequence 1101 recognizer
// https://hdlbits.01xz.net/wiki/exams/review2015_fsmseq
// ==========================================================================
//
// *This is the second component in a series of five exercises that builds a
// complex counter out of several smaller circuits. See the final exercise for
// the overall design.*
//
// Build a finite-state machine that searches for the sequence 1101 in an input
// bit stream. When the sequence is found, it should set `start_shifting` to 1,
// forever, until reset. Getting stuck in the final state is intended to model
// going to other states in a bigger FSM that is not yet implemented. We will
// be extending this FSM in the next few exercises.
//
// { signal: [{ name: "clk",   wave: "p..............." },
// { name: "reset",          wave: "10............1." },
// { name: "data",           wave: "0.101....01.0.1." },
// { name: "start_shifting", wave: "0..........1...0" }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,      // Synchronous reset
    input data,
    output start_shifting);

endmodule
