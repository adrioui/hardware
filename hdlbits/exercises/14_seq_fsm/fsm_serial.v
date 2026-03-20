// ==========================================================================
// HDLBits — Serial receiver
// https://hdlbits.01xz.net/wiki/fsm_serial
// ==========================================================================
//
// In many (older) serial communications protocols, each data byte is sent
// along with a start bit and a stop bit, to help the receiver delimit bytes
// from the stream of bits. One common scheme is to use one start bit (0), 8
// data bits, and 1 stop bit (1). The line is also at logic 1 when nothing is
// being transmitted (idle).
//
// Design a finite state machine that will identify when bytes have been
// correctly received when given a stream of bits. It needs to identify the
// start bit, wait for all 8 data bits, then verify that the stop bit was
// correct. If the stop bit does not appear when expected, the FSM must wait
// until it finds a stop bit before attempting to receive the next byte.
//
// Some timing diagrams
//
// Error-free:
//
// { signal: [{ name: "clk", wave: "p.........................." },
// { name: "reset", wave:"10........................." },
// { name: "in",    wave:"1.0x.......10x.......1..0x." },
// { name: "done", wave: "0...........10........10..." },
// ],
// foot:{
// tock:['idle', '', 'start', '', '', '', 'data', '', '', '', '', 'stop', '',
// '', '', '', '', '', '', '', '', 'stop', '', '', 'start'] } }
//
// Stop bit not found. First byte is discarded:
//
// { signal: [{ name: "clk", wave: "p.........................." },
// { name: "reset", wave:"10........................." },
// { name: "in",    wave:"1.0x.......0.10x.......10x." },
// { name: "done", wave: "0.......................10." },
// ],
// foot:{
// tock:['idle', '', 'start', '', '', '', 'data', '', '', '', '', '?','?!', '',
// 'start', '', '', '', 'data', '', '', '', '', 'stop' ] } }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input in,
    input reset,    // Synchronous reset
    output done
);

endmodule
