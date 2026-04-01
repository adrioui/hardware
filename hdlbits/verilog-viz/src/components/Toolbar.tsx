/**
 * Toolbar — top bar of the editor panel.
 *
 * Contains:
 *  - Example selector dropdown (loads files from public/examples/)
 *  - Parse status indicator (green/red dot)
 *  - Simulation controls: play/pause, step, reset, time, speed
 *  - Theme toggle (dark / light, persisted to localStorage)
 */

import React, { useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Speed multipliers available in the speed-control dropdown. */
export type SimSpeed = 1 | 10 | 100;

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
  /** Called when the user clicks "Export SVG". */
  onExportSvg?: () => void;
  /** Called when the user clicks "Export PNG". */
  onExportPng?: () => void;
  /** Called when the user clicks "Share". */
  onShare?: () => void;

  // ── Simulation controls (optional; hidden when not provided) ──────────────
  /** True once the simulator worker is ready to accept commands. */
  isSimReady?: boolean;
  /** True while the auto-run timer is active. */
  isSimRunning?: boolean;
  /** Current simulation time (clock cycles). */
  simTime?: number;
  /** Current speed multiplier. */
  simSpeed?: SimSpeed;
  /** Start continuous run. */
  onSimPlay?: () => void;
  /** Pause continuous run. */
  onSimPause?: () => void;
  /** Advance one clock cycle. */
  onSimStep?: () => void;
  /** Reset simulation to t=0. */
  onSimReset?: () => void;
  /** Change simulation speed. */
  onSimSpeedChange?: (speed: SimSpeed) => void;
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

  simGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  timeDisplay: {
    fontSize: 11,
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--color-text-muted)',
    minWidth: 44,
    textAlign: 'right' as const,
    letterSpacing: '0.02em',
    flexShrink: 0,
  } satisfies React.CSSProperties,

  divider: {
    width: 1,
    height: 16,
    background: 'var(--color-border)',
    flexShrink: 0,
    margin: '0 2px',
  } satisfies React.CSSProperties,
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function Toolbar({
  isOk,
  isBusy,
  theme,
  onThemeToggle,
  onExampleLoad,
  onExportSvg,
  onExportPng,
  onShare,
  isSimReady = false,
  isSimRunning = false,
  simTime = 0,
  simSpeed = 1,
  onSimPlay,
  onSimPause,
  onSimStep,
  onSimReset,
  onSimSpeedChange,
}: ToolbarProps) {
  const hasSimulation = Boolean(onSimPlay || onSimPause || onSimStep || onSimReset);
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

      {/* ── Simulation controls ────────────────────────────────────────── */}
      {hasSimulation && (
        <>
          <div style={S.simGroup}>
            {/* Reset */}
            <button
              style={{
                ...S.btn,
                ...((!isSimReady) ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
              disabled={!isSimReady}
              onClick={onSimReset}
              title="Reset simulation"
              aria-label="Reset simulation"
            >
              ⟳
            </button>

            {/* Step */}
            <button
              style={{
                ...S.btn,
                ...((!isSimReady || isSimRunning) ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
              disabled={!isSimReady || isSimRunning}
              onClick={onSimStep}
              title="Step one clock cycle"
              aria-label="Step"
            >
              ⏭
            </button>

            {/* Play / Pause */}
            <button
              style={{
                ...S.btn,
                ...(!isSimReady ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
              disabled={!isSimReady}
              onClick={isSimRunning ? onSimPause : onSimPlay}
              title={isSimRunning ? 'Pause simulation' : 'Run simulation'}
              aria-label={isSimRunning ? 'Pause' : 'Play'}
            >
              {isSimRunning ? '⏸' : '▶'}
            </button>
          </div>

          <div style={S.divider} />

          {/* Speed selector */}
          <select
            style={{
              ...S.select,
              ...(!isSimReady ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
            }}
            disabled={!isSimReady}
            value={simSpeed}
            onChange={(e) =>
              onSimSpeedChange?.(Number(e.target.value) as SimSpeed)
            }
            aria-label="Simulation speed"
            title="Simulation speed"
          >
            <option value={1}>1×</option>
            <option value={10}>10×</option>
            <option value={100}>100×</option>
          </select>

          {/* Time counter */}
          <span style={S.timeDisplay} title="Simulation time (clock cycles)">
            T:{simTime}
          </span>

          <div style={S.divider} />
        </>
      )}

      {/* Export buttons */}
      {(onExportSvg || onExportPng) && (
        <>
          <div style={S.divider} />
          {onExportSvg && (
            <button
              style={S.btn}
              onClick={onExportSvg}
              title="Export diagram as SVG"
              aria-label="Export SVG"
            >
              SVG
            </button>
          )}
          {onExportPng && (
            <button
              style={S.btn}
              onClick={onExportPng}
              title="Export diagram as PNG"
              aria-label="Export PNG"
            >
              PNG
            </button>
          )}
        </>
      )}

      {/* Share button */}
      {onShare && (
        <button
          style={S.btn}
          onClick={onShare}
          title="Copy share URL to clipboard"
          aria-label="Share"
        >
          ⎘ Share
        </button>
      )}

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
