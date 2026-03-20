// ==========================================================================
// HDLBits — Lemmings 4
// https://hdlbits.01xz.net/wiki/lemmings4
// ==========================================================================
//
// [Figure: Lemmings4.gif]
//
// See also: Lemmings1, Lemmings2, and Lemmings3.
//
// Although Lemmings can walk, fall, and dig, Lemmings aren't invulnerable. If
// a Lemming falls for too long then hits the ground, it can splatter. In
// particular, if a Lemming falls for more than 20 clock cycles then hits the
// ground, it will splatter and cease walking, falling, or digging (all 4
// outputs become 0), forever (Or until the FSM gets reset). There is no upper
// limit on how far a Lemming can fall before hitting the ground. Lemmings only
// splatter when hitting the ground; they do not splatter in mid-air.
//
// Extend your finite state machine to model this behaviour.
//
// Falling for 20 cycles is survivable:
//
// { signal: [
// { name: "clk", wave: "p............" },
// { name: "ground",       wave: "1.0...|..1..." },
// { name: "walk_left",    wave: "1..0..|...1.." },
// { name: "aaah",         wave: "0..1..|...0.." },
// ],
// foot:{
// tock:['', '', '',1,2,3, '...', 18, 19, 20]
// }
// }
//
// Falling for 21 cycles causes splatter:
//
// { signal: [
// { name: "clk", wave: "p............" },
// { name: "ground",       wave: "1.0...|...1.." },
// { name: "walk_left",    wave: "1..0..|......" },
// { name: "aaah",         wave: "0..1..|....0." },
// ],
// foot:{
// tock:['', '', '',1,2,3, '...', 18, 19, 20, 21, 'oops']
// }
// }
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lemmings4.gif
//
//    Lemming animation: walks, digs, falls, and splats.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lemmings4.png
//
//    Lemmings with splat (fall > 20 cycles = death):
//  
//    (Extends Lemmings3 FSM)
//  
//    FALL states: count falling cycles
//      If fall_count > 20 when ground=1 → SPLAT
//      If fall_count <= 20 when ground=1 → resume walking
//  
//       ┌───────────┐
//       │ FALLING   │ count cycles
//       │ aaah=1    │
//       └─────┬─────┘
//             │ ground=1
//             ▼
//       count <= 20?  ──yes──► WALK (resume)
//             │
//             no
//             ▼
//       ┌───────────┐
//       │  SPLAT    │ all outputs = 0
//       │  (dead)   │ stays here forever
//       └───────────┘ (until reset)
//
// ──────────────────────────────────────────────────────────────────────────
// HINT:
// Use the FSM to control a counter that tracks how long the Lemming has been
// falling.
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module(
    input clk,
    input areset,    // Freshly brainwashed Lemmings walk left.
    input bump_left,
    input bump_right,
    input ground,
    input dig,
    output walk_left,
    output walk_right,
    output aaah,
    output digging );

endmodule
