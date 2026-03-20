// ==========================================================================
// HDLBits — Counter with period 1000
// https://hdlbits.01xz.net/wiki/exams/review2015_count1k
// ==========================================================================
//
// Build a counter that counts from 0 to 999, inclusive, with a period of 1000
// cycles. The reset input is synchronous, and should reset the counter to 0.
//
// { signal: [{ name: "clk", wave: "p..............." },
// { name: "reset", wave: "0............10." },
// { name: "q", wave:     "================", data: ['...',
// '990','991','992','993','994','995','996','997','998','999','0','1','2',
// "0", "1"] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,
    output [9:0] q);

endmodule
