// ==========================================================================
// HDLBits — Vector reversal 1
// https://hdlbits.01xz.net/wiki/vectorr
// ==========================================================================
//
// Given an 8-bit input vector [7:0], reverse its bit ordering.
//
// See also: Reversing a longer vector.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// • `assign out[7:0] = in[0:7];` does not work because Verilog does not allow vector bit ordering to be flipped.
//
// • The concatenation operator may save a bit of coding, allowing for 1 assign statement instead of 8.
// ──────────────────────────────────────────────────────────────────────────


module top_module( 
    input [7:0] in,
    output [7:0] out
);
assign out = {in[0], in[1], in[2], in[3], in[4], in[5], in[6], in[7]};
endmodule
