/**
 * Type definitions for Verilog visualization project
 */

// Parser types
export type {
  SourceLocation,
  ParseError,
  Port,
  Parameter,
  Instance,
  ParsedModule,
  ParsedDesign,
  ParserOptions,
  Token,
  ParserState
} from './parser';

export { TokenType } from './parser';