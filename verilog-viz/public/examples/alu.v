// 8-bit ALU with operation submodules
// alu instantiates adder, bitwise_ops, and shifter

// 4-bit opcode encoding
// 4'b0000 — ADD
// 4'b0001 — SUB
// 4'b0010 — AND
// 4'b0011 — OR
// 4'b0100 — XOR
// 4'b0101 — SHL (shift left)
// 4'b0110 — SHR (shift right)

module adder (
    input  wire [7:0] a,
    input  wire [7:0] b,
    input  wire       sub,        // 1 = subtract, 0 = add
    output wire [7:0] result,
    output wire       carry_out,
    output wire       overflow
);
  wire [8:0] sum;
  assign sum = sub ? ({1'b0, a} - {1'b0, b}) : ({1'b0, a} + {1'b0, b});
  assign result = sum[7:0];
  assign carry_out = sum[8];
  assign overflow  = (a[7] == b[7]) & (result[7] != a[7]) & !sub
                     | (a[7] != b[7]) & (result[7] == b[7]) &  sub;
endmodule

module bitwise_ops (
    input  wire [7:0] a,
    input  wire [7:0] b,
    input  wire [1:0] op,     // 2'b00=AND 2'b01=OR 2'b10=XOR
    output reg  [7:0] result
);
  always @(*) begin
    case (op)
      2'b00:   result = a & b;
      2'b01:   result = a | b;
      2'b10:   result = a ^ b;
      default: result = 8'h00;
    endcase
  end
endmodule

module shifter (
    input  wire [7:0] a,
    input  wire [2:0] shamt,  // shift amount 0-7
    input  wire       right,  // 1 = shift right, 0 = shift left
    output wire [7:0] result
);
  assign result = right ? (a >> shamt) : (a << shamt);
endmodule

module alu (
    input  wire [7:0] a,
    input  wire [7:0] b,
    input  wire [3:0] opcode,
    output reg  [7:0] result,
    output wire       carry_out,
    output wire       overflow,
    output wire       zero
);
  wire [7:0] add_result, bit_result, shift_result;
  wire add_carry, add_overflow;

  adder u_adder (
      .a        (a),
      .b        (b),
      .sub      (opcode[0]),
      .result   (add_result),
      .carry_out(add_carry),
      .overflow (add_overflow)
  );

  bitwise_ops u_bitwise (
      .a     (a),
      .b     (b),
      .op    (opcode[1:0]),
      .result(bit_result)
  );

  shifter u_shifter (
      .a     (a),
      .shamt (b[2:0]),
      .right (opcode[0]),
      .result(shift_result)
  );

  // Output mux
  always @(*) begin
    case (opcode[3:2])
      2'b00:   result = add_result;
      2'b01:   result = bit_result;
      2'b10:   result = shift_result;
      default: result = 8'h00;
    endcase
  end

  assign carry_out = (opcode[3:2] == 2'b00) ? add_carry : 1'b0;
  assign overflow  = (opcode[3:2] == 2'b00) ? add_overflow : 1'b0;
  assign zero      = (result == 8'h00);
endmodule
