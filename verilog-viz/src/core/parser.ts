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

type PortDirection = Port['direction'];

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

// ── Verilog keywords that can never be a module instantiation ─────────────────
const VERILOG_KEYWORDS = new Set([
  'module', 'endmodule', 'input', 'output', 'inout', 'wire', 'reg', 'logic',
  'assign', 'always', 'initial', 'begin', 'end', 'if', 'else', 'for', 'while',
  'case', 'casex', 'casez', 'endcase', 'default', 'parameter', 'localparam',
  'generate', 'endgenerate', 'genvar', 'function', 'endfunction', 'task',
  'endtask', 'integer', 'real', 'time', 'posedge', 'negedge', 'or', 'and',
  'not', 'nand', 'nor', 'xor', 'xnor', 'buf', 'supply0', 'supply1',
  'tri', 'tri0', 'tri1', 'wand', 'wor', 'signed', 'unsigned',
  'specify', 'endspecify', 'table', 'endtable', 'primitive', 'endprimitive',
]);

const PORT_RE = /^(input|output|inout)?\s*(?:wire|reg|logic)?\s*(\[[\s\S]*?\])?\s*([A-Za-z_]\w*)\s*$/;
const PARAMETER_RE = /(?:parameter\s+)?(?:\w+\s+)?([A-Za-z_]\w*)\s*=\s*([\s\S]+)/;
const NAMED_CONNECTION_RE = /^\.([A-Za-z_]\w*)\s*\(([\s\S]*)\)$/;
const IDENTIFIER_RE = /[A-Za-z_]\w*/y;

/**
 * Parse Verilog source code and extract design hierarchy
 */
export function parseVerilog(source: string, options: ParserOptions = {}): ParsedDesign {
  const design: ParsedDesign = {
    modules: new Map(),
    errors: [],
  };

  if (!source.trim()) return design;

  // Phase A: Strip comments and strings
  const { code, lineMapping } = stripCommentsAndStrings(source);
  const locAt = buildLocationResolver(code, lineMapping, options.filename);

  // Phase B: Scan for module declarations & instantiations
  const moduleRe = /\bmodule\s+([A-Za-z_]\w*)/g;
  let mMatch: RegExpExecArray | null;

  while ((mMatch = moduleRe.exec(code)) !== null) {
    const moduleName = mMatch[1];
    const moduleStartOffset = mMatch.index;
    const loc = locAt(moduleStartOffset);

    // Find matching `endmodule`
    const endRe = /\bendmodule\b/g;
    endRe.lastIndex = moduleRe.lastIndex;
    const endMatch = endRe.exec(code);
    const moduleEnd = endMatch ? endMatch.index + endMatch[0].length : code.length;
    const headerEnd = code.indexOf(';', moduleRe.lastIndex);
    const moduleHeaderEnd = headerEnd === -1 ? moduleEnd : Math.min(headerEnd, moduleEnd);
    const moduleHeader = code.slice(moduleRe.lastIndex, moduleHeaderEnd);
    const moduleBodyOffset = moduleHeaderEnd < moduleEnd ? moduleHeaderEnd + 1 : moduleHeaderEnd;
    const moduleBody = code.slice(moduleBodyOffset, moduleEnd);

    const mod = createModule(moduleName, loc);
    extractModuleHeader(moduleHeader, moduleRe.lastIndex, mod, locAt);
    extractInstances(moduleBody, moduleBodyOffset, mod, locAt);

    design.modules.set(moduleName, mod);

    // Advance past endmodule
    moduleRe.lastIndex = moduleEnd;
  }

  return design;
}

function buildLocationResolver(
  code: string,
  lineMapping: number[],
  filename?: string,
): (offset: number) => SourceLocation {
  const lineStarts = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\n') {
      lineStarts.push(i + 1);
    }
  }

  return (offset: number): SourceLocation => {
    let lineIndex = 0;
    while (lineIndex + 1 < lineStarts.length && lineStarts[lineIndex + 1] <= offset) {
      lineIndex++;
    }

    return {
      line: lineMapping[lineIndex] ?? lineIndex + 1,
      column: offset - lineStarts[lineIndex],
      offset,
      filename,
    };
  };
}

/**
 * Find the matching closing paren for an opening paren at `start`.
 * Returns the index of `)` or -1.
 */
function findMatchingParen(str: string, start: number): number {
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function extractModuleHeader(
  header: string,
  headerOffset: number,
  mod: ParsedModule,
  locAt: (offset: number) => SourceLocation,
) {
  let cursor = skipWhitespace(header, 0);

  if (header[cursor] === '#') {
    cursor = skipWhitespace(header, cursor + 1);
    if (header[cursor] === '(') {
      const parameterEnd = findMatchingParen(header, cursor);
      if (parameterEnd !== -1) {
        extractParameters(
          header.slice(cursor + 1, parameterEnd),
          headerOffset + cursor + 1,
          mod,
          locAt,
        );
        cursor = parameterEnd + 1;
      }
    }
  }

  cursor = skipWhitespace(header, cursor);
  if (header[cursor] !== '(') {
    return;
  }

  const portEnd = findMatchingParen(header, cursor);
  if (portEnd === -1) {
    return;
  }

  extractPorts(
    header.slice(cursor + 1, portEnd),
    headerOffset + cursor + 1,
    mod,
    locAt,
  );
}

/**
 * Extract ports from the ANSI port declaration string (inside the top-level parens).
 */
function extractPorts(
  portStr: string,
  baseOffset: number,
  mod: ParsedModule,
  locAt: (offset: number) => SourceLocation,
) {
  const parts = splitAtTopLevel(portStr, ',');
  let lastDirection: PortDirection = 'input';
  let lastWidth = '1';

  for (const part of parts) {
    const trimmed = part.text.trim();
    if (!trimmed) continue;

    const portOffset = baseOffset + part.start;
    const m = PORT_RE.exec(trimmed);
    if (m) {
      const direction = resolvePortDirection(m[1], lastDirection);
      const widthStr = m[2] ? m[2].replace(/\s+/g, '') : lastWidth;
      const name = m[3];

      if (m[1]) lastDirection = direction;
      if (m[2]) lastWidth = widthStr;
      else if (m[1]) lastWidth = '1';

      mod.ports.push(createPort(name, direction, widthStr, locAt(portOffset)));
    }
  }
}

/**
 * Extract parameters from `#(parameter X = val, ...)` string.
 */
function extractParameters(
  paramStr: string,
  baseOffset: number,
  mod: ParsedModule,
  locAt: (offset: number) => SourceLocation,
) {
  const parts = splitAtTopLevel(paramStr, ',');
  for (const part of parts) {
    const trimmed = part.text.trim();
    const m = PARAMETER_RE.exec(trimmed);
    if (m) {
      mod.parameters.push(createParameter(m[1], m[2].trim(), locAt(baseOffset + part.start)));
    }
  }
}

/**
 * Extract module instantiations from the body of a module.
 *
 * Pattern: `identifier identifier (` or `identifier #( ... ) identifier (`
 * where the first identifier is the module type and the second is the instance name.
 */
function extractInstances(
  body: string,
  bodyOffset: number,
  mod: ParsedModule,
  locAt: (offset: number) => SourceLocation,
) {
  const candidateRe = /\b([A-Za-z_]\w*)\b/g;
  let candidate: RegExpExecArray | null;

  while ((candidate = candidateRe.exec(body)) !== null) {
    const moduleName = candidate[1];
    if (VERILOG_KEYWORDS.has(moduleName)) {
      continue;
    }

    let cursor = skipWhitespace(body, candidateRe.lastIndex);
    let parameterOverrides: string | null = null;

    if (body[cursor] === '#') {
      cursor = skipWhitespace(body, cursor + 1);
      if (body[cursor] !== '(') {
        continue;
      }

      const parameterEnd = findMatchingParen(body, cursor);
      if (parameterEnd === -1) {
        continue;
      }

      parameterOverrides = body.slice(cursor + 1, parameterEnd);
      cursor = skipWhitespace(body, parameterEnd + 1);
    }

    const instanceName = matchIdentifierAt(body, cursor);
    if (!instanceName) {
      continue;
    }

    cursor = skipWhitespace(body, instanceName.end);
    if (body[cursor] !== '(') {
      continue;
    }

    const connectionEnd = findMatchingParen(body, cursor);
    if (connectionEnd === -1) {
      continue;
    }

    const inst = createInstance(moduleName, instanceName.value, locAt(bodyOffset + candidate.index));
    if (parameterOverrides) {
      parseConnectionList(parameterOverrides, inst.parameters);
    }

    parseConnectionList(body.slice(cursor + 1, connectionEnd), inst.connections);
    mod.instances.push(inst);
    candidateRe.lastIndex = connectionEnd + 1;
  }
}

/**
 * Parse a named connection list like `.a(sig_a), .b(sig_b)` into a Map.
 * Also handles positional connections (no dot prefix).
 */
function parseConnectionList(str: string, map: Map<string, string>) {
  const parts = splitAtTopLevel(str, ',');
  let positionalIndex = 0;

  for (const part of parts) {
    const trimmed = part.text.trim();
    if (!trimmed) continue;

    const nm = NAMED_CONNECTION_RE.exec(trimmed);
    if (nm) {
      map.set(nm[1], nm[2].trim());
    } else {
      map.set(`__pos_${positionalIndex}`, trimmed);
      positionalIndex++;
    }
  }
}

/**
 * Split a string by a delimiter character, respecting parenthesis/bracket nesting.
 */
function splitAtTopLevel(str: string, delim: string): Array<{ text: string; start: number }> {
  const result: Array<{ text: string; start: number }> = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === delim && depth === 0) {
      result.push({ text: str.slice(start, i), start });
      start = i + 1;
    }
  }
  result.push({ text: str.slice(start), start });
  return result;
}

function resolvePortDirection(
  value: string | undefined,
  fallback: PortDirection,
): PortDirection {
  return value === 'input' || value === 'output' || value === 'inout'
    ? value
    : fallback;
}

function skipWhitespace(str: string, index: number): number {
  let cursor = index;
  while (cursor < str.length && /\s/.test(str[cursor])) {
    cursor++;
  }
  return cursor;
}

function matchIdentifierAt(
  str: string,
  index: number,
): { value: string; end: number } | null {
  IDENTIFIER_RE.lastIndex = index;
  const match = IDENTIFIER_RE.exec(str);
  if (!match) {
    return null;
  }

  return {
    value: match[0],
    end: IDENTIFIER_RE.lastIndex,
  };
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
