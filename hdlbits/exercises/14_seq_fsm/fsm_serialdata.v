// ==========================================================================
// HDLBits — Serial receiver and datapath
// https://hdlbits.01xz.net/wiki/fsm_serialdata
// ==========================================================================
//
// See also: Serial receiver
//
// Now that you have a finite state machine that can identify when bytes are
// correctly received in a serial bitstream, add a datapath that will output
// the correctly-received data byte. `out_byte` needs to be valid when `done`
// is `1`, and is don't-care otherwise.
//
// Note that the serial protocol sends the *least* significant bit first.
//
// Some timing diagrams
//
// Error-free:
//
// { signal: [{ name: "clk", wave: "p.........................." },
// { name: "reset", wave:"10........................." },
// { name: "in",    wave: "1.01.010.1010.10..1.01..0x." , node:
// "...A.......B.C.......D.", phase:0 },
// { name: "done",  wave: "0...........10........10..." },
// { name: "out_byte",wave: "x...........=x........=x...", data:['4b', '62'] },
// ],
// edge: ['AB 0x4b', 'CD 0x62'],
// foot:{
// tock:['idle', '', 'start', '', '', '', 'data', '', '', '', '', 'stop', '',
// '', '', '', '', '', '', '', '', 'stop', '', '', 'start'] } }
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// The serial bitstream needs to be *shifted* in one bit at a time, then read
// out in parallel.
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

  // Use FSM from Fsm_serial

  // New: Datapath to latch input bits.

endmodule
