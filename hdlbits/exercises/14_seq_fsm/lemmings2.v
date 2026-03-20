// ==========================================================================
// HDLBits — Lemmings 2
// https://hdlbits.01xz.net/wiki/lemmings2
// ==========================================================================
//
// [Figure: Lemmings2.gif]
//
// See also: Lemmings1.
//
// In addition to walking left and right, Lemmings will fall (and presumably go
// "aaah!") if the ground disappears underneath them.
//
// In addition to walking left and right and changing direction when bumped,
// when `ground=0`, the Lemming will fall and say "aaah!". When the ground
// reappears (`ground=1`), the Lemming will resume walking in the same
// direction as before the fall. Being bumped while falling does not affect the
// walking direction, and being bumped in the same cycle as ground disappears
// (but not yet falling), or when the ground reappears while still falling,
// also does not affect the walking direction.
//
// Build a finite state machine that models this behaviour.
//
// { signal: [{ name: "clk", wave: "p............." },
// { name: "bump_left",    wave: "0.10..1......." },
// { name: "bump_right",   wave: "0..10........." },
// { name: "ground",       wave: "1.....0...1..." },
// { name: "walk_left",    wave: "1..01..0...10." },
// { name: "walk_right",   wave: "0..10.......1." },
// { name: "aaah",         wave: "0......1...0.." } ] }
//
// See also: Lemmings3 and Lemmings4.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lemmings2.gif
//
//    Lemming animation: walks and falls when ground disappears.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lemmings2.png
//
//    Lemmings 4-state FSM (with falling):
//  
//       ┌───────────┐  bump   ┌───────────┐
//       │WALK_LEFT  │◄───────►│WALK_RIGHT │
//       │walk_left=1│         │walk_left=0│
//       └─────┬─────┘         └─────┬─────┘
//             │ ground=0            │ ground=0
//             ▼                     ▼
//       ┌───────────┐         ┌───────────┐
//       │FALL_LEFT  │         │FALL_RIGHT │
//       │ aaah=1    │         │ aaah=1    │
//       └─────┬─────┘         └─────┬─────┘
//             │ ground=1            │ ground=1
//             ▼                     ▼
//       WALK_LEFT             WALK_RIGHT
//    Resume walking in same direction after fall
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input areset,    // Freshly brainwashed Lemmings walk left.
    input bump_left,
    input bump_right,
    input ground,
    output walk_left,
    output walk_right,
    output aaah );

endmodule
