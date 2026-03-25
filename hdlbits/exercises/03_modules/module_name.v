// ==========================================================================
// HDLBits — Connecting ports by name
// https://hdlbits.01xz.net/wiki/module_name
// ==========================================================================
//
// This problem is similar to module. You are given a module named `mod_a` that
// has 2 outputs and 4 inputs, in some order. You must connect the 6 ports *by
// name* to your
// top-level module's ports:
//
// Port in `**mod_a**`
// Port in `**top_module**`
//
// `output out1`
// `out1`
//
// `output out2`
// `out2`
//
// `input in1`
// `a`
//
// `input in2`
// `b`
//
// `input in3`
// `c`
//
// `input in4`
// `d`
//
// You are given the following module:
//
// `module mod_a ( output out1, output out2, input in1, input in2, input in3, input in4);`
//
// [Figure: Module_name.png]
// **
// ***Expected solution length:** Around 1 line.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Module_name.png
//
//    ┌───────────────────────────────────────────────────────┐
//    │  top_module                                           │
//    │  Connect by name:                                     │
//    │  mod_a inst1 ( .out(wc), .in1(wa), .in2(wb) );        │
//    │                                                       │
//    │                  ┌──────────────┐                     │
//    │  a ─────────────►│in1      out ─├──────────────── out │
//    │  b ─────────────►│in2           │                     │
//    │                  └──────────────┘                     │
//    │  Names:   .in1(a)  .in2(b)  .out(out)                 │
//    └───────────────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────


module top_module (
    input  a,
    input  b,
    input  c,
    input  d,
    output out1,
    output out2
);
  mod_a instance1 (
      .out1(out1),
      .out2(out2),
      .in1 (a),
      .in2 (b),
      .in3 (c),
      .in4 (d)
  );
endmodule
