// ==========================================================================
// HDLBits — 4-bit shift register and down counter
// https://hdlbits.01xz.net/wiki/exams/review2015_shiftcount
// ==========================================================================
//
// *This is the first component in a series of five exercises that builds a
// complex counter out of several smaller circuits. See the final exercise for
// the overall design.*
//
// Build a four-bit shift register that also acts as a down counter. Data is
// shifted in most-significant-bit first when `shift_ena` is 1. The number
// currently in the shift register is decremented when `count_ena` is 1. Since
// the full system doesn't ever use `shift_ena` and `count_ena` together, it
// does not matter what your circuit does if both control inputs are 1 (This
// mainly means that it doesn't matter which case gets higher priority).
//
// { signal: [{ name: "clk", wave: "p..............." },
// { name: "shift_ena", wave: "0.1...0........." },
// { name: "count_ena", wave: "0........1....0." },
// { name: "data", wave: "x.10.1x........." },
// { name: "q", wave:         "=..====...=====.", data: ['0',
// '1','2','4','9','8','7','6','5','4'] }
// ] }
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input shift_ena,
    input count_ena,
    input data,
    output [3:0] q);

endmodule
