// ==========================================================================
// HDLBits — Priority encoder
// https://hdlbits.01xz.net/wiki/always_case2
// ==========================================================================
//
// A *priority encoder* is a combinational circuit that, when given an input
// bit vector, outputs the position of the first `1` bit in the vector. For
// example, a 8-bit priority encoder given the input `8'b10010000` would output
// `3'd4`, because bit[4] is first bit that is high.
//
// Build a 4-bit priority encoder. For this problem, if none of the input bits
// are high (i.e., input is zero), output zero. Note that a 4-bit number has 16
// possible combinations.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Using hexadecimal (`4'hb`) or decimal (`4'd11`) number literals would save
// typing vs. binary (`4'b1011`) literals.
// ──────────────────────────────────────────────────────────────────────────


// synthesis verilog_input_version verilog_2001
module top_module (
    input [3:0] in,
    output reg [1:0] pos
);
  always @(*) begin
    case (in)
      4'd0: pos = 0;
      4'd1: pos = 0;
      4'd2: pos = 1;
      4'd3: pos = 0;
      4'd4: pos = 2;
      4'd5: pos = 0;
      4'd6: pos = 1;
      4'd7: pos = 0;
      4'd8: pos = 3;
      4'd9: pos = 0;
      4'd10: pos = 1;
      4'd11: pos = 0;
      4'd12: pos = 2;
      4'd13: pos = 0;
      4'd14: pos = 1;
      4'd15: pos = 0;
      default: pos = 0;
    endcase
  end
endmodule
