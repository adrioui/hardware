// ==========================================================================
// HDLBits — Adder-subtractor
// https://hdlbits.01xz.net/wiki/module_addsub
// ==========================================================================
//
// An adder-subtractor can be built from an adder by optionally negating one of
// the inputs, which is equivalent to inverting the input then adding 1. The
// net result is a circuit that can do two operations: (a + b + 0) and (a + ~b
// + 1). See Wikipedia if you want a more detailed explanation of how this
// circuit works.
//
// Build the adder-subtractor below.
//
// You are provided with a 16-bit adder module, which you need to instantiate
// twice:
//
// `module add16 ( input[15:0] **a**, input[15:0] **b**, input **cin**, output[15:0] **sum**, output **cout** );`
//
// Use a 32-bit wide XOR gate to invert the `b` input whenever `sub` is 1.
// (This can also be viewed as `b[31:0]` XORed with sub replicated 32 times.
// See replication operator.). Also connect the `sub` input to the carry-in of
// the adder.
//
// [Figure: Module_addsub.png]
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Module_addsub.png
//
//    ┌───────────────────────────────────────────────────────────────┐
//    │  top_module (Adder-Subtractor)                                │
//    │                                                               │
//    │              ┌───────────────────────────────┐                │
//    │              │  32x XOR gates                │                │
//    │  b[31:0]════►│  b[i] ^ sub ────────► b_xor   │                │
//    │  sub ───────►│                               │                │
//    │              └───────────────┬───────────────┘                │
//    │                              ║                                │
//    │              ┌──────────┐    ║    ┌──────────┐                │
//    │  a[15:0]════►│  add16   │    ║    │  add16   │                │
//    │  b_xor[15:0]►│a    sum──├═══►║══►│a    sum───├══►sum[31:16]   │
//    │              │b         │    ║    │b         │                │
//    │  sub ───────►│cin  cout─├────╨──►│cin        │                │
//    │              └──────────┘         └──────────┘                │
//    │              sum[15:0]                                        │
//    │                                                               │
//    │  When sub=0: sum = a + b        (add)                         │
//    │  When sub=1: sum = a + ~b + 1   (subtract, two's complement)  │
//    └───────────────────────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Module_addsub_xor.png
//
//    XOR as programmable inverter:
//
//    b ────►┌─────┐
//           │ XOR ├────► output
//    sub ──►└─────┘
//
//    sub=0:  output = b      (pass through)
//    sub=1:  output = ~b     (invert)
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// An XOR gate can also be viewed as a programmable inverter, where one input
// controls whether the other should be inverted. The following two circuits
// are both XOR gates:
// ──────────────────────────────────────────────────────────────────────────


module top_module (
    input [31:0] a,
    input [31:0] b,
    input sub,
    output [31:0] sum
);
  wire wire1;
  wire [15:0] sum0, sum1;

  add16 adder1 (
      .cin(sub),
      .a(a[15:0]),
      .b(b[15:0] ^ {16{sub}}),
      .sum(sum0),
      .cout(wire1)
  );

  add16 adder2 (
      .cin(wire1),
      .a  (a[31:16]),
      .b  (b[31:16] ^ {16{sub}}),
      .sum(sum1)
  );

  assign sum = {sum1, sum0};
endmodule
