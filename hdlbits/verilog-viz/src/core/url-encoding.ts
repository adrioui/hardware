/**
 * URL sharing — gzip + base64 encode/decode for Verilog source.
 *
 * URL format:
 *   #code=<base64(gzip(verilog_source))>  — compressed source
 *   #example=<name>                        — built-in example reference
 *
 * Uses the browser-native CompressionStream / DecompressionStream API (gzip).
 * Available in all modern browsers and Node.js ≥ 18.
 */

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Collect all chunks from a ReadableStream<Uint8Array> into one Uint8Array. */
async function collectStream(readable: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Encode Uint8Array → URL-safe base64 string. */
function toBase64Url(bytes: Uint8Array): string {
  // btoa works on binary strings
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Decode URL-safe base64 → Uint8Array. */
function fromBase64Url(b64: string): Uint8Array {
  const standard = b64.replace(/-/g, '+').replace(/_/g, '/');
  // Re-pad
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compress a Verilog source string with gzip and return a URL-safe base64
 * string suitable for the `#code=` fragment.
 */
export async function encodeVerilog(source: string): Promise<string> {
  const input = new TextEncoder().encode(source);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  // Write and close synchronously so the stream flushes before we read.
  await writer.write(input);
  await writer.close();

  const compressed = await collectStream(cs.readable);
  return toBase64Url(compressed);
}

/**
 * Decompress a URL-safe base64-encoded gzip blob back to the original Verilog
 * source string.
 */
export async function decodeVerilog(encoded: string): Promise<string> {
  const compressed = fromBase64Url(encoded);

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  await writer.write(compressed);
  await writer.close();

  const decompressed = await collectStream(ds.readable);
  return new TextDecoder().decode(decompressed);
}

// ── URL parsing / building ────────────────────────────────────────────────────

export type ShareTarget =
  | { type: 'code'; source: string }
  | { type: 'example'; name: string };

/**
 * Build a shareable URL for the current Verilog source.
 * Uses `location.href` as the base URL so callers don't need to pass it.
 */
export async function buildShareUrl(source: string, base?: string): Promise<string> {
  const encoded = await encodeVerilog(source);
  const origin = base ?? (typeof location !== 'undefined' ? location.href.split('#')[0] : '');
  return `${origin}#code=${encoded}`;
}

/**
 * Parse a share URL (or just the hash) and return the target.
 * Returns `null` if the hash contains no recognised parameter.
 */
export async function parseShareUrl(urlOrHash: string): Promise<ShareTarget | null> {
  // Accept either a full URL or just the fragment (with or without leading #).
  const hash = urlOrHash.includes('#')
    ? urlOrHash.slice(urlOrHash.indexOf('#') + 1)
    : urlOrHash.replace(/^#/, '');

  const params = new URLSearchParams(hash);

  const code = params.get('code');
  if (code) {
    const source = await decodeVerilog(code);
    return { type: 'code', source };
  }

  const example = params.get('example');
  if (example) {
    return { type: 'example', name: example };
  }

  return null;
}
