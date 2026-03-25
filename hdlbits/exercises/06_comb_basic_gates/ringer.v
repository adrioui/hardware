// ==========================================================================
// HDLBits — Ring or vibrate?
// https://hdlbits.01xz.net/wiki/ringer
// ==========================================================================
//
// Suppose you are designing a circuit to control a cellphone's ringer and
// vibration motor. Whenever the phone needs to ring from an incoming call
// (`input **ring**`), your circuit must either turn on the ringer (`output
// **ringer** = 1`) or the motor (`output **motor** = 1`), but not both. If the
// phone is in vibrate mode (`input **vibrate_mode** = 1`), turn on the motor.
// Otherwise, turn on the ringer.
//
// Try to use only `assign` statements, to see whether you can translate a
// problem description into a collection of logic gates.
//
// **Design hint:** When designing circuits, one often has to think of the
// problem "backwards", starting from the outputs then working backwards
// towards the inputs. This is often the opposite of how one would think about
// a (sequential, imperative) programming problem, where one would look at the
// inputs first then decide on an action (or output). For sequential programs,
// one would often think "If (inputs are ___ ) then (output should be ___ )".
// On the other hand, hardware designers often think "The (output should be ___
// ) when (inputs are ___ )".
//
// The above problem description is written in an imperative form suitable for
// software programming (*if ring then do this*), so you must convert it to a
// more declarative form suitable for hardware implementation (`*assign ringer
// = ___*`). Being able to think in, and translate between, both styles is one
// of the most important skills needed for hardware design.
//
// [Figure: Ringer.png]
// **
// ***Expected solution length:** Around 2 lines.*
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Ringer.png
//
//    Phone ringer / vibrate:
//
//    ┌─────────────────────────────────────────┐
//    │  Inputs:     ring, vibrate_mode         │
//    │  Outputs:    ringer, motor              │
//    │                                         │
//    │  ring=0: ringer=0, motor=0 (off)        │
//    │  ring=1, vibrate_mode=0: ringer=1       │
//    │  ring=1, vibrate_mode=1: motor=1        │
//    │                                         │
//    │  ringer = ring & ~vibrate_mode           │
//    │  motor  = ring &  vibrate_mode           │
//    └─────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// For this particular problem, one should be thinking *"The motor is on when
// ___"*, rather than *"If (vibrate mode) then ___"*.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input  ring,
    input  vibrate_mode,
    output ringer,        // Make sound
    output motor          // Vibrate
);

endmodule
