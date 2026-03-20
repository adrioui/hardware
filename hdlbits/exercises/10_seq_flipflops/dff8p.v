// ==========================================================================
// HDLBits — DFF with reset value
// https://hdlbits.01xz.net/wiki/dff8p
// ==========================================================================
//
// Create 8 D flip-flops with active high synchronous reset. The flip-flops
// must be reset to 0x34 rather than zero. All DFFs should be triggered by the
// **negative** edge of `clk`.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Resetting a register to '1' is sometimes called "preset"
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,
    input [7:0] d,
    output [7:0] q
);

endmodule
