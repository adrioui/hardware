/**
 * StatusBar — bottom bar showing parse results and module counts.
 */

import React from 'react';
import type { ParsedDesign, ParseError } from '../types';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface StatusBarProps {
  design: ParsedDesign | null;
  errors: ParseError[];
  isParsing: boolean;
  isLayouting: boolean;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 12px',
    height: 24,
    background: 'var(--color-bg-surface)',
    borderTop: '1px solid var(--color-border)',
    flexShrink: 0,
    fontSize: 11,
    fontFamily: '"JetBrains Mono", monospace',
    color: 'var(--color-text-muted)',
    userSelect: 'none' as const,
    overflowX: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
  } satisfies React.CSSProperties,

  ok: {
    color: 'var(--color-port-input)',
  } satisfies React.CSSProperties,

  err: {
    color: 'var(--color-wire-reset)',
  } satisfies React.CSSProperties,

  muted: {
    color: 'var(--color-text-muted)',
  } satisfies React.CSSProperties,
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function countInstances(design: ParsedDesign): number {
  let sum = 0;
  for (const mod of design.modules.values()) sum += mod.instances.length;
  return sum;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusBar({
  design,
  errors,
  isParsing,
  isLayouting,
}: StatusBarProps) {
  let content: React.ReactNode;

  if (isParsing) {
    content = <span style={S.muted}>Parsing…</span>;
  } else if (isLayouting) {
    content = <span style={S.muted}>Laying out…</span>;
  } else if (errors.length > 0) {
    const first = errors[0];
    const more = errors.length > 1 ? ` (+${errors.length - 1} more)` : '';
    content = (
      <span style={S.err}>
        ✖ Line {first.loc.line}: {first.message}{more}
      </span>
    );
  } else if (design && design.modules.size > 0) {
    const modCount = design.modules.size;
    const instCount = countInstances(design);
    content = (
      <span style={S.ok}>
        ✔ Parsed {modCount} module{modCount !== 1 ? 's' : ''}
        {instCount > 0
          ? `, ${instCount} instance${instCount !== 1 ? 's' : ''}`
          : ''}
      </span>
    );
  } else {
    content = <span style={S.muted}>Ready</span>;
  }

  return <div style={S.bar}>{content}</div>;
}
