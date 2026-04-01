// ==========================================================================
// HDLBits — Carry-select adder
// https://hdlbits.01xz.net/wiki/module_cseladd
// ==========================================================================
//
// One drawback of the ripple carry adder (See previous exercise) is that the
// delay for an adder to compute the carry out (from the carry-in, in the worst
// case) is fairly slow, and the second-stage adder cannot begin computing
// *its* carry-out until the first-stage adder has finished. This makes the
// adder slow. One improvement is a carry-select adder, shown below. The first-
// stage adder is the same as before, but we duplicate the second-stage adder,
// one assuming carry-in=0 and one assuming carry-in=1, then using a fast
// 2-to-1 multiplexer to select which result happened to be correct.
//
// In this exercise, you are provided with the same module `add16` as the
// previous exercise, which adds two 16-bit numbers with carry-in and produces
// a carry-out and 16-bit sum. You must instantiate *three* of these to build
// the carry-select adder, using your own 16-bit 2-to-1 multiplexer.
//
// Connect the modules together as shown in the diagram below. The provided
// module `add16` has the following declaration:
//
// `module add16 ( input[15:0] **a**, input[15:0] **b**, input **cin**, output[15:0] **sum**, output **cout** );`
//
// [Figure: Module_cseladd.png]
//
// ───────────────────────────────────────────────────────────────────────────
// DIAGRAM: Module_cseladd.png
//
//    ┌──────────────────────────────────────────────────────────────────────┐
//    │  top_module (Carry-Select Adder)                                     │
//    │                                                                      │
//    │             ┌──────────┐                                             │
//    │  a[15:0]═══►│  add16   │═══► sum[15:0]                               │
//    │  b[15:0]═══►│a    sum  │                                             │
//    │        0───►│cin  cout─├──────────────────────── sel                 │
//    │             └──────────┘                          │                  │
//    │                                                   ▼                  │
//    │             ┌──────────┐                    ┌──────────┐             │
//    │  a[31:16]══►│  add16   │═══►sum0 ══════════►│0         │             │
//    │  b[31:16]══►│a    sum  │                    │   MUX    │══►sum[31:16]│
//    │        0───►│cin       │                    │          │             │
//    │             └──────────┘                    │1         │             │
//    │             ┌──────────┐                    │          │             │
//    │  a[31:16]══►│  add16   │═══►sum1 ══════════►│          │             │
//    │  b[31:16]══►│a    sum  │                    └──────────┘             │
//    │        1───►│cin       │                                             │
//    │             └──────────┘                                             │
//    └──────────────────────────────────────────────────────────────────────┘
//
// ───────────────────────────────────────────────────────────────────────────


module top_module (
    input  [31:0] a,
    input  [31:0] b,
    output [31:0] sum
);
  wire wire1;
  wire [15:0] sum0, sum1;

  add16 instance1 (
      .a(a[15:0]),
      .b(b[15:0]),
      .cin(1'b0),
      .cout(wire1),
      .sum(sum[15:0])
  );
  add16 instance2 (
      .a  (a[31:16]),
      .b  (b[31:16]),
      .cin(1'b0),
      .sum(sum0)
  );
  add16 instance3 (
      .a  (a[31:16]),
      .b  (b[31:16]),
      .cin(1'b1),
      .sum(sum1)
  );

  assign sum[31:16] = wire1 ? sum1 : sum0;

endmodule
