// ==========================================================================
// HDLBits — Rule 90
// https://hdlbits.01xz.net/wiki/rule90
// ==========================================================================
//
// Rule 90 is a one-dimensional cellular automaton with interesting properties.
//
// The rules are simple. There is a one-dimensional array of cells (on or off).
// At each time step, the next state of each cell is the XOR of the cell's two
// current neighbours. A more verbose way of expressing this rule is the
// following table, where a cell's next state is a function of itself and its
// two neighbours:
//
// LeftCenterRightCenter's next state
// 1110
// 1101
// 1010
// 1001
// 0111
// 0100
// 0011
// 0000
//
// (The name "Rule 90" comes from reading the "next state" column: 01011010 is
// decimal 90.)
//
// In this circuit, create a 512-cell system (`q[511:0]`), and advance by one
// time step each clock cycle. The `load` input indicates the state of the
// system should be loaded with `data[511:0]`. Assume the boundaries (`q[-1]`
// and `q[512]`) are both zero (off).
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// For an initial state of q[511:0] = 1, the first few iterations are:
//
// 1
// 10
// 101
// 1000
// 10100
// 100010
// 1010101
// 10000000
//
// This forms half of a Sierpiński triangle.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input load,
    input [511:0] data,
    output [511:0] q
);

endmodule
