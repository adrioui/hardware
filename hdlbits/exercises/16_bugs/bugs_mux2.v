// ==========================================================================
// HDLBits — Mux
// https://hdlbits.01xz.net/wiki/bugs_mux2
// ==========================================================================
//
// This 8-bit wide 2-to-1 multiplexer doesn't work. Fix the bug(s).
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input sel,
    input [7:0] a,
    input [7:0] b,
    output [7:0] out  );
module top_module (
    input sel,
    input [7:0] a,
    input [7:0] b,
    output out  );

    assign out = (~sel & a) | (sel & b);

endmodule
