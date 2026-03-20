// ==========================================================================
// HDLBits — Detect both edges
// https://hdlbits.01xz.net/wiki/edgedetect2
// ==========================================================================
//
// For each bit in an 8-bit vector, detect when the input signal changes from
// one clock cycle to the next (detect any edge). The output bit should be set
// the cycle after a 0 to 1 transition occurs.
//
// Here are some examples. For clarity, in[1] and anyedge[1] are shown
// separately
//
// { signal: [{ name: "clk", wave: "p............" },
// { name: "in[7:0]",    wave: "=.=...=.==...", data: ['0', '2', 'e', '0', '2'
// ]  },
// { name: "anyedge[7:0]", wave: "=..==..=====.", data: ['0', '2', '0', 'c',
// '0', 'e', '2', '0'] },
// { name: "in[1]",      wave: "0.1.....01..."  },
// { name: "anyedge[1]",   wave: "0..10....1.0." }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input [7:0] in,
    output [7:0] anyedge
);

endmodule
