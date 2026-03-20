// ==========================================================================
// HDLBits — Q2a: FSM (2013)
// https://hdlbits.01xz.net/wiki/exams/2013_q2afsm
// ==========================================================================
//
// Consider the FSM described by the state diagram shown below:
//
// [Figure: Exams_2013q2.png]
//
// This FSM acts as an arbiter circuit, which controls access to some type of
// resource by three
// requesting devices. Each device makes its request for the resource by
// setting a signal *r[i]* = 1,
// where *r[i]* is either *r[1]*, *r[2]*, or *r[3]*. Each r[i] is an input
// signal to the FSM, and represents one of the
// three devices. The FSM stays in state *A* as long as there are no requests.
// When one or more
// request occurs, then the FSM decides which device receives a grant to use
// the resource and
// changes to a state that sets that device’s *g[i]* signal to 1. Each *g[i]*
// is an output from the FSM. There
// is a priority system, in that device 1 has a higher priority than device 2,
// and device 3 has the
// lowest priority. Hence, for example, device 3 will only receive a grant if
// it is the only device
// making a request when the FSM is in state *A*. Once a device, *i*, is given
// a grant by the FSM, that
// device continues to receive the grant as long as its request, *r[i]* = 1.
//
// Write complete Verilog code that represents this FSM. Use separate always
// blocks for the state
// table and the state flip-flops, as done in lectures. Describe the FSM
// outputs, *g[i]*, using either
// continuous assignment statement(s) or an always block (at your discretion).
// Assign any state
// codes that you wish to use.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Exams_2013q2.png
//
//    FSM diagram (exam 2013 Q2):
//    (See the HDLBits page for exact state transitions)
//  
//    State machine with multiple states.
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input resetn,    // active-low synchronous reset
    input [3:1] r,   // request
    output [3:1] g   // grant
);

endmodule
