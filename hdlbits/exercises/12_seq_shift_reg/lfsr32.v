// ==========================================================================
// HDLBits — 32-bit LFSR
// https://hdlbits.01xz.net/wiki/lfsr32
// ==========================================================================
//
// See Lfsr5 for explanations.
//
// Build a 32-bit Galois LFSR with taps at bit positions 32, 22, 2, and 1.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// This is long enough that you'd want to use vectors, not 32 instantiations of
// DFFs.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input reset,    // Active-high synchronous reset to 32'h1
    output [31:0] q
);

endmodule
