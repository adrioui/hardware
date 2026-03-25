// ==========================================================================
// HDLBits — If statement
// https://hdlbits.01xz.net/wiki/always_if
// ==========================================================================
//
// An `if` statement usually creates a 2-to-1 multiplexer, selecting one input
// if the condition is true, and the other input if the condition is false.
//
// [Figure: Always_if_mux.png]
//
// always @(*) begin
// if (condition) begin
// out = x;
// end
// else begin
// out = y;
// end
// end
//
// This is equivalent to using a continuous `assign`ment with a conditional
// operator:
//
// assign out = (condition) ? x : y;
//
// However, the procedural `if` statement provides a new way to make mistakes.
// The circuit is combinational only if `out` is always assigned a value.
//
// A bit of practice
//
// Build a 2-to-1 mux that chooses between `a` and `b`. Choose `b` if *both*
// `sel_b1` and `sel_b2` are true. Otherwise, choose `a`. Do the same twice,
// once using `assign` statements and once using a procedural if statement.
//
// sel_b1sel_b2out_assign
// out_always
// 00a
// 01a
// 10a
// 11b
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Always_if_mux.png
//
//    if statement = 2-to-1 multiplexer:
//
//    ┌─────────────────────────────────────────────┐
//    │                                             │
//    │         ┌────────┐                          │
//    │  a ────►│ 1      │                          │
//    │         │   MUX  ├──────────────────► out   │
//    │  b ────►│ 0      │                          │
//    │         └───┬────┘                          │
//    │             │                               │
//    │  sel ───────┘                               │
//    │                                             │
//    │  if (sel) out = a;                          │
//    │  else     out = b;                          │
//    └─────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

// synthesis verilog_input_version verilog_2001
module top_module (
    input a,
    input b,
    input sel_b1,
    input sel_b2,
    output wire out_assign,
    output reg out_always
);

endmodule
