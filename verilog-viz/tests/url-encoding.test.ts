/**
 * Tests for URL sharing — gzip + base64 round-trip encoding.
 */

import { describe, it, expect } from 'vitest';
import {
  encodeVerilog,
  decodeVerilog,
  buildShareUrl,
  parseShareUrl,
} from '../src/core/url-encoding';

const SAMPLE_VERILOG = `module full_adder (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
  wire sum1, carry1, carry2;
  assign cout = carry1 | carry2;
endmodule`;

describe('URL encoding — round-trip', () => {
  it('encodes and decodes simple source', async () => {
    const src = 'module test; endmodule';
    const encoded = await encodeVerilog(src);
    const decoded = await decodeVerilog(encoded);
    expect(decoded).toBe(src);
  });

  it('round-trips a realistic Verilog source', async () => {
    const encoded = await encodeVerilog(SAMPLE_VERILOG);
    const decoded = await decodeVerilog(encoded);
    expect(decoded).toBe(SAMPLE_VERILOG);
  });

  it('produces a compressed output smaller than the input for larger sources', async () => {
    // Repeat source to make gzip compression more effective
    const large = SAMPLE_VERILOG.repeat(10);
    const encoded = await encodeVerilog(large);
    // base64 overhead ≈ 4/3 of gzip size; gzip wins for repeated content
    expect(encoded.length).toBeLessThan(large.length);
  });

  it('produces a URL-safe base64 string (no +, /, or = chars)', async () => {
    const encoded = await encodeVerilog(SAMPLE_VERILOG);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('round-trips unicode characters', async () => {
    const src = '// こんにちは\nmodule unicode; endmodule';
    const decoded = await decodeVerilog(await encodeVerilog(src));
    expect(decoded).toBe(src);
  });
});

describe('buildShareUrl', () => {
  it('produces a URL with #code= fragment', async () => {
    const url = await buildShareUrl(SAMPLE_VERILOG, 'https://example.com/');
    expect(url).toMatch(/^https:\/\/example\.com\/#code=/);
  });

  it('round-trips via parseShareUrl', async () => {
    const url = await buildShareUrl(SAMPLE_VERILOG, 'https://example.com/');
    const result = await parseShareUrl(url);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('code');
    if (result?.type === 'code') {
      expect(result.source).toBe(SAMPLE_VERILOG);
    }
  });
});

describe('parseShareUrl', () => {
  it('parses #example= fragment', async () => {
    const result = await parseShareUrl('https://example.com/#example=full_adder');
    expect(result).toEqual({ type: 'example', name: 'full_adder' });
  });

  it('returns null for unknown fragments', async () => {
    const result = await parseShareUrl('https://example.com/#unknown=foo');
    expect(result).toBeNull();
  });

  it('accepts a bare hash string without a full URL', async () => {
    const result = await parseShareUrl('#example=counter');
    expect(result).toEqual({ type: 'example', name: 'counter' });
  });

  it('accepts a fragment string without leading #', async () => {
    const result = await parseShareUrl('example=mux4');
    expect(result).toEqual({ type: 'example', name: 'mux4' });
  });
});
