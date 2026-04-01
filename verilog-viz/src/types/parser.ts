/**
 * Type definitions for Verilog parser output
 */

/**
 * Source location for error reporting and debugging
 */
export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
  filename?: string;
}

/**
 * Parse error information
 */
export interface ParseError {
  message: string;
  loc: SourceLocation;
  severity: 'error' | 'warning';
  code?: string;
}

/**
 * Port definition in a Verilog module
 */
export interface Port {
  name: string;
  direction: 'input' | 'output' | 'inout';
  width: string;        // e.g., "[7:0]" or "1" for single-bit
  loc: SourceLocation;
}

/**
 * Parameter definition in a Verilog module
 */
export interface Parameter {
  name: string;
  value: string;        // parameter default value
  loc: SourceLocation;
}

/**
 * Module instantiation within a Verilog module
 */
export interface Instance {
  moduleName: string;
  instanceName: string;
  connections: Map<string, string>;    // port name -> signal name
  parameters: Map<string, string>;     // parameter name -> value
  loc: SourceLocation;
}

/**
 * Parsed Verilog module with all its components
 */
export interface ParsedModule {
  name: string;
  ports: Port[];
  instances: Instance[];
  parameters: Parameter[];
  loc: SourceLocation;
}

/**
 * Complete parsed design containing all modules and errors
 */
export interface ParsedDesign {
  modules: Map<string, ParsedModule>;
  errors: ParseError[];
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  filename?: string;
  strictMode?: boolean;
  preserveComments?: boolean;
}

/**
 * Token types used during parsing
 */
export enum TokenType {
  MODULE = 'module',
  ENDMODULE = 'endmodule',
  INPUT = 'input',
  OUTPUT = 'output',
  INOUT = 'inout',
  PARAMETER = 'parameter',
  IDENTIFIER = 'identifier',
  NUMBER = 'number',
  STRING = 'string',
  LPAREN = '(',
  RPAREN = ')',
  SEMICOLON = ';',
  COMMA = ',',
  DOT = '.',
  HASH = '#',
  LBRACKET = '[',
  RBRACKET = ']',
  COLON = ':',
  GENERATE = 'generate',
  ENDGENERATE = 'endgenerate',
  IF = 'if',
  ELSE = 'else',
  FOR = 'for',
  IFDEF = 'ifdef',
  IFNDEF = 'ifndef',
  ENDIF = 'endif',
  EOF = 'eof',
  NEWLINE = 'newline',
  WHITESPACE = 'whitespace'
}

/**
 * Token representation during lexing
 */
export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}

/**
 * Parser state for tracking parsing progress
 */
export interface ParserState {
  tokens: Token[];
  position: number;
  currentModule?: ParsedModule;
  errors: ParseError[];
  filename?: string;
}