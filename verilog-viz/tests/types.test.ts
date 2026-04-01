/**
 * Type validation tests for parser types
 */

import { describe, it, expect } from 'vitest';
import type {
  ParsedDesign,
  ParsedModule,
  Port,
  Instance,
  Parameter,
  ParseError,
  SourceLocation,
  ParserOptions,
  Token,
  ParserState
} from '../src/types';
import { TokenType } from '../src/types';
import {
  parseVerilog,
  createLocation,
  createError,
  createPort,
  createParameter,
  createInstance,
  createModule
} from '../src/core/parser';

describe('Type definitions', () => {
  it('should create valid SourceLocation objects', () => {
    const loc = createLocation(1, 5, 100, 'test.v');
    expect(loc.line).toBe(1);
    expect(loc.column).toBe(5);
    expect(loc.offset).toBe(100);
    expect(loc.filename).toBe('test.v');
  });

  it('should create valid ParseError objects', () => {
    const loc = createLocation(1, 1, 0);
    const error = createError('Test error', loc, 'error', 'E001');
    expect(error.message).toBe('Test error');
    expect(error.severity).toBe('error');
    expect(error.code).toBe('E001');
    expect(error.loc).toBe(loc);
  });

  it('should create valid Port objects', () => {
    const loc = createLocation(1, 1, 0);
    const port = createPort('clk', 'input', '1', loc);
    expect(port.name).toBe('clk');
    expect(port.direction).toBe('input');
    expect(port.width).toBe('1');
    expect(port.loc).toBe(loc);
  });

  it('should create valid Parameter objects', () => {
    const loc = createLocation(1, 1, 0);
    const param = createParameter('WIDTH', '8', loc);
    expect(param.name).toBe('WIDTH');
    expect(param.value).toBe('8');
    expect(param.loc).toBe(loc);
  });

  it('should create valid Instance objects', () => {
    const loc = createLocation(1, 1, 0);
    const instance = createInstance('adder', 'u_adder', loc);
    expect(instance.moduleName).toBe('adder');
    expect(instance.instanceName).toBe('u_adder');
    expect(instance.connections).toBeInstanceOf(Map);
    expect(instance.parameters).toBeInstanceOf(Map);
    expect(instance.loc).toBe(loc);
  });

  it('should create valid ParsedModule objects', () => {
    const loc = createLocation(1, 1, 0);
    const module = createModule('test_module', loc);
    expect(module.name).toBe('test_module');
    expect(Array.isArray(module.ports)).toBe(true);
    expect(Array.isArray(module.instances)).toBe(true);
    expect(Array.isArray(module.parameters)).toBe(true);
    expect(module.loc).toBe(loc);
  });

  it('should create valid ParsedDesign objects', () => {
    const design = parseVerilog('module test; endmodule');
    expect(design.modules).toBeInstanceOf(Map);
    expect(Array.isArray(design.errors)).toBe(true);
  });

  it('should have all required TokenType values', () => {
    expect(TokenType.MODULE).toBe('module');
    expect(TokenType.ENDMODULE).toBe('endmodule');
    expect(TokenType.INPUT).toBe('input');
    expect(TokenType.OUTPUT).toBe('output');
    expect(TokenType.INOUT).toBe('inout');
    expect(TokenType.PARAMETER).toBe('parameter');
    expect(TokenType.IDENTIFIER).toBe('identifier');
    expect(TokenType.NUMBER).toBe('number');
    expect(TokenType.STRING).toBe('string');
  });
});