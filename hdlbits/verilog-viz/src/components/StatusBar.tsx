/**
 * StatusBar — bottom bar showing parse results, layout state,
 * and Yosys synthesis progress.
 */

import React from 'react';
import type { ParsedDesign, ParseError } from '../types';
import type { SynthesisStatus } from '../hooks/useSynthesis';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface StatusBarProps {
  design: ParsedDesign | null;
  errors: ParseError[];
  isParsing: boolean;
  isLayouting: boolean;
  /** Current synthesis lifecycle state (optional — omit when synthesis not wired up) */
  synthesisStatus?: SynthesisStatus;
  /** Human-readable progress/error message from useSynthesis */
  synthesisMessage?: string;
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

  warn: {
    color: 'var(--color-wire-active)',
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
  synthesisStatus,
  synthesisMessage,
}: StatusBarProps) {
  let content: React.ReactNode;

  if (isParsing) {
    content = <span style={S.muted}>Parsing…</span>;
  } else if (isLayouting) {
    content = <span style={S.muted}>Laying out…</span>;
  } else if (synthesisStatus === 'loading' || synthesisStatus === 'synthesizing') {
    // Active synthesis run — highest priority after busy states
    content = (
      <span style={S.muted}>
        ⟳ {synthesisMessage ?? (synthesisStatus === 'loading' ? 'Loading Yosys engine…' : 'Synthesizing…')}
      </span>
    );
  } else if (errors.length > 0) {
    const first = errors[0];
    const more = errors.length > 1 ? ` (+${errors.length - 1} more)` : '';
    content = (
      <span style={S.err}>
        ✖ Line {first.loc.line}: {first.message}{more}
      </span>
    );
  } else if (synthesisStatus === 'error') {
    content = (
      <span style={S.err}>
        ✖ {synthesisMessage ?? 'Synthesis failed'}
      </span>
    );
  } else if (design && design.modules.size > 0) {
    const modCount = design.modules.size;
    const instCount = countInstances(design);
    const parseInfo = (
      <>✔ Parsed {modCount} module{modCount !== 1 ? 's' : ''}{instCount > 0 ? `, ${instCount} instance${instCount !== 1 ? 's' : ''}` : ''}</>
    );
    if (synthesisStatus === 'done') {
      content = (
        <span style={S.ok}>
          {parseInfo} — ✔ Synthesis complete
        </span>
      );
    } else {
      content = <span style={S.ok}>{parseInfo}</span>;
    }
  } else if (synthesisStatus === 'done') {
    content = <span style={S.ok}>✔ Synthesis complete</span>;
  } else {
    content = <span style={S.muted}>Ready</span>;
  }

  return <div style={S.bar}>{content}</div>;
}
