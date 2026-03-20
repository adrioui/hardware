// ==========================================================================
// HDLBits — D flip-flop
// https://hdlbits.01xz.net/wiki/dff
// ==========================================================================
//
// A D flip-flop is a circuit that stores a bit and is updated periodically, at
// the (usually) positive edge of a clock signal.
//
// D flip-flops are created by the logic synthesizer when a clocked always
// block is used (See alwaysblock2). A D flip-flop is the simplest form of
// "blob of combinational logic followed by a flip-flop" where the
// combinational logic portion is just a wire.
//
// Create a single D flip-flop.
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,    // Clocks are used in sequential circuits
    input d,
    output reg q );
//

    // Use a clocked always block
    //   copy d to q at every positive edge of clk
    //   Clocked always blocks should use non-blocking assignments

endmodule
