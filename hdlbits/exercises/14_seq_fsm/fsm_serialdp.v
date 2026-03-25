// ==========================================================================
// HDLBits — Serial receiver with parity checking
// https://hdlbits.01xz.net/wiki/fsm_serialdp
// ==========================================================================
//
// See also: Serial receiver and datapath
//
// We want to add parity checking to the serial receiver. Parity checking adds
// one extra bit after each data byte. We will use odd parity, where the number
// of `1`s in the 9 bits received must be odd. For example, `101001011`
// satisfies odd parity (there are 5 `1`s), but `001001011` does not.
//
// Change your FSM and datapath to perform odd parity checking. Assert the
// `done` signal only if a byte is correctly received *and* its parity check
// passes. Like the serial receiver FSM, this FSM needs to identify the start
// bit, wait for all 9 (data and parity) bits, then verify that the stop bit
// was correct. If the stop bit does not appear when expected, the FSM must
// wait until it finds a stop bit before attempting to receive the next byte.
//
// You are provided with the following module that can be used to calculate the
// parity of the input stream (It's a TFF with reset). The intended use is that
// it should be given the input bit stream, and reset at appropriate times so
// it counts the number of `1` bits in each byte.
//
// module parity (
// input clk,
// input reset,
// input in,
// output reg odd);
//
// always @(posedge clk)
// if (reset) odd Some timing diagrams
//
// No framing errors. Odd parity passes for first byte, fails for second byte.
//
// { signal: [{ name: "clk", wave: "p............................" },
// { name: "reset", wave:"10..........................." },
// { name: "in",    wave: "1.01.010.101.0.10..1.01...0x." , node:
// "...A.......B..C.......D.", phase:0 },
// { name: "done",  wave: "0............10.............." },
// { name: "out_byte",wave: "x............=x..............", data:['4b', '62']
// },
// ],
// edge: ['AB 0x4b', 'CD 0x62'],
// foot:{
// tock:['idle', '', 'start', '', '', '', 'data', '', '', '', '', 'parity', '',
// '', '', '', '', '', '', '', '', '', 'parity', '', '', '', 'start'] } }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input in,
    input reset,  // Synchronous reset
    output [7:0] out_byte,
    output done
);
  //

  // Modify FSM and datapath from Fsm_serialdata

  // New: Add parity checking.

endmodule
