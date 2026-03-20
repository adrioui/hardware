// ==========================================================================
// HDLBits — Decade counter
// https://hdlbits.01xz.net/wiki/count10
// ==========================================================================
//
// Build a decade counter that counts from 0 through 9, inclusive, with a
// period of 10. The reset input is synchronous, and should reset the counter
// to 0.
//
// { signal: [{ name: "clk", wave: "p..............." },
// { name: "reset", wave: "10...........10." },
// { name: "q", wave:     "x===============", data:
// ['0','1','2','3','4','5','6','7','8','9','0','1','2', "0", "1"] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,        // Synchronous active-high reset
    output [3:0] q);

endmodule
