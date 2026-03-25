// ==========================================================================
// HDLBits — More replication
// https://hdlbits.01xz.net/wiki/vector5
// ==========================================================================
//
// Given five 1-bit signals (a, b, c, d, and e), compute all 25 pairwise one-
// bit comparisons in the 25-bit output vector. The output should be 1 if the
// two bits being compared are equal.
//
// out[24] = ~a ^ a;   // a == a, so out[24] is always 1.
// out[23] = ~a ^ b;
// out[22] = ~a ^ c;
// ...
// out[ 1] = ~e ^ d;
// out[ 0] = ~e ^ e;
//
// [Figure: Vector5.png]
//
// As the diagram shows, this can be done more easily using the replication and
// concatenation operators.
//
// • The top vector is a concatenation of 5 repeats of each input
//
// • The bottom vector is 5 repeats of a concatenation of the 5 inputs
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Vector5.png
//
//    Replication operator:  {num{vector}}
//
//    {5{1'b1}}         = 5'b11111
//    {2{a,b,c}}        = {a,b,c,a,b,c}
//    {3'd5, {2{3'd6}}} = 9'b101_110_110
//
//    Sign extension example:
//    ┌─────────────────────────────────────────────────┐
//    │  wire [7:0] a;                                  │
//    │  wire [23:0] b = {{16{a[7]}}, a};               │
//    │                   ▲                             │
//    │        sign bit replicated 16 times             │
//    └─────────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────


module top_module (
    input a,
    b,
    c,
    d,
    e,
    output [24:0] out
);
  assign out = ~{{5{a}}, {5{b}}, {5{c}}, {5{d}}, {5{e}}} ^ {5{a, b, c, d, e}};
endmodule
