// ==========================================================================
// HDLBits — Lemmings 3
// https://hdlbits.01xz.net/wiki/lemmings3
// ==========================================================================
//
// See also: Lemmings1 and Lemmings2.
//
// In addition to walking and falling, Lemmings can sometimes be told to do
// useful things, like dig (it starts digging when `dig=1`). A Lemming can dig
// if it is currently walking on ground (`ground=1` and not falling), and will
// continue digging until it reaches the other side (`ground=0`). At that
// point, since there is no ground, it will fall (aaah!), then continue walking
// in its original direction once it hits ground again. As with falling, being
// bumped while digging has no effect, and being told to dig when falling or
// when there is no ground is ignored.
//
// (In other words, a walking Lemming can fall, dig, or switch directions. If
// more than one of these conditions are satisfied, fall has higher precedence
// than dig, which has higher precedence than switching directions.)
//
// Extend your finite state machine to model this behaviour.
//
// { signal: [
// { name: "clk", wave: "p............." },
// ['Inputs', { name: "bump_left",    wave: "0...10........" },
// { name: "bump_right",   wave: "0............." },
// { name: "ground",       wave: "1.....0..1...." },
// { name: "dig",          wave: "0.10.....10..." } ],
// ['Outputs', { name: "walk_left",    wave: "1..0......1..." },
// { name: "walk_right",   wave: "0............." },
// { name: "aaah",         wave: "0......1..0..." },
// { name: "digging",      wave: "0..1...0......" } ]
// ],
// foot:{
// tock:['', '', '','','bump ignored', '','', '', '', 'dig ignored', '', '']
// }
// }
//
// See also: Lemmings4.
//
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
