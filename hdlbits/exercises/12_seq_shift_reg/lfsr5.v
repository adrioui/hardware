// ==========================================================================
// HDLBits — 5-bit LFSR
// https://hdlbits.01xz.net/wiki/lfsr5
// ==========================================================================
//
// A linear feedback shift register is a shift register usually with a few XOR
// gates to produce the next state of the shift register. A Galois LFSR is one
// particular arrangement where bit positions with a "tap" are XORed with the
// output bit to produce its next value, while bit positions without a tap
// shift. If the taps positions are carefully chosen, the LFSR can be made to
// be "maximum-length". A maximum-length LFSR of n bits cycles through 2n-1
// states before repeating (the all-zero state is never reached).
//
// The following diagram shows a 5-bit maximal-length Galois LFSR with taps at
// bit positions 5 and 3. (Tap positions are usually numbered starting from 1).
// Note that I drew the XOR gate at position 5 for consistency, but one of the
// XOR gate inputs is 0.
//
// [Figure: Lfsr5.png]
//
// Build this LFSR. The `reset` should reset the LFSR to 1.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lfsr5.png
//
//    5-bit Galois LFSR (taps at positions 5 and 3):
//  
//    ┌──────────────────────────────────────────────────────┐
//    │                                                      │
//    │  ┌───┐    ┌───┐   ┌───┐    ┌───┐    ┌───┐           │
//    │  │q[1]│◄──│q[2]│◄─│q[3]│◄──│q[4]│◄──│q[5]│◄─── 0   │
//    │  └─┬──┘   └─┬──┘  └─┬──┘   └─┬──┘   └─┬──┘    ▲    │
//    │    │        │       │  ▲     │        │        │    │
//    │    │        │      ┌┴──┴┐    │        │        │    │
//    │    │        │      │XOR │    │        │        │    │
//    │    │        │      └────┘    │        │        │    │
//    │    │        │        ▲      │        │        │    │
//    │    ▼        └────────┼──────┴────────┴────────┘    │
//    │   out                │                             │
//    │                      └── q[1] (feedback)           │
//    │                                                    │
//    │  Tap at position 3: q[3] XOR q[1]                  │
//    │  Tap at position 5: q[5] XOR q[1] (but input=0)   │
//    │  Reset value: 5'b00001                             │
//    └──────────────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// The first few states starting at 1 are `00001`, `10100`, `01010`, `00101`,
// ... The LFSR should cycle through 31 states before returning to `00001`.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input reset,    // Active-high synchronous reset to 5'h1
    output [4:0] q
);

endmodule
