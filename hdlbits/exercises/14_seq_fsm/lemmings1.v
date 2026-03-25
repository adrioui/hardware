// ==========================================================================
// HDLBits — Lemmings 1
// https://hdlbits.01xz.net/wiki/lemmings1
// ==========================================================================
//
// [Figure: Lemmings.gif]
//
// The game Lemmings involves critters with fairly simple brains. So simple
// that we are going to model it using a finite state machine.
//
// In the Lemmings' 2D world, Lemmings can be in one of two states: walking
// left or walking right. It will switch directions if it hits an obstacle. In
// particular, if a Lemming is bumped on the left, it will walk right. If it's
// bumped on the right, it will walk left. If it's bumped on both sides at the
// same time, it will still switch directions.
//
// Implement a Moore state machine with two states, two inputs, and one output
// that models this behaviour.
//
// { signal: [{ name: "clk", wave: "p.............." },
// { name: "bump_left",    wave: "0....10..1.0..." },
// { name: "bump_right",   wave: "0.10.....1.0..." },
// { name: "walk_left",    wave: "1.....0...10..." },
// { name: "walk_right",   wave: "0.....1...01..." } ] }
//
// See also: Lemmings2, Lemmings3, and Lemmings4.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lemmings.gif
//
//    Lemming animation: walks left/right, bumps change direction.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Lemmings1.png
//
//    Lemmings 2-state FSM:
//
//                  bump_right
//             ┌────────────────────────┐
//             │                        │
//             ▼      bump_left         │
//       ┌───────────┐            ┌───────────┐
//       │WALK_LEFT  │────────────►│WALK_RIGHT │
//       │walk_left=1│            │walk_left=0│
//       └───────────┘            └───────────┘
//             ▲                        │
//             │      bump_right        │
//             └────────────────────────┘
//
//    Both bumps at same time → still switch direction
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input areset,  // Freshly brainwashed Lemmings walk left.
    input bump_left,
    input bump_right,
    output walk_left,
    output walk_right
);
  //

  // parameter LEFT=0, RIGHT=1, ...
  reg state, next_state;

  always @(*) begin
    // State transition logic
  end

  always @(posedge clk, posedge areset) begin
    // State flip-flops with asynchronous reset
  end

  // Output logic
  // assign walk_left = (state == ...);
  // assign walk_right = (state == ...);

endmodule
