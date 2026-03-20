// ==========================================================================
// HDLBits — 12-hour clock
// https://hdlbits.01xz.net/wiki/count_clock
// ==========================================================================
//
// Create a set of counters suitable for use as a 12-hour clock (with am/pm
// indicator). Your counters are clocked by a fast-running `clk`, with a pulse
// on `ena` whenever your clock should increment (i.e., once per second).
//
// `reset` resets the clock to 12:00 AM. `pm` is 0 for AM and 1 for PM. `hh`, `mm`, and `ss` are two **BCD** (Binary-Coded Decimal) digits each for hours (01-12), minutes (00-59), and seconds (00-59). Reset has higher priority than enable, and can occur even when not enabled.
//
// The following timing diagram shows the rollover behaviour from `11:59:59 AM`
// to `12:00:00 PM` and the synchronous reset and enable behaviour.
//
// { signal: [{ name: "clk", wave: "p........" },
// { name: "reset", wave: "0...10..." },
// { name: "ena", wave:   "1...x1.0." },
// { name: "pm", wave: "0..1.0...", data: ["57", "58", "59", "00", "01", "00",
// "01", "02" ] },
// { name: "hh[7:0]", wave: "=..=.....", data: ["8'h11", "8'h12"] },
// { name: "mm[7:0]", wave: "=..=.....", data: ["8'h59", "8'h00"] },
// { name: "ss[7:0]", wave: "========.", data: ["8'h57", "8'h58", "8'h59",
// "8'h00", "8'h01", "8'h00", "8'h01", "8'h02" ] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Note that `11:59:59 PM` advances to `12:00:00 AM`, and `12:59:59 PM`
// advances to `01:00:00 PM`. There is no 00:00:00.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input reset,
    input ena,
    output pm,
    output [7:0] hh,
    output [7:0] mm,
    output [7:0] ss);

endmodule
