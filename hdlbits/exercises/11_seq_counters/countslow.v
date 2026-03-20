// ==========================================================================
// HDLBits — Slow decade counter
// https://hdlbits.01xz.net/wiki/countslow
// ==========================================================================
//
// Build a decade counter that counts from 0 through 9, inclusive, with a
// period of 10. The reset input is synchronous, and should reset the counter
// to 0. We want to be able to pause the counter rather than always
// incrementing every clock cycle, so the `slowena` input indicates when the
// counter should increment.
//
// { signal: [{ name: "clk", wave: "p................" },
// { name: "reset", wave:   "10...........10.." },
// { name: "slowena", wave: "10.10.10.10.10.10" },
// { name: "q", wave:       "x=..=..=..=..==.=", data:
// ['0','1','2','3','4','0', '1'] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// This is a regular decade counter with an enable control signal
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input slowena,
    input reset,
    output [3:0] q);

endmodule
