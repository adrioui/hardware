// 4-to-1 multiplexer built from 2-to-1 mux instances
// mux4 instantiates three mux2 modules

module mux2 (
    input  wire [7:0] a,
    input  wire [7:0] b,
    input  wire       sel,
    output wire [7:0] y
);
  assign y = sel ? b : a;
endmodule

module mux4 (
    input  wire [7:0] a,
    input  wire [7:0] b,
    input  wire [7:0] c,
    input  wire [7:0] d,
    input  wire [1:0] sel,
    output wire [7:0] y
);
  wire [7:0] y0, y1;

  // First stage: reduce 4 inputs to 2
  mux2 mux_lo (
      .a  (a),
      .b  (b),
      .sel(sel[0]),
      .y  (y0)
  );

  mux2 mux_hi (
      .a  (c),
      .b  (d),
      .sel(sel[0]),
      .y  (y1)
  );

  // Second stage: select between the two first-stage outputs
  mux2 mux_out (
      .a  (y0),
      .b  (y1),
      .sel(sel[1]),
      .y  (y)
  );
endmodule
