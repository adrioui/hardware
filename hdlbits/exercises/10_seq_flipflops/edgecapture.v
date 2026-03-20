// ==========================================================================
// HDLBits — Edge capture register
// https://hdlbits.01xz.net/wiki/edgecapture
// ==========================================================================
//
// For each bit in a 32-bit vector, capture when the input signal changes from
// 1 in one clock cycle to 0 the next. "Capture" means that the output will
// remain 1 until the register is reset (synchronous reset).
//
// Each output bit behaves like a SR flip-flop: The output bit should be set
// (to 1) the cycle after a 1 to 0 transition occurs. The output bit should be
// reset (to 0) at the positive clock edge when reset is high. If both of the
// above events occur at the same time, reset has precedence. In the last 4
// cycles of the example waveform below, the 'reset' event occurs one cycle
// earlier than the 'set' event, so there is no conflict here.
//
// In the example waveform below, reset, in[1] and out[1] are shown again
// separately for clarity.
//
// { signal: [{ name: "clk", wave: "p.............." },
// { name: "in[31:0]",    wave: "=.=...=.==..=..", data: ['0', '2', 'e', '0',
// '2', '0' ]  },
// { name: "reset",       wave: "10.........10.."},
// { name: "out[31:0]", wave: "=........=..==.", data: ['0', 'e', '0', '2'] },
// { },
// { name: "in[1]",      wave: "0.1.....01..0..", node: '...........c...'  },
// { name: "out[1]",   wave: "0........1..01.", node: '............bd..' },
// { name: "reset",       wave: "10.........10..", node: '...........a...'},
// ],
// edge: [ 'a~->b reset', 'c-~>d set' ]
// }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input reset,
    input [31:0] in,
    output [31:0] out
);

endmodule
