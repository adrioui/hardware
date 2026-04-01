// 8-bit synchronous up-counter with synchronous reset
// Single module — no sub-instances; tests port extraction

module counter (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       en,
    output reg  [7:0] count,
    output wire       overflow
);
  assign overflow = (count == 8'hFF) & en;

  always @(posedge clk) begin
    if (!rst_n) begin
      count <= 8'h00;
    end else if (en) begin
      count <= count + 8'h01;
    end
  end
endmodule
