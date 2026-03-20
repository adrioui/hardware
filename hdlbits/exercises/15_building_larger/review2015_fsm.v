// ==========================================================================
// HDLBits — FSM: The complete FSM
// https://hdlbits.01xz.net/wiki/exams/review2015_fsm
// ==========================================================================
//
// *This is the fourth component in a series of five exercises that builds a
// complex counter out of several smaller circuits. See the final exercise for
// the overall design.*
//
// You may wish to do FSM: Enable shift register and FSM: Sequence recognizer
// first.
//
// We want to create a timer that:
//
// • is started when a particular pattern (1101) is detected,
//
// • shifts in 4 more bits to determine the duration to delay,
//
// • waits for the counters to finish counting, and
//
// • notifies the user and waits for the user to acknowledge the timer.
//
// In this problem, implement just the finite-state machine that controls the
// timer. The data path (counters and some comparators) are not included here.
//
// The serial data is available on the `data` input pin. When the pattern 1101
// is received, the state machine must then assert output `shift_ena` for
// exactly 4 clock cycles.
//
// After that, the state machine asserts its `counting` output to indicate it
// is waiting for the counters, and waits until input `done_counting` is high.
//
// At that point, the state machine must assert `done` to notify the user the
// timer has timed out, and waits until input `ack` is 1 before being reset to
// look for the next occurrence of the start sequence (1101).
//
// The state machine should reset into a state where it begins searching for
// the input sequence 1101.
//
// Here is an example of the expected inputs and outputs. The 'x' states may be
// slightly confusing to read. They indicate that the FSM should not care about
// that particular input signal in that cycle. For example, once a 1101 pattern
// is detected, the FSM no longer looks at the `data` input until it resumes
// searching after everything else is done.
//
// { signal: [{ name: "clk",   wave: "p............................." },
// { name: "reset",          wave: "10............................" },
// { name: "data",           wave: "010.1.01x............1.01x...." },
// { name: "shift_ena",      wave: "0.......1...0............1...0" },
// { name: "counting",       wave: "0...........1....0...........1" },
// { name: "done_counting",  wave: "x...........0...1x...........0" },
// { name: "done",           wave: "0................1...0........" },
// { name: "ack",            wave: "x................0..1x........" }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_review2015_fsmonehot.png
//
//    FSM for review 2015 (one-hot):
//    (See the HDLBits page for exact state diagram)
//  
//    FSM with multiple states, used for both:
//    - review2015_fsm (complete FSM design)
//    - review2015_fsmonehot (one-hot logic equations)
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,      // Synchronous reset
    input data,
    output shift_ena,
    output counting,
    input done_counting,
    output done,
    input ack );

endmodule
