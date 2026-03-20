// ==========================================================================
// HDLBits — Vector part select
// https://hdlbits.01xz.net/wiki/vector2
// ==========================================================================
//
// A 32-bit vector can be viewed as containing 4 bytes (bits [31:24], [23:16],
// etc.). Build a circuit that will reverse the *byte* ordering of the 4-byte
// word.
//
// AaaaaaaaBbbbbbbbCcccccccDddddddd => DdddddddCcccccccBbbbbbbbAaaaaaaa
//
// This operation is often used when the endianness of a piece of data needs to
// be swapped, for example between little-endian x86 systems and the big-endian
// formats used in many Internet protocols.
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Part-select can be used on both the left side and right side of an
// assignment.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module( 
    input [31:0] in,
    output [31:0] out );
//

    // assign out[31:24] = ...;

endmodule
