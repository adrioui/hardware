// Finite state machine — traffic light controller
// Single module; tests port extraction with many typed ports

// States:
//   RED    (2'b00) — stop
//   GREEN  (2'b01) — go
//   YELLOW (2'b10) — prepare to stop

module traffic_light_fsm (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       sensor,  // 1 = cars detected on cross-street
    output reg  [1:0] state,
    output reg        red,
    output reg        yellow,
    output reg        green
);
  // State encoding
  localparam RED = 2'b00;
  localparam GREEN = 2'b01;
  localparam YELLOW = 2'b10;

  reg [1:0] next_state;
  reg [3:0] timer;

  // State register
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      state <= RED;
      timer <= 4'd0;
    end else begin
      if (timer == 4'd0) begin
        state <= next_state;
        // Load timer based on next state
        case (next_state)
          RED:    timer <= 4'd9;
          GREEN:  timer <= 4'd6;
          YELLOW: timer <= 4'd2;
          default: timer <= 4'd0;
        endcase
      end else begin
        timer <= timer - 4'd1;
      end
    end
  end

  // Next-state logic
  always @(*) begin
    case (state)
      RED:    next_state = (sensor) ? GREEN  : RED;
      GREEN:  next_state = YELLOW;
      YELLOW: next_state = RED;
      default: next_state = RED;
    endcase
  end

  // Output logic (Moore machine)
  always @(*) begin
    red    = 1'b0;
    yellow = 1'b0;
    green  = 1'b0;
    case (state)
      RED:    red    = 1'b1;
      GREEN:  green  = 1'b1;
      YELLOW: yellow = 1'b1;
      default: red   = 1'b1;
    endcase
  end
endmodule
