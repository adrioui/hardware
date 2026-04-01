/**
 * Toolbar — top bar of the editor panel.
 *
 * Contains:
 *  - Example selector dropdown (loads files from public/examples/)
 *  - Parse status indicator (green/red dot)
 *  - Theme toggle (dark / light, persisted to localStorage)
 *  - Placeholder buttons for future phases
 */

import React, { useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolbarProps {
  /** Whether the parse result is clean (no errors). */
  isOk: boolean;
  /** True while parsing or laying out. */
  isBusy: boolean;
  /** Currently active theme. */
  theme: 'dark' | 'light';
  /** Called when the user toggles the theme. */
  onThemeToggle: () => void;
  /** Called when the user picks an example file. Value is the filename (e.g. "full_adder.v"). */
  onExampleLoad: (filename: string) => void;
}

// ── Example filenames (must match files in public/examples/) ──────────────────

const EXAMPLES = [
  'full_adder.v',
  'alu.v',
  'counter.v',
  'fsm.v',
  'mux4.v',
] as const;

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px',
    height: 36,
    background: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
    userSelect: 'none' as const,
    overflowX: 'hidden' as const,
  } satisfies React.CSSProperties,

  label: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  select: {
    background: 'var(--color-bg-canvas)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
  } satisfies React.CSSProperties,

  indicator: (isOk: boolean, isBusy: boolean): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    background: isBusy
      ? 'var(--color-text-muted)'
      : isOk
        ? 'var(--color-port-input)'   // green
        : 'var(--color-wire-reset)',  // red
    boxShadow: isBusy
      ? 'none'
      : isOk
        ? '0 0 4px var(--color-port-input)'
        : '0 0 4px var(--color-wire-reset)',
    transition: 'background 200ms, box-shadow 200ms',
  }),

  spacer: {
    flex: 1,
  } satisfies React.CSSProperties,

  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-canvas)',
    color: 'var(--color-text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
    lineHeight: 1.4,
  } satisfies React.CSSProperties,
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function Toolbar({
  isOk,
  isBusy,
  theme,
  onThemeToggle,
  onExampleLoad,
}: ToolbarProps) {
  const handleExampleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val) onExampleLoad(val);
      // Reset to placeholder so the same file can be re-selected
      e.target.value = '';
    },
    [onExampleLoad],
  );

  return (
    <div style={S.toolbar}>
      {/* Parse status dot */}
      <div
        style={S.indicator(isOk, isBusy)}
        title={isBusy ? 'Working…' : isOk ? 'Parsed OK' : 'Parse error'}
        aria-label={isBusy ? 'Working' : isOk ? 'Parsed OK' : 'Parse error'}
      />

      {/* Example selector */}
      <span style={S.label}>Examples</span>
      <select
        style={S.select}
        defaultValue=""
        onChange={handleExampleChange}
        aria-label="Load example"
      >
        <option value="" disabled>
          Load…
        </option>
        {EXAMPLES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <div style={S.spacer} />

      {/* Placeholder: Synthesize (Phase 4) */}
      <button style={{ ...S.btn, opacity: 0.4, cursor: 'not-allowed' }} disabled>
        Synthesize
      </button>

      {/* Placeholder: Simulate (Phase 5) */}
      <button style={{ ...S.btn, opacity: 0.4, cursor: 'not-allowed' }} disabled>
        Simulate
      </button>

      {/* Theme toggle */}
      <button
        style={S.btn}
        onClick={onThemeToggle}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    </div>
  );
}
