// ==========================================================================
// HDLBits — Detect an edge
// https://hdlbits.01xz.net/wiki/edgedetect
// ==========================================================================
//
// For each bit in an 8-bit vector, detect when the input signal changes from 0
// in one clock cycle to 1 the next (similar to positive edge detection). The
// output bit should be set the cycle after a 0 to 1 transition occurs.
//
// Here are some examples. For clarity, in[1] and pedge[1] are shown
// separately.
//
// { signal: [{ name: "clk", wave: "p............" },
// { name: "in[7:0]",    wave: "=.=...=.==...", data: ['0', '2', 'e', '0', '2'
// ]  },
// { name: "pedge[7:0]", wave: "=..==..==.==.", data: ['0', '2', '0', 'c', '0',
// '2', '0'] },
// { name: "in[1]",      wave: "0.1.....01..."  },
// { name: "pedge[1]",   wave: "0..10.....10." }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input [7:0] in,
    output [7:0] pedge
);

endmodule
