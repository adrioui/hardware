// ==========================================================================
// HDLBits — 2-to-1 bus multiplexer
// https://hdlbits.01xz.net/wiki/mux2to1v
// ==========================================================================
//
// Create a 100-bit wide, 2-to-1 multiplexer. When sel=0, choose a. When sel=1,
// choose b.
//
// **
// ***Expected solution length:** Around 1 line.*
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// The ternary operator `(cond ? iftrue : iffalse)` is easier to read.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module( 
    input [99:0] a, b,
    input sel,
    output [99:0] out );

endmodule
