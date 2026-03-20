// ==========================================================================
// HDLBits — Q5a: Serial two's complementer (Moore FSM)
// https://hdlbits.01xz.net/wiki/exams/ece241_2014_q5a
// ==========================================================================
//
// You are to design a one-input one-output serial 2's complementer **Moore**
// state machine.
// The input (x) is a series of bits (one per clock cycle) beginning with the
// least-significant bit of the number, and the output (Z) is the 2's
// complement of the input. The machine will accept input numbers of arbitrary
// length. The circuit requires an asynchronous reset. The conversion begins
// when *Reset* is released and stops when *Reset* is asserted.
//
// For example:
//
// {signal: [
// {name: "Input (x)", wave:  '0.101.0.'},
// {name: "Output (z)", wave: "0..1.0.1"}
// ],
// foot: { tock: ['LSB', '', '', '', '', '', '', 'MSB'] }
// }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input areset,
    input x,
    output z
);

endmodule
