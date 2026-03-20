#!/usr/bin/env python3
"""ASCII art diagrams for HDLBits exercises, keyed by image filename."""

DIAGRAMS = {

# ═══════════════════════════════════════════════════════════════════
# BASIC WIRES AND GATES
# ═══════════════════════════════════════════════════════════════════

"Wire.png": """\
  ┌──────────────────────────────────────────┐
  │  top_module                              │
  │                                          │
  │  in ──────────────────────────────── out  │
  │           (assign out = in;)             │
  │                                          │
  └──────────────────────────────────────────┘""",

"Wire4.png": """\
  ┌──────────────────────────────────────────┐
  │  top_module                              │
  │                                          │
  │  a ─────────────────────────────────► w  │
  │          ┌──────────────────────────► x  │
  │  b ──────┤                               │
  │          └──────────────────────────► y  │
  │  c ─────────────────────────────────► z  │
  │                                          │
  └──────────────────────────────────────────┘""",

"Notgate.png": """\
  ┌──────────────────────────────────────────┐
  │  top_module                              │
  │                    ┌───┐                 │
  │  in ──────────────►│NOT├──o────────► out │
  │                    └───┘                 │
  └──────────────────────────────────────────┘""",

"Andgate.png": """\
  ┌──────────────────────────────────────────┐
  │  top_module                              │
  │                    ┌───┐                 │
  │  a ───────────────►│AND├───────────► out │
  │  b ───────────────►│   │                 │
  │                    └───┘                 │
  └──────────────────────────────────────────┘""",

"Norgate.png": """\
  ┌──────────────────────────────────────────┐
  │  top_module                              │
  │                    ┌───┐                 │
  │  a ───────────────►│NOR├──o────────► out │
  │  b ───────────────►│   │                 │
  │                    └───┘                 │
  └──────────────────────────────────────────┘""",

"Xnorgate.png": """\
  ┌──────────────────────────────────────────┐
  │  top_module                              │
  │                    ┌────┐                │
  │  a ───────────────►│XNOR├──o───────► out │
  │  b ───────────────►│    │                │
  │                    └────┘                │
  └──────────────────────────────────────────┘""",

"Wiredecl1.png": """\
  ┌────────────────────────────────────────────┐
  │  top_module                                │
  │                                            │
  │  in ────────►(wire)────────────────► out   │
  │                                            │
  │  Declaring intermediate wires:             │
  │  wire my_wire;                             │
  │  assign my_wire = in;                      │
  │  assign out = my_wire;                     │
  └────────────────────────────────────────────┘""",

"Wiredecl2.png": """\
  ┌────────────────────────────────────────────────────┐
  │  top_module                                        │
  │                                                    │
  │  a ─────┐      ┌───┐                ┌───┐         │
  │         ├─────►│AND├──── wire ──────►│AND├────► out│
  │  b ─────┘      └───┘     ab         │   │         │
  │  c ─────┐      ┌───┐                │   │         │
  │         ├─────►│AND├──── wire ──────►│   │         │
  │  d ─────┘      └───┘     cd         └───┘         │
  │                                                    │
  └────────────────────────────────────────────────────┘""",

# ═══════════════════════════════════════════════════════════════════
# CHIP DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"7458.png": """\
  ┌─────────────────────────────────────────────────────────┐
  │  7458 chip                                              │
  │                                                         │
  │  p1a ──►┐                                               │
  │  p1b ──►├──►[AND]──┐                                    │
  │  p1c ──►┘          ├──►[OR]──────────────────────► p1y  │
  │  p1d ──►┐          │                                    │
  │  p1e ──►├──►[AND]──┘                                    │
  │  p1f ──►┘                                               │
  │                                                         │
  │  p2a ──►┐                                               │
  │         ├──►[AND]──┐                                    │
  │  p2b ──►┘          ├──►[OR]──────────────────────► p2y  │
  │  p2c ──►┐          │                                    │
  │         ├──►[AND]──┘                                    │
  │  p2d ──►┘                                               │
  │                                                         │
  │  p1y = (p1a & p1b & p1c) | (p1d & p1e & p1f)           │
  │  p2y = (p2a & p2b) | (p2c & p2d)                       │
  └─────────────────────────────────────────────────────────┘""",

"7420.png": """\
  ┌───────────────────────────────────────────────┐
  │  7420 chip (dual 4-input NAND)                │
  │                                               │
  │  p1a ──►┐                                     │
  │  p1b ──►├──►[NAND]────────────────────► p1y   │
  │  p1c ──►│                                     │
  │  p1d ──►┘                                     │
  │                                               │
  │  p2a ──►┐                                     │
  │  p2b ──►├──►[NAND]────────────────────► p2y   │
  │  p2c ──►│                                     │
  │  p2d ──►┘                                     │
  │                                               │
  │  p1y = ~(p1a & p1b & p1c & p1d)               │
  │  p2y = ~(p2a & p2b & p2c & p2d)               │
  └───────────────────────────────────────────────┘""",

# ═══════════════════════════════════════════════════════════════════
# VECTOR DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"Vector0.png": """\
     3-bit vector:  vec[2:0]

   ┌─────────────────────────────────────────────────┐
   │                                                 │
   │  vec[0] ─── ┐                                   │
   │  vec[1] ─── ├─── vec[2:0] ═══════► (3-bit bus)  │
   │  vec[2] ─── ┘                                   │
   │                                                 │
   │  ═══ indicates a multi-bit bus (vector)         │
   │  ─── indicates a single wire                    │
   └─────────────────────────────────────────────────┘""",

"Vector3.png": """\
  Vector concatenation operator { }:

  {5'b11111, 3'b000}           = 8'b11111_000
  {1'b1, 1'b0, 3'b101}        = 5'b10_101
  {4'ha, 4'd10}               = 8'b1010_1010

  ┌─────────────────────────────────────────────────┐
  │  input [15:0] a, b;                             │
  │  input [7:0]  c;                                │
  │                                                 │
  │  {a, b}      = 32-bit concatenation             │
  │  {a[7:0], c} = 16-bit concatenation             │
  └─────────────────────────────────────────────────┘""",

"Vector5.png": """\
  Replication operator:  {num{vector}}

  {5{1'b1}}         = 5'b11111
  {2{a,b,c}}        = {a,b,c,a,b,c}
  {3'd5, {2{3'd6}}} = 9'b101_110_110

  Sign extension example:
  ┌─────────────────────────────────────────────────┐
  │  wire [7:0] a;                                  │
  │  wire [23:0] b = {{16{a[7]}}, a};               │
  │                   ▲                             │
  │        sign bit replicated 16 times             │
  └─────────────────────────────────────────────────┘""",

"Vectorgates.png": """\
  ┌──────────────────────────────────────────────────────┐
  │  Bitwise vs. Logical operations on vectors           │
  │                                                      │
  │  a[2:0] = 3'b110                                    │
  │  b[2:0] = 3'b100                                    │
  │                                                      │
  │  Bitwise AND:  a & b  = 3'b100  (bit-by-bit)        │
  │  Bitwise OR:   a | b  = 3'b110                      │
  │  Bitwise XOR:  a ^ b  = 3'b010                      │
  │  Bitwise NOT:  ~a     = 3'b001                      │
  │                                                      │
  │  Logical AND:  a && b = 1'b1    (result is 1 bit)   │
  │  Logical OR:   a || b = 1'b1                        │
  │  Logical NOT:  !a     = 1'b0                        │
  └──────────────────────────────────────────────────────┘""",

# ═══════════════════════════════════════════════════════════════════
# MODULE DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"Module_moda.png": """\
  ┌────────────────┐
  │     mod_a      │
  │                │
  │  in1 ─►   ─►out│
  │  in2 ─►       │
  └────────────────┘""",

"Module.png": """\
  ┌─────────────────────────────────────────────────────────┐
  │  top_module                                             │
  │                    ┌──────────────┐                     │
  │                    │    mod_a     │                      │
  │  a ───────────────►│in1      out ─├──────────────── out  │
  │  b ───────────────►│in2           │                     │
  │                    └──────────────┘                     │
  └─────────────────────────────────────────────────────────┘""",

"Module_pos.png": """\
  ┌───────────────────────────────────────────────────────┐
  │  top_module                                           │
  │  Connect by position:                                 │
  │  mod_a inst1 ( wa, wb, wc );                          │
  │                                                       │
  │                  ┌──────────────┐                      │
  │  a ─────────────►│in1      out ─├──────────────── out  │
  │  b ─────────────►│in2           │                      │
  │                  └──────────────┘                      │
  │  Position:        (1st) (2nd) (3rd)                    │
  └───────────────────────────────────────────────────────┘""",

"Module_name.png": """\
  ┌───────────────────────────────────────────────────────┐
  │  top_module                                           │
  │  Connect by name:                                     │
  │  mod_a inst1 ( .out(wc), .in1(wa), .in2(wb) );       │
  │                                                       │
  │                  ┌──────────────┐                      │
  │  a ─────────────►│in1      out ─├──────────────── out  │
  │  b ─────────────►│in2           │                      │
  │                  └──────────────┘                      │
  │  Names:   .in1(a)  .in2(b)  .out(out)                 │
  └───────────────────────────────────────────────────────┘""",

"Module_shift.png": """\
  ┌────────────────────────────────────────────────────────────────┐
  │  top_module                                                    │
  │                                                                │
  │        ┌────────┐    ┌────────┐    ┌────────┐                  │
  │  d ───►│ my_dff │───►│ my_dff │───►│ my_dff │─────────── q     │
  │        │  d   q │    │  d   q │    │  d   q │                  │
  │        │  clk   │    │  clk   │    │  clk   │                  │
  │        └───┬────┘    └───┬────┘    └───┬────┘                  │
  │            │             │             │                        │
  │  clk ──────┴─────────────┴─────────────┘                       │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘""",

"Module_shift8.png": """\
  ┌──────────────────────────────────────────────────────────────────┐
  │  top_module                                                      │
  │                                                                  │
  │         ┌──────────┐   ┌──────────┐   ┌──────────┐              │
  │  d ════►│ my_dff8  │══►│ my_dff8  │══►│ my_dff8  │══════► q     │
  │  [7:0]  │ d[7:0] q │   │ d[7:0] q │   │ d[7:0] q │  [7:0]      │
  │         │   clk    │   │   clk    │   │   clk    │              │
  │         └────┬─────┘   └────┬─────┘   └────┬─────┘              │
  │              │              │              │                      │
  │  clk ────────┴──────────────┴──────────────┘                      │
  │                                                                  │
  │  (═══ denotes 8-bit bus)                                         │
  └──────────────────────────────────────────────────────────────────┘""",

"Module_add.png": """\
  ┌──────────────────────────────────────────────────────────────┐
  │  top_module                                                  │
  │                                                              │
  │              ┌────────────┐                                  │
  │  a[15:0] ═══►│   add16    │                                  │
  │  b[15:0] ═══►│ a    sum ──├═══════════════════════► sum[15:0]│
  │              │ b         │                                   │
  │         0 ──►│ cin       │                                   │
  │              └────────────┘                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘""",

"Module_fadd.png": """\
  ┌────────────────────────────────────────────────────────────────────┐
  │  top_module                                                        │
  │                                                                    │
  │             ┌──────────┐          ┌──────────┐                     │
  │  a[15:0]═══►│  add16   │          │  add16   │                     │
  │  b[15:0]═══►│a    sum──├═► ══════►│a    sum──├═══►sum[31:16]       │
  │             │b         │          │b         │                     │
  │        cin─►│cin   cout├────────►│cin   cout├────►cout             │
  │             └──────────┘          └──────────┘                     │
  │                                                                    │
  │  sum[15:0] from first add16, sum[31:16] from second                │
  │  cout of first add16 connects to cin of second add16               │
  └────────────────────────────────────────────────────────────────────┘""",

"Module_cseladd.png": """\
  ┌──────────────────────────────────────────────────────────────────┐
  │  top_module (Carry-Select Adder)                                 │
  │                                                                  │
  │             ┌──────────┐                                         │
  │  a[15:0]═══►│  add16   │═══► sum[15:0]                           │
  │  b[15:0]═══►│a    sum  │                                         │
  │        0───►│cin  cout─├──────────────────────── sel             │
  │             └──────────┘                          │               │
  │                                                   ▼               │
  │             ┌──────────┐                    ┌──────────┐         │
  │  a[31:16]══►│  add16   │═══►sum0 ══════════►│0         │         │
  │  b[31:16]══►│a    sum  │                    │   MUX    │══►sum[31:16]
  │        0───►│cin       │                    │          │         │
  │             └──────────┘                    │1         │         │
  │             ┌──────────┐                    │          │         │
  │  a[31:16]══►│  add16   │═══►sum1 ══════════►│          │         │
  │  b[31:16]══►│a    sum  │                    └──────────┘         │
  │        1───►│cin       │                                         │
  │             └──────────┘                                         │
  └──────────────────────────────────────────────────────────────────┘""",

"Module_addsub.png": """\
  ┌───────────────────────────────────────────────────────────────┐
  │  top_module (Adder-Subtractor)                                │
  │                                                               │
  │              ┌───────────────────────────────┐                │
  │              │  32x XOR gates                │                │
  │  b[31:0]════►│  b[i] ^ sub ────────► b_xor  │                │
  │  sub ───────►│                               │                │
  │              └───────────────┬───────────────┘                │
  │                              ║                                │
  │              ┌──────────┐    ║    ┌──────────┐                │
  │  a[15:0]════►│  add16   │    ║    │  add16   │                │
  │  b_xor[15:0]►│a    sum──├═══►║══►│a    sum──├══►sum[31:16]   │
  │              │b         │    ║    │b         │                │
  │  sub ───────►│cin  cout─├────╨──►│cin       │                │
  │              └──────────┘         └──────────┘                │
  │              sum[15:0]                                        │
  │                                                               │
  │  When sub=0: sum = a + b        (add)                         │
  │  When sub=1: sum = a + ~b + 1   (subtract, two's complement) │
  └───────────────────────────────────────────────────────────────┘""",

"Module_addsub_xor.png": """\
  XOR as programmable inverter:

  b ────►┌─────┐
         │ XOR ├────► output
  sub ──►└─────┘

  sub=0:  output = b      (pass through)
  sub=1:  output = ~b     (invert)""",

# ═══════════════════════════════════════════════════════════════════
# PROCEDURE DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"Alwayscomb.png": """\
  Combinational: assign vs. always @(*)

  ┌───────────────────────────┐    ┌───────────────────────────┐
  │  Using assign:            │    │  Using always block:      │
  │                           │    │                           │
  │  assign out = a & b;      │    │  always @(*) begin        │
  │                           │    │      out = a & b;         │
  │  a ──►┌─────┐             │    │  end                      │
  │       │ AND ├──► out      │    │                           │
  │  b ──►└─────┘             │    │  (Same circuit!)          │
  └───────────────────────────┘    └───────────────────────────┘

  Both produce identical hardware""",

"Alwaysff.png": """\
  Sequential: always @(posedge clk)

  ┌─────────────────────────────────────────────┐
  │                                             │
  │       ┌─────┐       ┌──────┐                │
  │  a ──►│     │       │      │──► out         │
  │       │ AND ├──────►│ D  Q │                │
  │  b ──►│     │       │      │                │
  │       └─────┘       │  >   │                │
  │                     └──┬───┘                │
  │                        │                    │
  │  clk ──────────────────┘                    │
  │                                             │
  │  always @(posedge clk) out <= a & b;        │
  └─────────────────────────────────────────────┘""",

"Always_if_mux.png": """\
  if statement = 2-to-1 multiplexer:

  ┌─────────────────────────────────────────────┐
  │                                             │
  │         ┌────────┐                          │
  │  a ────►│ 1      │                          │
  │         │   MUX  ├──────────────────► out   │
  │  b ────►│ 0      │                          │
  │         └───┬────┘                          │
  │             │                               │
  │  sel ───────┘                               │
  │                                             │
  │  if (sel) out = a;                          │
  │  else     out = b;                          │
  └─────────────────────────────────────────────┘""",

"Always_if2.png": """\
  Cascaded if-else = priority multiplexer:

  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │  a ──►│1│──►│1│──►│1│                             │
  │       │M│   │M│   │M│────────────────► out        │
  │  b ──►│0│   │0│   │0│                             │
  │       └┬┘   └┬┘   └┬┘                             │
  │        │     │     │                               │
  │      sel0  sel1  sel2                              │
  │                                                   │
  │  if (sel0) out = a;                               │
  │  else if (sel1) out = a;                          │
  │  else if (sel2) out = a;                          │
  │  else out = b;  // default (avoids latches!)      │
  └───────────────────────────────────────────────────┘""",

# ═══════════════════════════════════════════════════════════════════
# FSM DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"Fsm1.png": """\
  Moore FSM (2 states, async reset to B):

                       in=1
                ┌────────────────────┐
                │     in=0           ▼
          ┌─────┴─────┐        ┌───────────┐
  reset──►│ B (out=1) │◄──────│ A (out=0) │
          └───────────┘  in=0  └─────┬─────┘
                                     │ in=1
                                     └──┐
                                        │
                                ┌───────┘
                                ▼
                          ┌───────────┐
                          │ B (out=1) │
                          └───────────┘""",

"Fsm1s.png": """\
  Moore FSM (2 states, synchronous reset to B):

                       in=1
                ┌────────────────────┐
                │     in=0           ▼
          ┌─────┴─────┐        ┌───────────┐
  reset──►│ B (out=1) │◄──────│ A (out=0) │──┐
          └───────────┘  in=0  └───────────┘  │
                                    ▲  in=1   │
                                    └─────────┘""",

"Fsmjk.png": """\
  2-state Moore FSM (JK flip-flop style):

               j=0,k=0           j=0,k=0
                 ┌──┐               ┌──┐
                 │  ▼               │  ▼
           ┌───────────┐      ┌───────────┐
  reset───►│OFF (out=0)│      │ON  (out=1)│
           └─────┬─────┘      └─────┬─────┘
                 │   j=1 (set)      │
                 ├──────────────────►│
                 │   k=1 (reset)    │
                 │◄─────────────────┤
                 │   j=1,k=1(toggle)│
                 │◄────────────────►│""",

"Fsmjks.png": """\
  (Same as Fsmjk but with synchronous reset)

               j=0,k=0           j=0,k=0
                 ┌──┐               ┌──┐
                 │  ▼               │  ▼
           ┌───────────┐      ┌───────────┐
  reset───►│OFF (out=0)│      │ON  (out=1)│
           └─────┬─────┘      └─────┬─────┘
                 │   j=1 (set)      │
                 ├──────────────────►│
                 │   k=1 (reset)    │
                 │◄─────────────────┤
                 │   j=1,k=1(toggle)│
                 │◄────────────────►│""",

"Fsm3.png": """\
  4-state Moore FSM:

  State transition table:
  ┌───────┬──────────────┬────────┐
  │ State │  Next state  │ Output │
  │       │ in=0 │ in=1  │  out   │
  ├───────┼──────┼───────┼────────┤
  │   A   │  A   │   B   │   0    │
  │   B   │  C   │   B   │   0    │
  │   C   │  A   │   D   │   0    │
  │   D   │  C   │   B   │   1    │
  └───────┴──────┴───────┴────────┘

         in=0    in=1    in=0
   ┌──►A ────► B ────► ? ────► ...
   │  out=0
  reset""",

"Fsmonehot.png": """\
  One-hot FSM with 10 states (S0-S9):
  (Derive logic equations by inspection)

  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐
  │ S0 │──│ S1 │──│ S2 │──│ S3 │──│ S4 │
  └────┘  └────┘  └────┘  └────┘  └────┘
     │                                │
     ▼                                ▼
  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐
  │ S5 │──│ S6 │──│ S7 │──│ S8 │──│ S9 │
  └────┘  └────┘  └────┘  └────┘  └────┘

  state[0]=S0, state[1]=S1, ..., state[9]=S9
  Derive next_state and output logic equations.""",

"Fsm_ps2.png": """\
  PS/2 Packet Parser FSM:

     ┌──────────┐  in[3]=1  ┌──────────┐         ┌──────────┐
     │  IDLE    │─────────►│  BYTE1   │────────►│  BYTE2   │
     │          │◄─────────│          │         │          │
     └────┬─────┘  in[3]=0 └──────────┘         └────┬─────┘
          │                                          │
          │   ┌──────────┐                           │
          │   │  DONE    │◄──────────────────────────┘
          └──►│ done=1   │
              └──────────┘

  Wait for byte with bit[3]=1, then count 3 bytes, assert done.""",

"Fsm_hdlc.png": """\
  HDLC Framing FSM:
  Detect: 0111110 (disc), 01111110 (flag), 01111111... (err)

  ┌────┐ 1 ┌────┐ 1 ┌────┐ 1 ┌────┐ 1 ┌────┐ 1 ┌────┐
  │ S0 ├──►│ S1 ├──►│ S2 ├──►│ S3 ├──►│ S4 ├──►│ S5 │
  └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘   └──┬─┘
     │0       │0       │0       │0       │0       │
     ▼        ▼        ▼        ▼        ▼        │
    S0       S0    (back to S0)                 1│    │0
                                                 ▼    ▼
  After 5 ones:                               ┌────┐┌──────┐
    +0  → disc (discard)                      │ S6 ││disc  │
    +10 → flag (frame boundary)               └──┬─┘└──────┘
    +11... → err (error)                         │
                                              1│ │0
                                               ▼  ▼
                                            ┌────┐┌──────┐
                                            │err ││flag  │
                                            └────┘└──────┘""",

"Lemmings1.png": """\
  Lemmings 2-state FSM:

                bump_right
           ┌────────────────────────┐
           │                        │
           ▼      bump_left         │
     ┌───────────┐            ┌───────────┐
     │WALK_LEFT  │────────────►│WALK_RIGHT │
     │walk_left=1│            │walk_left=0│
     └───────────┘            └───────────┘
           ▲                        │
           │      bump_right        │
           └────────────────────────┘

  Both bumps at same time → still switch direction""",

"Lemmings2.png": """\
  Lemmings 4-state FSM (with falling):

     ┌───────────┐  bump   ┌───────────┐
     │WALK_LEFT  │◄───────►│WALK_RIGHT │
     │walk_left=1│         │walk_left=0│
     └─────┬─────┘         └─────┬─────┘
           │ ground=0            │ ground=0
           ▼                     ▼
     ┌───────────┐         ┌───────────┐
     │FALL_LEFT  │         │FALL_RIGHT │
     │ aaah=1    │         │ aaah=1    │
     └─────┬─────┘         └─────┬─────┘
           │ ground=1            │ ground=1
           ▼                     ▼
     WALK_LEFT             WALK_RIGHT
  Resume walking in same direction after fall""",

"Lemmings3.png": """\
  Lemmings 6-state FSM (with digging):

     ┌───────────┐  bump   ┌───────────┐
     │WALK_LEFT  │◄───────►│WALK_RIGHT │
     └──┬──┬─────┘         └──┬──┬─────┘
        │  │ dig=1             │  │ dig=1
  gnd=0│  ▼                   │  ▼
        │ ┌──────────┐        │ ┌──────────┐
        │ │DIG_LEFT  │        │ │DIG_RIGHT │
        │ │digging=1 │        │ │digging=1 │
        │ └────┬─────┘        │ └────┬─────┘
        │      │gnd=0          │     │gnd=0
        ▼      ▼               ▼     ▼
     ┌───────────┐         ┌───────────┐
     │FALL_LEFT  │         │FALL_RIGHT │
     │ aaah=1    │         │ aaah=1    │
     └─────┬─────┘         └─────┬─────┘
           │ gnd=1               │ gnd=1
           ▼                     ▼
      WALK_LEFT             WALK_RIGHT

  Priority: fall > dig > switch direction""",

"Lemmings4.png": """\
  Lemmings with splat (fall > 20 cycles = death):

  (Extends Lemmings3 FSM)

  FALL states: count falling cycles
    If fall_count > 20 when ground=1 → SPLAT
    If fall_count <= 20 when ground=1 → resume walking

     ┌───────────┐
     │ FALLING   │ count cycles
     │ aaah=1    │
     └─────┬─────┘
           │ ground=1
           ▼
     count <= 20?  ──yes──► WALK (resume)
           │
           no
           ▼
     ┌───────────┐
     │  SPLAT    │ all outputs = 0
     │  (dead)   │ stays here forever
     └───────────┘ (until reset)""",

# ═══════════════════════════════════════════════════════════════════
# FLIP-FLOP AND SEQUENTIAL DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"Dff.png": """\
  D Flip-Flop:

        ┌──────┐
  d ───►│D    Q├───► q
        │      │
  clk ─►│>     │
        └──────┘

  always @(posedge clk)
      q <= d;""",

"Lfsr5.png": """\
  5-bit Galois LFSR (taps at positions 5 and 3):

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  ┌───┐    ┌───┐   ┌───┐    ┌───┐    ┌───┐           │
  │  │q[1]│◄──│q[2]│◄─│q[3]│◄──│q[4]│◄──│q[5]│◄─── 0   │
  │  └─┬──┘   └─┬──┘  └─┬──┘   └─┬──┘   └─┬──┘    ▲    │
  │    │        │       │  ▲     │        │        │    │
  │    │        │      ┌┴──┴┐    │        │        │    │
  │    │        │      │XOR │    │        │        │    │
  │    │        │      └────┘    │        │        │    │
  │    │        │        ▲      │        │        │    │
  │    ▼        └────────┼──────┴────────┴────────┘    │
  │   out                │                             │
  │                      └── q[1] (feedback)           │
  │                                                    │
  │  Tap at position 3: q[3] XOR q[1]                  │
  │  Tap at position 5: q[5] XOR q[1] (but input=0)   │
  │  Reset value: 5'b00001                             │
  └──────────────────────────────────────────────────────┘""",

# ═══════════════════════════════════════════════════════════════════
# KARNAUGH MAPS
# ═══════════════════════════════════════════════════════════════════

"Kmap1.png": """\
  3-variable Karnaugh Map:

            ab
        00  01  11  10
      ┌────┬────┬────┬────┐
  c=0 │    │    │    │    │
      ├────┼────┼────┼────┤
  c=1 │    │    │    │    │
      └────┴────┴────┴────┘

  (See the HDLBits page for the exact cell values)
  Simplify using K-map grouping.""",

"Kmap2.png": """\
  4-variable Karnaugh Map:

              cd
          00   01   11   10
        ┌─────┬─────┬─────┬─────┐
  ab=00 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=01 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=11 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=10 │     │     │     │     │
        └─────┴─────┴─────┴─────┘

  (See the HDLBits page for the exact cell values)
  Simplify to SOP or POS form.""",

"Kmap3.png": """\
  4-variable Karnaugh Map (2):

              cd
          00   01   11   10
        ┌─────┬─────┬─────┬─────┐
  ab=00 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=01 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=11 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=10 │     │     │     │     │
        └─────┴─────┴─────┴─────┘

  (See the HDLBits page for the exact cell values)
  Simplify to SOP or POS form.""",

"Kmap4.png": """\
  4-variable Karnaugh Map (3):
  Hint: output toggles when any single input changes

              cd
          00   01   11   10
        ┌─────┬─────┬─────┬─────┐
  ab=00 │  0  │  1  │  0  │  1  │
        ├─────┼─────┼─────┼─────┤
  ab=01 │  1  │  0  │  1  │  0  │
        ├─────┼─────┼─────┼─────┤
  ab=11 │  0  │  1  │  0  │  1  │
        ├─────┼─────┼─────┼─────┤
  ab=10 │  1  │  0  │  1  │  0  │
        └─────┴─────┴─────┴─────┘

  f = a ^ b ^ c ^ d  (4-input XOR)""",

# ═══════════════════════════════════════════════════════════════════
# TRUTH TABLE
# ═══════════════════════════════════════════════════════════════════

"Truthtable1.png": """\
  Truth table (3 inputs, 1 output):

  ┌─────┬────┬────┬────┬─────┐
  │ Row │ x3 │ x2 │ x1 │  f  │
  ├─────┼────┼────┼────┼─────┤
  │  0  │  0 │  0 │  0 │  0  │
  │  1  │  0 │  0 │  1 │  0  │
  │  2  │  0 │  1 │  0 │  1  │
  │  3  │  0 │  1 │  1 │  1  │
  │  4  │  1 │  0 │  0 │  0  │
  │  5  │  1 │  0 │  1 │  1  │
  │  6  │  1 │  1 │  0 │  0  │
  │  7  │  1 │  1 │  1 │  1  │
  └─────┴────┴────┴────┴─────┘

  f = 1 for rows: 2, 3, 5, 7""",

"Ringer.png": """\
  Phone ringer / vibrate:

  ┌─────────────────────────────────────────┐
  │  Inputs:     ring, vibrate_mode         │
  │  Outputs:    ringer, motor              │
  │                                         │
  │  ring=0: ringer=0, motor=0 (off)        │
  │  ring=1, vibrate_mode=0: ringer=1       │
  │  ring=1, vibrate_mode=1: motor=1        │
  │                                         │
  │  ringer = ring & ~vibrate_mode           │
  │  motor  = ring &  vibrate_mode           │
  └─────────────────────────────────────────┘""",

# ═══════════════════════════════════════════════════════════════════
# EXAM CIRCUIT DIAGRAMS
# ═══════════════════════════════════════════════════════════════════

"Exams_m2014q4h.png": """\
  Simple wire:

  in ──────────────────────► out""",

"Exams_m2014q4i.png": """\
  GND (constant 0):

  GND ─── 0 ──────────────► out""",

"Exams_m2014q4e.png": """\
  NOR gate:

  a ──►┌─────┐
       │ NOR ├──o──► out
  b ──►└─────┘

  out = ~(a | b)""",

"Exams_m2014q4f.png": """\
  AND gate with inverted input:

  a ──o──►┌─────┐
          │ AND ├──────► out
  b ─────►└─────┘

  out = (~a) & b""",

"Exams_m2014q4g.png": """\
  Two gates:

  a ──►┌─────┐
       │ NOR ├──►┌─────┐
  b ──►└─────┘   │ AND ├──────► out
  c ────────────►└─────┘

  out = ~(a | b) & c""",

"Exams_m2014q4j.png": """\
  2-bit adder:

  a ──►┌──────────┐
       │  + (add) ├──► sum
  b ──►└──────────┘""",

"Exams_m2014q4a.png": """\
  D Latch (level-sensitive):

        ┌──────┐
  d ───►│D    Q├───► q
        │      │
  ena ─►│EN    │
        └──────┘

  When ena=1: q follows d
  When ena=0: q holds previous value""",

"Exams_m2014q4b.png": """\
  D Flip-Flop (edge-triggered):

        ┌──────┐
  d ───►│D    Q├───► q
        │      │
  clk ─►│>     │
        └──────┘

  Captures d on positive edge of clk.""",

"Exams_m2014q4c.png": """\
  D Flip-Flop with enable:

        ┌──────┐
  d ───►│D    Q├───► q
        │      │
  clk ─►│>     │
        │      │
  ena ─►│EN    │
        └──────┘""",

"Exams_m2014q4d.png": """\
  D Flip-Flop + gate:

           ┌─────┐   ┌──────┐
  in ─────►│ XOR ├──►│D    Q├───┬──► out
           │     │   │      │   │
           └──┬──┘   │  >   │   │
              │      └──┬───┘   │
              │         │       │
              └─────────┤       │
  clk ──────────────────┘       │
        q feeds back to XOR

  out = q;  d = in ^ q""",

"Exams_m2014q4k.png": """\
  Shift register:

        ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
  in ──►│D    Q├───►│D    Q├───►│D    Q├───►│D    Q├──►out
        │  >   │    │  >   │    │  >   │    │  >   │
        └──┬───┘    └──┬───┘    └──┬───┘    └──┬───┘
           │           │           │           │
  clk ─────┴───────────┴───────────┴───────────┘""",

"Exams_m2014q3.png": """\
  Karnaugh Map (exam question):

              cd
          00   01   11   10
        ┌─────┬─────┬─────┬─────┐
  ab=00 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=01 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=11 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=10 │     │     │     │     │
        └─────┴─────┴─────┴─────┘

  (See the HDLBits page for exact cell values)""",

"Exams_2012q1g.png": """\
  Karnaugh Map (exam 2012):

              cd
          00   01   11   10
        ┌─────┬─────┬─────┬─────┐
  ab=00 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=01 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=11 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=10 │     │     │     │     │
        └─────┴─────┴─────┴─────┘

  (See the HDLBits page for exact cell values)""",

"Ece241_2014_q3.png": """\
  K-map for implementation with multiplexer:

              cd
          00   01   11   10
        ┌─────┬─────┬─────┬─────┐
  ab=00 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=01 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=11 │     │     │     │     │
        ├─────┼─────┼─────┼─────┤
  ab=10 │     │     │     │     │
        └─────┴─────┴─────┴─────┘

  (See the HDLBits page for exact values)""",

"Ece241_2014_q3mux.png": """\
  Multiplexer implementation of K-map:

  c ──────►┌──────────┐
  d ──────►│ 4-to-1   │
           │   MUX    ├──────────► mux_in[ab]
  mux_in──►│          │
           └──────────┘

  mux_in values depend on ab: connect to 0, 1, c, d, ~c, ~d""",

"Ece241_2014_q4.png": """\
  DFFs and gates:

      ┌─────┐    ┌──────┐    ┌─────┐    ┌──────┐
  x──►│ XOR ├───►│D    Q├───►│ XOR ├───►│D    Q├──►z
      └──┬──┘    │  >   │    └──┬──┘    │  >   │
         │       └──┬───┘       │       └──┬───┘
         │          │           │           │
         └──────────┘           └───────────┘
              (feedback)            (feedback)
  clk ─────────────┴───────────────────────────┘""",

"Mt2015_muxdff.png": """\
  Mux + DFF submodule:

           ┌──────┐   ┌──────┐
  d ──────►│ 0    │   │      │
           │ MUX  ├──►│D    Q├──┬──► q
  r ──────►│ 1    │   │      │  │
           └──┬───┘   │  >   │  │
              │       └──┬───┘  │
  sel ────────┘          │      │
                         │      │
  clk ───────────────────┘      │""",

"Mt2015_q4.png": """\
  Top-level circuit using mux-dff submodules:

  (Uses the Mt2015_muxdff submodule)
  Three instances of the mux+DFF submodule chained together.""",

"Mt2015_q4b.png": """\
  Sequential circuit with mux and DFFs:

  (Variation of mt2015_q4 - see HDLBits page for details)""",

"Exams_2014q4.png": """\
  Mux + DFF circuit (exam question):

           ┌──────┐   ┌──────┐
  d ──────►│ 0    │   │      │
           │ MUX  ├──►│D    Q├──┬──► q
  ? ──────►│ 1    │   │      │  │
           └──┬───┘   │  >   │  │
              │       └──┬───┘  │
  sel ────────┘          │      │
  clk ───────────────────┘      │""",

"Exams_m2014q6.png": """\
  FSM state diagram (exam Q6):
  (See the HDLBits page for exact state transitions)

  Multiple states with transitions based on w input.
  One-hot encoding version also required.""",

"Exams_2014q3fsm.png": """\
  FSM diagram (exam 2014 Q3):
  (See the HDLBits page for exact state transitions)

  State machine with multiple states and transitions.""",

"Exams_2012q2.png": """\
  FSM diagram (exam 2012 Q2):
  (See the HDLBits page for exact state transitions)

  State machine with multiple states.
  Used for both Q2a (FSM) and Q2b (one-hot equations).""",

"Exams_2013q2.png": """\
  FSM diagram (exam 2013 Q2):
  (See the HDLBits page for exact state transitions)

  State machine with multiple states.""",

"Ece241_2013_q4.png": """\
  Moore FSM (ECE241 2013 Q4):
  (See the HDLBits page for exact state diagram)

  Design a Moore FSM with specified states and transitions.""",

"Ece241_2014_q5b.png": """\
  Mealy FSM - Serial two's complementer:

  ┌───────┐  x=0/0  ┌───────┐
  │       │◄────────│       │
  │   A   │         │   B   │
  │       │────────►│       │
  └───────┘  x=1/1  └───┬───┘
       ▲                │
       │   x=1/0        │ x=0/0
       └────────────────┘

  Format: input/output (Mealy)""",

"Exams_review2015_fsmonehot.png": """\
  FSM for review 2015 (one-hot):
  (See the HDLBits page for exact state diagram)

  FSM with multiple states, used for both:
  - review2015_fsm (complete FSM design)
  - review2015_fsmonehot (one-hot logic equations)""",

"Fsm_2bc.png": """\
  2-bit counter FSM:

  ┌────┐ +1  ┌────┐ +1  ┌────┐ +1  ┌────┐
  │ 00 ├────►│ 01 ├────►│ 10 ├────►│ 11 │
  └──┬─┘     └────┘     └────┘     └──┬─┘
     ▲                                │ +1
     └────────────────────────────────┘

  2-bit saturating counter for branch prediction""",

"Branch_predictor.png": """\
  Gshare branch predictor:

  ┌──────────────────────────────────────────────┐
  │  PC ═══►┌──────┐                             │
  │         │ XOR  │══► index ═══►┌───────┐      │
  │  GHR ══►└──────┘              │  PHT  │      │
  │                               │(table)│      │
  │         Global History Reg    │ 2-bit │      │
  │         (shift register)      │counters│     │
  │                               └───┬───┘      │
  │                                   │          │
  │                            prediction        │
  └──────────────────────────────────────────────┘""",

"Branch_history.png": """\
  Branch history shift register:

  ┌──────────────────────────────────────┐
  │  Global History Register             │
  │                                      │
  │  outcome ──►┌──┬──┬──┬──┬──┬──┬──┐  │
  │             │h7│h6│h5│h4│h3│h2│h1│  │
  │             └──┴──┴──┴──┴──┴──┴──┘  │
  │              shift left on branch    │
  │              new outcome enters h1   │
  └──────────────────────────────────────┘""",

# Lemmings GIF entries (brief description, PNG has the diagram)
"Lemmings.gif": """\
  Lemming animation: walks left/right, bumps change direction.""",

"Lemmings2.gif": """\
  Lemming animation: walks and falls when ground disappears.""",

"Lemmings3.gif": """\
  Lemming animation: walks, digs, and falls.""",

"Lemmings4.gif": """\
  Lemming animation: walks, digs, falls, and splats.""",

}
