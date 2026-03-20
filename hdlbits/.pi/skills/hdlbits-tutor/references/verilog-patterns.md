# Verilog Patterns & Idioms Reference

## Wire Assignments

### Continuous Assignment
```verilog
assign out = a & b;           // AND gate
assign out = ~in;             // inverter
assign out = a ? b : c;       // ternary (mux)
assign out = a ^ b ^ cin;     // XOR chain
```
Use `assign` for combinational logic on `wire` types. Evaluated continuously.

### Multiple Drivers (avoid)
A `wire` may only have one driver. Multiple `assign` statements to the same wire cause compile errors.

---

## Always Blocks

### Combinational (`always @(*)`)
```verilog
always @(*) begin
    out = a & b;     // no clock; use blocking assignment (=)
end
```
Use `*` to auto-infer sensitivity list. Missing signals in the list cause latches.

### Clocked / Sequential (`always @(posedge clk)`)
```verilog
always @(posedge clk) begin
    q <= d;          // non-blocking assignment (<=) for flip-flops
end
```
Non-blocking (`<=`) prevents race conditions in clocked blocks. Always use it for sequential logic.

---

## If / Case / Casez

### If-Else
```verilog
always @(*) begin
    if (sel)
        out = a;
    else
        out = b;
end
```
Always provide an `else` branch in combinational blocks to avoid unintended latches.

### Case
```verilog
always @(*) begin
    case (sel)
        2'b00: out = a;
        2'b01: out = b;
        2'b10: out = c;
        default: out = d;   // required to avoid latches
    endcase
end
```

### Casez (don't-care bits with `?` or `z`)
```verilog
always @(*) begin
    casez (in)
        4'b1???: out = 3;
        4'b01??: out = 2;
        4'b001?: out = 1;
        default: out = 0;
    endcase
end
```
`?` matches 0, 1, or x/z. Useful for priority encoders.

---

## Module Instantiation

### Named Port Connection (preferred)
```verilog
mod_name u1 (
    .port_a(sig_a),
    .port_b(sig_b),
    .out(result)
);
```

### Positional Port Connection
```verilog
mod_name u1 (sig_a, sig_b, result);
```
Positional is error-prone for modules with many ports. Named ports are safer.

---

## Vectors

### Declaration & Part Select
```verilog
wire [7:0] byte;          // 8-bit vector [MSB:LSB]
assign nibble = byte[7:4]; // upper nibble
assign bit3   = byte[3];   // single bit
```

### Concatenation `{}`
```verilog
assign {cout, sum} = a + b + cin;    // split result
assign word = {high_byte, low_byte}; // join bytes
```

### Replication `{N{x}}`
```verilog
assign sign_ext = {{24{in[7]}}, in};  // sign-extend 8→32 bits
assign zeros    = {8{1'b0}};          // 8 zero bits
```

---

## Flip-Flops

### Basic D Flip-Flop
```verilog
always @(posedge clk) q <= d;
```

### Synchronous Reset
```verilog
always @(posedge clk) begin
    if (reset) q <= 0;
    else       q <= d;
end
```

### Asynchronous Reset
```verilog
always @(posedge clk or posedge reset) begin
    if (reset) q <= 0;
    else       q <= d;
end
```
Reset in the sensitivity list = asynchronous; only in the body = synchronous.

### D FF with Enable
```verilog
always @(posedge clk) begin
    if (en) q <= d;
    // no else: q retains value (that's the enable behavior)
end
```

---

## Counters

### Binary Counter
```verilog
always @(posedge clk) begin
    if (reset) count <= 0;
    else       count <= count + 1;
end
```

### Decade Counter (0–9)
```verilog
always @(posedge clk) begin
    if (reset || count == 9) count <= 0;
    else                     count <= count + 1;
end
```

### BCD Counter (multi-digit)
```verilog
// ones digit rolls at 9, tens digit increments then
always @(posedge clk) begin
    if (reset) begin ones <= 0; tens <= 0; end
    else if (ones == 9) begin
        ones <= 0;
        tens <= (tens == 9) ? 0 : tens + 1;
    end else ones <= ones + 1;
end
```

---

## Shift Registers

### Basic Serial-In Shift Register
```verilog
always @(posedge clk) begin
    q <= {q[N-2:0], serial_in};  // shift left, insert at LSB
end
```

### LFSR (example: 4-bit, taps 3,0)
```verilog
always @(posedge clk) begin
    q <= {q[2:0], q[3] ^ q[0]};
end
```

### Barrel Shifter (combinational)
```verilog
assign out = in >> shift_amt;   // logical right shift
assign out = in << shift_amt;   // logical left shift
assign out = $signed(in) >>> shift_amt;  // arithmetic right shift
```

---

## FSM Patterns

### Moore FSM (output depends only on state)
```verilog
// Two always blocks: state register + next-state/output logic
parameter S0=0, S1=1, S2=2;
reg [1:0] state;

always @(posedge clk) begin
    if (reset) state <= S0;
    else       state <= next_state;
end

always @(*) begin
    case (state)
        S0: begin next_state = in ? S1 : S0; out = 0; end
        S1: begin next_state = in ? S2 : S0; out = 0; end
        S2: begin next_state = S0;            out = 1; end
        default: begin next_state = S0; out = 0; end
    endcase
end
```

### Mealy FSM (output depends on state + inputs)
```verilog
always @(*) begin
    case (state)
        S0: begin
            out = (in) ? 1 : 0;        // output depends on input
            next_state = in ? S1 : S0;
        end
        default: begin out = 0; next_state = S0; end
    endcase
end
```

### One-Hot Encoding
```verilog
parameter S0 = 3'b001, S1 = 3'b010, S2 = 3'b100;
reg [2:0] state;
```
One-hot uses 1 bit per state; faster decoding but more flip-flops.

---

## Generate / For-Loop Patterns

```verilog
genvar i;
generate
    for (i = 0; i < 8; i = i+1) begin : gen_block
        assign out[i] = a[i] ^ b[i];
    end
endgenerate
```
Use `generate` for repetitive structural instantiation or assignments.

---

## Testbench Patterns

### Clock Generation
```verilog
initial clk = 0;
always #5 clk = ~clk;  // 10-unit period
```

### Reset + Stimulus
```verilog
initial begin
    reset = 1; d = 0;
    @(posedge clk); #1;
    reset = 0;
    d = 1; @(posedge clk); #1;
    d = 0; @(posedge clk); #1;
    $finish;
end
```
Apply inputs slightly after the clock edge (`#1`) to avoid setup issues.
