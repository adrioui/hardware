// ==========================================================================
// HDLBits — Connecting ports by position
// https://hdlbits.01xz.net/wiki/module_pos
// ==========================================================================
//
// This problem is similar to the previous one (module). You are given a module
// named `mod_a` that has 2 outputs and 4 inputs, in that order. You must
// connect the 6 ports *by position* to your
// top-level module's ports `out1`, `out2`, `a`, `b`, `c`, and `d`, in that
// order.
//
// You are given the following module:
//
// `module mod_a ( output, output, input, input, input, input );`
//
// [Figure: Module_pos.png]
// **
// ***Expected solution length:** Around 1 line.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Module_pos.png
//
//    ┌───────────────────────────────────────────────────────┐
//    │  top_module                                           │
//    │  Connect by position:                                 │
//    │  mod_a inst1 ( wa, wb, wc );                          │
//    │                                                       │
//    │                  ┌──────────────┐                      │
//    │  a ─────────────►│in1      out ─├──────────────── out  │
//    │  b ─────────────►│in2           │                      │
//    │                  └──────────────┘                      │
//    │  Position:        (1st) (2nd) (3rd)                    │
//    └───────────────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module ( 
    input a, 
    input b, 
    input c,
    input d,
    output out1,
    output out2
);

endmodule
