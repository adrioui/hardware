/**
 * Custom Verilog parser implementation
 * 
 * Two-phase parser:
 * Phase A: Strip comments and strings, preserve source locations
 * Phase B: Scan for module declarations and instantiations
 */

import type {
  ParsedDesign,
  ParsedModule,
  Port,
  Instance,
  Parameter,
  ParseError,
  SourceLocation,
  ParserOptions
} from '../types';

/**
 * Result of comment and string stripping phase
 */
export interface StrippedResult {
  code: string;
  lineMapping: number[];
}

/**
 * Phase A: Strip comments and strings from Verilog source code
 * Preserves line structure and tracks original line numbers
 */
export function stripCommentsAndStrings(source: string): StrippedResult {
  if (source === '') {
    return { code: '', lineMapping: [] };
  }

  const len = source.length;
  let result = '';
  let inBlockComment = false;
  let inString = false;
  let i = 0;

  while (i < len) {
    const ch = source[i];
    const next = i + 1 < len ? source[i + 1] : '';

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
      } else {
        // Preserve newlines to keep line structure, replace other chars with nothing
        if (ch === '\n') {
          result += '\n';
        }
        i++;
      }
      continue;
    }

    if (inString) {
      if (ch === '\\') {
        // Escaped character, skip both
        i += 2;
      } else if (ch === '"') {
        inString = false;
        result += '"';
        i++;
      } else {
        // Skip string content but preserve newlines (shouldn't happen in Verilog, but safe)
        if (ch === '\n') {
          result += '\n';
        }
        i++;
      }
      continue;
    }

    // Not in block comment or string
    if (ch === '/' && next === '/') {
      // Line comment: skip until end of line
      i += 2;
      while (i < len && source[i] !== '\n') {
        i++;
      }
      // Don't consume the newline — it'll be added in the next iteration
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += '"';
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  // Strip preprocessor directive lines (`ifdef, `ifndef, `else, `endif, `define, `include, `undef)
  // Keep the newlines so line numbers stay aligned; keep code between branches
  const directivePattern = /^[ \t]*`(?:ifdef|ifndef|else|endif|define|include|undef|timescale)\b.*$/gm;
  result = result.replace(directivePattern, '');

  // Build line mapping: each line in the result maps to the original line number
  // Since we preserved all newlines, line counts are the same
  const lineCount = result.split('\n').length;
  const lineMapping: number[] = [];
  for (let l = 1; l <= lineCount; l++) {
    lineMapping.push(l);
  }

  return {
    code: result,
    lineMapping
  };
}

/**
 * Parse Verilog source code and extract design hierarchy
 */
export function parseVerilog(_source: string, _options: ParserOptions = {}): ParsedDesign {
  const design: ParsedDesign = {
    modules: new Map(),
    errors: []
  };

  // TODO: Implement two-phase parser
  // Phase A: Strip comments and strings
  // Phase B: Extract modules, ports, and instances

  return design;
}

/**
 * Create a source location object
 */
export function createLocation(line: number, column: number, offset: number, filename?: string): SourceLocation {
  return {
    line,
    column,
    offset,
    filename
  };
}

/**
 * Create a parse error object
 */
export function createError(message: string, loc: SourceLocation, severity: 'error' | 'warning' = 'error', code?: string): ParseError {
  return {
    message,
    loc,
    severity,
    code
  };
}

/**
 * Helper function to create a new Port
 */
export function createPort(name: string, direction: 'input' | 'output' | 'inout', width: string, loc: SourceLocation): Port {
  return {
    name,
    direction,
    width,
    loc
  };
}

/**
 * Helper function to create a new Parameter
 */
export function createParameter(name: string, value: string, loc: SourceLocation): Parameter {
  return {
    name,
    value,
    loc
  };
}

/**
 * Helper function to create a new Instance
 */
export function createInstance(moduleName: string, instanceName: string, loc: SourceLocation): Instance {
  return {
    moduleName,
    instanceName,
    connections: new Map(),
    parameters: new Map(),
    loc
  };
}

/**
 * Helper function to create a new ParsedModule
 */
export function createModule(name: string, loc: SourceLocation): ParsedModule {
  return {
    name,
    ports: [],
    instances: [],
    parameters: [],
    loc
  };
}