// ==========================================================================
// HDLBits — 4-digit decimal counter
// https://hdlbits.01xz.net/wiki/countbcd
// ==========================================================================
//
// Build a 4-digit BCD (binary-coded decimal) counter. Each decimal digit is
// encoded using 4 bits: q[3:0] is the ones digit, q[7:4] is the tens digit,
// etc. For digits [3:1], also output an enable signal indicating when each of
// the upper three digits should be incremented.
//
// You may want to instantiate or modify some one-digit decade counters.
//
// { signal: [{ name: "clk", wave: "p......." },
// { name: "reset", wave: "0...10.." },
// { name: "q[3:0]", wave: "========", data: ["7", "8", "9", "0", "1", "0",
// "1", "2", ] },
// { name: "ena[1]", wave: "0.10...." },
// { name: "q[7:4]", wave: "=..=.=..", data: [ "5", "6", "0" ] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,   // Synchronous active-high reset
    output [3:1] ena,
    output [15:0] q);

endmodule
