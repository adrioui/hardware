// ==========================================================================
// HDLBits — Four-bit binary counter
// https://hdlbits.01xz.net/wiki/count15
// ==========================================================================
//
// Build a 4-bit binary counter that counts from 0 through 15, inclusive, with
// a period of 16. The reset input is synchronous, and should reset the counter
// to 0.
//
// { signal: [{ name: "clk", wave: "p..............." },
// { name: "reset", wave: "0............10." },
// { name: "q", wave:     "================", data: ['5',
// '6','7','8','9','a','b','c','d','e','f','0','1','2', "0", "1"] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,      // Synchronous active-high reset
    output [3:0] q);

endmodule
