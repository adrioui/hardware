// ==========================================================================
// HDLBits — The complete timer
// https://hdlbits.01xz.net/wiki/exams/review2015_fancytimer
// ==========================================================================
//
// *This is the fifth component in a series of five exercises that builds a
// complex counter out of several smaller circuits. You may wish to do the four
// previous exercises first (counter, sequence recognizer FSM, FSM delay, and
// combined FSM).*
//
// We want to create a timer with one input that:
//
// • is started when a particular input pattern (1101) is detected,
//
// • shifts in 4 more bits to determine the duration to delay,
//
// • waits for the counters to finish counting, and
//
// • notifies the user and waits for the user to acknowledge the timer.
//
// The serial data is available on the `data` input pin. When the pattern 1101
// is received, the circuit must then shift in the next 4 bits, most-
// significant-bit first. These 4 bits determine the duration of the timer
// delay. I'll refer to this as the `delay[3:0]`.
//
// After that, the state machine asserts its `counting` output to indicate it
// is counting. The state machine must count for exactly `(delay[3:0] + 1) *
// 1000` clock cycles. e.g., delay=0 means count 1000 cycles, and delay=5 means
// count 6000 cycles. Also output the current remaining time. This should be
// equal to `delay` for 1000 cycles, then `delay-1` for 1000 cycles, and so on
// until it is 0 for 1000 cycles. When the circuit isn't counting, the
// count[3:0] output is don't-care (whatever value is convenient for you to
// implement).
//
// At that point, the circuit must assert `done` to notify the user the timer
// has timed out, and waits until input `ack` is 1 before being reset to look
// for the next occurrence of the start sequence (1101).
//
// The circuit should reset into a state where it begins searching for the
// input sequence 1101.
//
// Here is an example of the expected inputs and outputs. The 'x' states may be
// slightly confusing to read. They indicate that the FSM should not care about
// that particular input signal in that cycle. For example, once the 1101 and
// delay[3:0] have been read, the circuit no longer looks at the `data` input
// until it resumes searching after everything else is done. In this example,
// the circuit counts for 2000 clock cycles because the delay[3:0] value was
// 4'b0001. The last few cycles starts another count with delay[3:0] = 4'b1110,
// which will count for 15000 cycles.
//
// { signal: [{ name: "clk",   wave: "p...............|.................." },
// { name: "reset",          wave: "10..............|.................." },
// { name: "data",           wave: "010.1.010..1x...|........1.01...0x." },
// { name: "count[3:0]",     wave: "x...........=...|=...x...........=.", data:
// ['1', '0', 'e'] },
// { name: "counting",       wave: "0...........1...|....0...........1." },
// { name: "done",           wave: "0...............|....1...0........." },
// { name: "ack",            wave: "x...............|....0..1x........." }
// ],
// foot: { tock:['','','','','','','','','','','','','0','1','2','3','...','199
// 6','','','1999','','','','','','','','','','','','','0','1'] }
// }
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// The hardware should be approximately the FSM from Exams/review2015_fsm, the
// counter from Exams/review2015_count1k, and the shift register+counter from
// Exams/review2015_shiftcount. You'll probably need a few more comparators
// here.
//
// It's ok to have all the code in a single module if the components are in
// their own always blocks, as long as it's clear which blob of code
// corresponds to which hardware block. Don't merge multiple always blocks
// together, as that's hard to read and error-prone.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input        clk,
    input        reset,     // Synchronous reset
    input        data,
    output [3:0] count,
    output       counting,
    output       done,
    input        ack
);

endmodule
