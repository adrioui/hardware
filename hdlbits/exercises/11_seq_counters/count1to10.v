// ==========================================================================
// HDLBits — Decade counter again
// https://hdlbits.01xz.net/wiki/count1to10
// ==========================================================================
//
// Make a decade counter that counts 1 through 10, inclusive. The reset input
// is synchronous, and should reset the counter to 1.
//
// { signal: [{ name: "clk", wave: "p......." },
// { name: "reset", wave: "10...10." },
// { name: "q", wave: "x=======", data: ["1", "2", "3", "4", "5", "1", "2"] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,
    output [3:0] q
);

endmodule
