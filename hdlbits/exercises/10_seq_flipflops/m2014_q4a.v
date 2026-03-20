// ==========================================================================
// HDLBits — D Latch
// https://hdlbits.01xz.net/wiki/exams/m2014_q4a
// ==========================================================================
//
// Implement the following circuit:
//
// Note that this is a latch, so a Quartus warning about having inferred a
// latch is expected.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// • Latches are level-sensitive (not edge-sensitive) circuits, so in an always block, they use level-sensitive sensitivity lists.
//
// • However, they are still sequential elements, so should use non-blocking assignments.
//
// • A D-latch acts like a wire (or non-inverting buffer) when enabled, and preserves the current value when disabled.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input d, 
    input ena,
    output q);

endmodule
