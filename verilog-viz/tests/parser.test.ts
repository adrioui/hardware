/**
 * Tests for Verilog parser implementation
 */

import { describe, it, expect } from 'vitest';
import { parseVerilog, stripCommentsAndStrings } from '../src/core/parser';

describe('Phase A - Comment and String Stripping', () => {
  it('should strip single-line comments', () => {
    const source = `module test; // this is a comment
  input clk; // another comment
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).toBe(`module test; 
  input clk; 
endmodule`);
  });

  it('should strip multi-line comments', () => {
    const source = `module test;
  /* This is a 
     multi-line comment */
  input clk;
  /* Another block comment */
  output data;
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    // Block comments preserve newlines to maintain line count for tracking
    expect(stripped.code).toBe(
      "module test;\n" +
      "  \n" +      // whitespace before /* on line 2
      "\n" +        // preserved newline from inside block comment (line 3)
      "  input clk;\n" +
      "  \n" +      // single-line block comment stripped, whitespace remains
      "  output data;\n" +
      "endmodule"
    );
  });

  it('should strip string literals', () => {
    const source = `module test;
  initial $display("Hello World");
  initial $display("Another string with \\"escaped\\" quotes");
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).toBe(`module test;
  initial $display("");
  initial $display("");
endmodule`);
  });

  it('should preserve line numbers correctly', () => {
    const source = `module test; // line 1
  /* line 2
     line 3 */
  input clk; // line 4
endmodule // line 5`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.lineMapping).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle nested comment scenarios correctly', () => {
    const source = `module test;
  // Comment with /* fake block comment */
  input clk;
  /* Block comment with // fake line comment */
  output data;
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).toBe(`module test;
  
  input clk;
  
  output data;
endmodule`);
  });

  it('should handle strings with comment-like content', () => {
    const source = `module test;
  initial $display("This // looks like a comment");
  initial $display("This /* looks like */ a block comment");
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).toBe(`module test;
  initial $display("");
  initial $display("");
endmodule`);
  });

  it('should handle escaped quotes in strings', () => {
    const source = `module test;
  initial $display("String with \\"escaped\\" quotes");
  initial $display("Another \\"test\\" string");
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).toBe(`module test;
  initial $display("");
  initial $display("");
endmodule`);
  });

  it('should preserve whitespace structure', () => {
    const source = `module test;
    // Comment with indentation
    input    clk;    // Comment after spaces
    
    /* Block comment
       with multiple lines
       and different indentation */
    output   data;
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    // Should preserve the line structure and indentation
    expect(stripped.code.split('\n').length).toBe(source.split('\n').length);
  });

  it('should handle empty input', () => {
    const stripped = stripCommentsAndStrings('');
    expect(stripped.code).toBe('');
    expect(stripped.lineMapping).toEqual([]);
  });

  it('should handle input with only comments', () => {
    const source = `// Just a comment
/* Just a block comment */`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).toBe(`
`);
  });

  it('should strip preprocessor directive lines', () => {
    const source = `\`ifdef SYNTHESIS
  fast_adder u0 (.a(a), .b(b));
\`else
  slow_adder u0 (.a(a), .b(b));
\`endif`;

    const stripped = stripCommentsAndStrings(source);
    // Directive lines stripped, code from both branches preserved, line count same
    expect(stripped.code).toContain('fast_adder');
    expect(stripped.code).toContain('slow_adder');
    expect(stripped.code).not.toMatch(/`ifdef/);
    expect(stripped.code).not.toMatch(/`else/);
    expect(stripped.code).not.toMatch(/`endif/);
    expect(stripped.code.split('\n').length).toBe(source.split('\n').length);
  });

  it('should strip define and include directives', () => {
    const source = `\`define WIDTH 8
\`include "header.vh"
\`timescale 1ns/1ps
module test;
endmodule`;

    const stripped = stripCommentsAndStrings(source);
    expect(stripped.code).not.toMatch(/`define/);
    expect(stripped.code).not.toMatch(/`include/);
    expect(stripped.code).not.toMatch(/`timescale/);
    expect(stripped.code).toContain('module test;');
    expect(stripped.code.split('\n').length).toBe(source.split('\n').length);
  });
});

describe('Parser Integration', () => {
  it('should return empty design for empty input', () => {
    const design = parseVerilog('');
    expect(design.modules.size).toBe(0);
    expect(design.errors.length).toBe(0);
  });

  it('should handle input with only comments and strings', () => {
    const source = `// This is just a comment file
/* With some block comments */
// And some strings would be here in real code`;

    const design = parseVerilog(source);
    expect(design.modules.size).toBe(0);
    expect(design.errors.length).toBe(0);
  });

  it('should preserve line tracking through the parser', () => {
    const source = `// Header comment
module test; // inline comment
  input clk;
  /* multi-line
     comment */
  output data;
endmodule`;

    // This test ensures that when we implement Phase B,
    // the line numbers will be correctly preserved
    const design = parseVerilog(source);
    expect(design.errors.length).toBe(0);
  });

  it('extracts module ports and parameters from ANSI headers', () => {
    const source = `module adder #(
  parameter WIDTH = 8,
  parameter DEPTH = 4
) (
  input wire clk,
  input wire [WIDTH-1:0] a,
  output logic [WIDTH-1:0] y
);
endmodule`;

    const design = parseVerilog(source, { filename: 'adder.v' });
    const mod = design.modules.get('adder');

    expect(mod).toBeDefined();
    expect(mod?.parameters.map((param) => [param.name, param.value])).toEqual([
      ['WIDTH', '8'],
      ['DEPTH', '4'],
    ]);
    expect(mod?.ports.map((port) => [port.name, port.direction, port.width])).toEqual([
      ['clk', 'input', '1'],
      ['a', 'input', '[WIDTH-1:0]'],
      ['y', 'output', '[WIDTH-1:0]'],
    ]);
    expect(mod?.parameters.every((param) => param.loc.offset >= 0)).toBe(true);
    expect(mod?.parameters.every((param) => param.loc.filename === 'adder.v')).toBe(true);
  });

  it('extracts named and positional instantiations', () => {
    const source = `module child(input wire a, input wire b, output wire y);
endmodule

module top(
  input wire a,
  input wire b,
  output wire y0,
  output wire y1
);
  child named_u0 (
    .a(a),
    .b(b),
    .y(y0)
  );

  child positional_u1 (a, b, y1);
endmodule`;

    const design = parseVerilog(source);
    const top = design.modules.get('top');

    expect(top?.instances).toHaveLength(2);
    expect(top?.instances[0].moduleName).toBe('child');
    expect(top?.instances[0].instanceName).toBe('named_u0');
    expect([...top!.instances[0].connections.entries()]).toEqual([
      ['a', 'a'],
      ['b', 'b'],
      ['y', 'y0'],
    ]);
    expect([...top!.instances[1].connections.entries()]).toEqual([
      ['__pos_0', 'a'],
      ['__pos_1', 'b'],
      ['__pos_2', 'y1'],
    ]);
  });

  it('extracts parameter overrides on module instantiations', () => {
    const source = `module child #(parameter WIDTH = 8) (
  input wire [WIDTH-1:0] a,
  output wire [WIDTH-1:0] y
);
endmodule

module top(
  input wire [7:0] in,
  output wire [7:0] out
);
  child #(
    .WIDTH(8)
  ) u0 (
    .a(in),
    .y(out)
  );
endmodule`;

    const design = parseVerilog(source, { filename: 'top.v' });
    const instance = design.modules.get('top')?.instances[0];

    expect(instance).toBeDefined();
    expect(instance?.moduleName).toBe('child');
    expect(instance?.instanceName).toBe('u0');
    expect([...instance!.parameters.entries()]).toEqual([['WIDTH', '8']]);
    expect([...instance!.connections.entries()]).toEqual([
      ['a', 'in'],
      ['y', 'out'],
    ]);
    expect(instance?.loc.line).toBeGreaterThanOrEqual(9);
    expect(instance?.loc.filename).toBe('top.v');
  });

  it('flattens generate blocks and includes all ifdef branches', () => {
    const source = `module leaf(input wire a, output wire y);
endmodule

module top(input wire a, output wire y0, output wire y1, output wire y2);
  generate
    if (1) begin
      leaf gen_if (.a(a), .y(y0));
    end
    for (genvar i = 0; i < 1; i = i + 1) begin
      leaf gen_for (.a(a), .y(y1));
    end
  endgenerate

\`ifdef FAST
  leaf fast_impl (.a(a), .y(y2));
\`else
  leaf slow_impl (.a(a), .y(y2));
\`endif
endmodule`;

    const design = parseVerilog(source);
    const top = design.modules.get('top');

    expect(top?.instances.map((instance) => instance.instanceName)).toEqual([
      'gen_if',
      'gen_for',
      'fast_impl',
      'slow_impl',
    ]);
  });
});
