// Full adder — hierarchy example
// full_adder instantiates two half_adder modules and an or gate

module half_adder (
    input  wire a,
    input  wire b,
    output wire sum,
    output wire carry
);
  assign sum   = a ^ b;
  assign carry = a & b;
endmodule

module full_adder (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
  wire sum1, carry1, carry2;

  half_adder ha0 (
      .a    (a),
      .b    (b),
      .sum  (sum1),
      .carry(carry1)
  );

  half_adder ha1 (
      .a    (sum1),
      .b    (cin),
      .sum  (sum),
      .carry(carry2)
  );

  assign cout = carry1 | carry2;
endmodule
