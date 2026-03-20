// ==========================================================================
// HDLBits — Timer
// https://hdlbits.01xz.net/wiki/cs450/timer
// ==========================================================================
//
// Implement a timer that counts down for a given number of clock cycles, then
// asserts a signal to indicate that the given duration has elapsed. A good way
// to implement this is with a down-counter that asserts an output signal when
// the count becomes 0.
//
// At each clock cycle:
//
// • If `load` = 1, load the internal counter with the 10-bit `data`, the number of clock cycles the timer should count before timing out. The counter can be loaded at any time, including when it is still counting and has not yet reached 0.
//
// • If `load` = 0, the internal counter should decrement by 1.
//
// The output signal `tc` ("terminal count") indicates whether the internal
// counter has reached 0. Once the internal counter has reached 0, it should
// stay 0 (stop counting) until the counter is loaded again.
//
// Below is an example of what happens when asking the timer to count for 3
// cycles:
//
// {"signal":[["Inputs",{"name":"clk","wave":"ppppppppp"},
// {"name":"load","wave":"010......"},
// {"name":"data","wave":"x=x......","data":["3"]}
// ],
// {"name":""},
// ["Internal",{"name":"counter","wave":"x.====...",
// "data":['3','2','1','0']}],
// {"name":""},
// ["Outputs",{"name":"tc","wave":"0....1..."}],
// {"name":""}]}
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
	input clk, 
	input load, 
	input [9:0] data, 
	output tc
);

endmodule
