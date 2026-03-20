// ==========================================================================
// HDLBits — If statement latches
// https://hdlbits.01xz.net/wiki/always_if2
// ==========================================================================
//
// A common source of errors: How to avoid making latches
//
// When designing circuits, you *must* think first in terms of circuits:
//
// • I want this logic gate
//
// • I want a *combinational* blob of logic that has these inputs and produces these outputs
//
// • I want a combinational blob of logic followed by a set of flip-flops
//
// What you *must not* do is write the code first, then hope it generates a
// proper circuit.
//
// • If (cpu_overheated) then shut_off_computer = 1;
//
// • If (~arrived) then keep_driving = ~gas_tank_empty;
//
// Syntactically-correct code does not necessarily result in a reasonable
// circuit (combinational logic + flip-flops). The usual reason is: "What
// happens in the cases other than those you specified?". Verilog's answer is:
// Keep the outputs unchanged.
//
// This behaviour of "keep outputs unchanged" means the current state needs to
// be *remembered*, and thus produces a *latch*. Combinational logic (e.g.,
// logic gates) cannot remember any state. Watch out for `Warning (10240): ...
// inferring latch(es)"` messages. Unless the latch was intentional, it almost
// always indicates a bug. Combinational circuits must have a value assigned to
// all outputs under all conditions. This usually means you always need `else`
// clauses or a default value assigned to the outputs.
//
// Demonstration
//
// The following code contains incorrect behaviour that creates a latch. Fix
// the bugs so that you will shut off the computer only if it's really
// overheated, and stop driving if you've arrived at your destination or you
// need to refuel.
//
// This is the circuit described by the code, not the circuit you want to
// build.
//
// always @(*) begin
// if (cpu_overheated)
// shut_off_computer = 1;
// end
//
// always @(*) begin
// if (~arrived)
// keep_driving = ~gas_tank_empty;
// end
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

// synthesis verilog_input_version verilog_2001
module top_module (
    input      cpu_overheated,
    output reg shut_off_computer,
    input      arrived,
    input      gas_tank_empty,
    output reg keep_driving  );
//

    always @(*) begin
        if (cpu_overheated)
           shut_off_computer = 1;
    end

    always @(*) begin
        if (~arrived)
           keep_driving = ~gas_tank_empty;
    end

endmodule
