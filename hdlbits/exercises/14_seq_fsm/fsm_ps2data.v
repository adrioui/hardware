// ==========================================================================
// HDLBits — PS/2 packet parser and datapath
// https://hdlbits.01xz.net/wiki/fsm_ps2data
// ==========================================================================
//
// See also: PS/2 packet parser.
//
// Now that you have a state machine that will identify three-byte messages in
// a PS/2 byte stream, add a datapath that will also output the 24-bit (3 byte)
// message whenever a packet is received (`out_bytes[23:16]` is the first byte,
// `out_bytes[15:8]` is the second byte, etc.).
//
// `out_bytes` needs to be valid whenever the `done` signal is asserted. You may output anything at other times (i.e., don't-care).
//
// For example:
//
// {
// config:{hscale:2},
// signal: [{ name: "clk", wave: "p........." },
// { name: "reset", wave:"10........" },
// { name: "in[7:0]", wave:"x=========", data:['08', '01', '02', '38', 'ff',
// 'fe', '08', '03', '04'] },
// { name: "in[3]", wave:"x10.10.10." },
// { name: "done", wave: "x0..10.10." },
// { name: "out_bytes", wave:"x...=x.=x.", data:['080102', '38fffe', '080304']
// },
// ],
// foot:{
// tock:['', 'byte1', 'byte2', 'byte3','byte1', 'byte2', 'byte3','byte1',
// 'byte2', 'byte3'] } }
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Use the FSM from PS/2 packet parser and add a datapath to capture the
// incoming bytes.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input [7:0] in,
    input reset,  // Synchronous reset
    output [23:0] out_bytes,
    output done
);
  //

  // FSM from fsm_ps2

  // New: Datapath to store incoming bytes.

endmodule
