// ==========================================================================
// HDLBits — Gshare branch predictor
// https://hdlbits.01xz.net/wiki/cs450/gshare
// ==========================================================================
//
// Contents
//
// • 1 Branch direction predictor
//
// • 2 Gshare predictor
//
// • 2.1 References
//
// • 3 Description
//
// Branch direction predictor
//
// A branch direction predictor generates taken/not-taken predictions of the
// direction of conditional branch instructions. It sits near the front of the
// processor pipeline, and is responsible for directing instruction fetch down
// the (hopefully) correct program execution path. A branch direction predictor
// is usually used with a branch target buffer (BTB), where the BTB predicts
// the target addresses and the direction predictor chooses whether to branch
// to the target or keep fetching along the fall-through path.
//
// Sometime later in the pipeline (typically at branch execution or retire),
// the results of executed branch instructions are sent back to the branch
// predictor to train it to predict more accurately in the future by observing
// past branch behaviour. There can also be pipeline flushes when there is a
// mispredicted branch.
//
// [Figure: Branch_predictor.png]Branch direction predictor located in the
// Fetch stage. The branch predictor makes a prediction using the current pc
// and history register, with the result of the prediction affecting the next
// pc value. Training and misprediction requests come from later in the
// pipeline.
//
// For this exercise, the branch direction predictor is assumed to sit in the
// fetch stage of a hypothetical processor pipeline shown in the diagram on the
// right. This exercise builds only the branch direction predictor, indicated
// by the blue dashed rectangle in the diagram.
//
// The branch direction prediction is a combinational path: The `pc` register
// is used to compute the taken/not-taken prediction, which affects the next-pc
// multiplexer to determine the value of `pc` in the next cycle.
//
// Conversely, updates to the pattern history table (PHT) and branch history
// register take effect at the next positive clock edge, as would be expected
// for state stored in flip-flops.
//
// Gshare predictor
//
// Branch direction predictors are often structured as tables of counters
// indexed by the program counter and branch history. The table index is a hash
// of the branch address and history, and tries to give each branch and history
// combination its own table entry (or at least, reduce the number of
// collisions). Each table entry contains a two-bit saturating counter to
// remember the branch direction when the same branch and history pattern
// executed in the past.
//
// One example of this style of predictor is the gshare predictor[1]. In the
// gshare algorithm, the branch address (`pc`) and history bits "share" the
// table index bits. The basic gshare algorithm computes an N-bit PHT table
// index by xoring N branch address bits and N global branch history bits
// together.
//
// The N-bit index is then used to access one entry of a 2N-entry table of two-
// bit saturating counters. The value of this counter provides the prediction
// (0 or 1 = not taken, 2 or 3 = taken).
//
// Training indexes the table in a similar way. The training `pc` and history
// are used to compute the table index. Then, the two-bit counter at that index
// is incremented or decremented depending on the actual outcome of the branch.
//
// References
//
// • ↑ S. McFarling, "Combining Branch Predictors", *WRL Technical Note TN-36*, Jun. 1993
//
// Description
//
// Build a gshare branch predictor with 7-bit `pc` and 7-bit global history,
// hashed (using xor) into a 7-bit index. This index accesses a 128-entry table
// of two-bit saturating counters (similar to cs450/counter_2bc). The branch
// predictor should contain a 7-bit global branch history register (similar to
// cs450/history_shift).
//
// The branch predictor has two sets of interfaces: One for doing predictions
// and one for doing training. The prediction interface is used in the
// processor's Fetch stage to ask the branch predictor for branch direction
// predictions for the instructions being fetched. Once these branches proceed
// down the pipeline and are executed, the true outcomes of the branches become
// known. The branch predictor is then trained using the actual branch
// direction outcomes.
//
// When a branch prediction is requested (`predict_valid` = 1) for a given
// `pc`, the branch predictor produces the predicted branch direction and state
// of the branch history register used to make the prediction. The branch
// history register is then updated (at the next positive clock edge) for the
// predicted branch.
//
// When training for a branch is requested (`train_valid` = 1), the branch
// predictor is told the `pc` and branch history register value for the branch
// that is being trained, as well as the actual branch outcome and whether the
// branch was a misprediction (needing a pipeline flush). Update the pattern
// history table (PHT) to train the branch predictor to predict this branch
// more accurately next time. In addition, if the branch being trained is
// mispredicted, also recover the branch history register to the state
// immediately after the mispredicting branch completes execution.
//
// If training for a misprediction and a prediction (for a different, younger
// instruction) occurs in the same cycle, both operations will want to modify
// the branch history register. When this happens, training takes precedence,
// because the branch being predicted will be discarded anyway. If training and
// prediction of the same PHT entry happen at the same time, the prediction
// sees the PHT state before training because training only modifies the PHT at
// the next positive clock edge. The following timing diagram shows the timing
// when training and predicting PHT entry 0 at the same time.
// The training request at cycle 4 changes the PHT entry state in cycle 5, but
// the prediction request in cycle 4 outputs the PHT state at cycle 4, without
// considering the effect of the training request in cycle 4.
//
// { signal: [{ name: "clk", wave: "p........" },
// { name: "train_valid", wave: "0..1.0..." },
// { name: "train_pc ^ train_history", wave: "x..=.x...", data: ['0'] },
// { name: "train_taken", wave: "x..1.x...", node: "...a...." },
// { name: "pht[0]", wave: "=...==...", data: ['1', '2', '3'], node:"....b...."
// },
// { name: "predict_valid", wave: "0..1..0.." },
// { name: "predict_pc ^ predict_history", wave: "x..=..x..", data: ['0'] },
// { name: "predict_taken", wave:     "x..01.x..", node:"....c...." }
// ] ,
// edge: ['a-~>b train','b->c predict'],
// foot:{
// text:'Training and predicting using PHT entry 0 at the same time',
// tock:1
// },}
//
// `areset` is an asynchronous reset that clears the entire PHT to 2b'01 (weakly not-taken). It also clears the global history register to 0.
//
// ──────────────────────────────────────────────────────────────────────────
// DIAGRAM: Branch_predictor.png
//
//    Gshare branch predictor:
//
//    ┌──────────────────────────────────────────────┐
//    │  PC ═══►┌──────┐                             │
//    │         │ XOR  │══► index ═══►┌───────┐      │
//    │  GHR ══►└──────┘              │  PHT  │      │
//    │                               │(table)│      │
//    │         Global History Reg    │ 2-bit │      │
//    │         (shift register)      │counters│     │
//    │                               └───┬───┘      │
//    │                                   │          │
//    │                            prediction        │
//    └──────────────────────────────────────────────┘
//
// ──────────────────────────────────────────────────────────────────────────

// I AM NOT DONE

module top_module (
    input clk,
    input areset,

    input predict_valid,
    input [6:0] predict_pc,
    output predict_taken,
    output [6:0] predict_history,

    input train_valid,
    input train_taken,
    input train_mispredicted,
    input [6:0] train_history,
    input [6:0] train_pc
);

endmodule
