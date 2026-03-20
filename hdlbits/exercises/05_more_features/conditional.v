// ==========================================================================
// HDLBits — Conditional ternary operator
// https://hdlbits.01xz.net/wiki/conditional
// ==========================================================================
//
// Verilog has a ternary conditional operator ( ? : ) much like C:
//
// `(condition ? if_true : if_false)`
//
// This can be used to choose one of two values based on *condition* (a mux!)
// on one line, without using an if-then inside a combinational always block.
//
// Examples:
//
// (0 ? 3 : 5)     // This is 5 because the condition is false.
// (sel ? b : a)   // A 2-to-1 multiplexer between a and b selected by sel.
//
// always @(posedge clk)         // A T-flip-flop.
// q A Bit of Practice
//
// Given four unsigned numbers, find the minimum. Unsigned numbers can be
// compared with standard comparison operators (a < b). Use the conditional
// operator to make two-way *min* circuits, then compose a few of them to
// create a 4-way *min* circuit. You'll probably want some wire vectors for the
// intermediate results.
//
// **
// ***Expected solution length:** Around 5 lines.*
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input [7:0] a, b, c, d,
    output [7:0] min);
//

    // assign intermediate_result1 = compare? true: false;

endmodule
