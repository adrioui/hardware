// ==========================================================================
// HDLBits — Design a Moore FSM
// https://hdlbits.01xz.net/wiki/exams/ece241_2013_q4
// ==========================================================================
//
// Also include an active-high synchronous reset that resets the state machine
// to a state equivalent to if the water level had been low for a long time (no
// sensors asserted, and all four outputs asserted).
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,
    input [3:1] s,
    output fr3,
    output fr2,
    output fr1,
    output dfr
);

endmodule
