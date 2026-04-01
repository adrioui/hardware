/**
 * Waveform — canvas-based timing-diagram panel (WaveDrom-style).
 *
 * Renders digital waveforms for a set of watched signals from SimHistory.
 * Single-bit signals get classic high/low traces; multi-bit get labelled
 * transition boxes.
 *
 * Layout:
 *   ┌──────────┬──────────────────────────────────────┐
 *   │ SIGNALS  │  ← scrollable timeline canvas →      │
 *   │ clk      │  ┌─┐ ┌─┐ ┌─┐ ┌─┐                     │
 *   │ a        │  │ └─┘ └─┘ └─┘ └─┘                   │
 *   │ sum [7:0]│  │ 0x00 │ 0x01 │ 0xFF │              │
 *   └──────────┴──────────────────────────────────────┘
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { SimHistory, SignalValue, Bit } from '../core/simulator';

// ── Constants ────────────────────────────────────────────────────────────────

const LABEL_WIDTH = 140;
const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 24;
const TICK_WIDTH = 28; // pixels per simulation tick
const PADDING_V = 6;
const WAVE_HIGH = ROW_HEIGHT * 0.18;
const WAVE_LOW = ROW_HEIGHT * 0.82;
const WAVE_MID = ROW_HEIGHT * 0.5;

// Tokyo Night colours
const C = {
  bg: '#1a1b26',
  surface: '#24283b',
  border: '#3b4261',
  text: '#c0caf5',
  muted: '#565f89',
  high: '#9ece6a',
  low: '#4a5073',
  unknown: '#f7768e',
  hiZ: '#9d7cd8',
  bus: '#7aa2f7',
  grid: '#1f2335',
  cursor: '#ff9e64',
  headerBg: '#1f2335',
  rowAlt: '#1e2030',
  removeBtn: '#f7768e',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sigColor(bit: Bit): string {
  switch (bit) {
    case '1': return C.high;
    case '0': return C.low;
    case 'x': return C.unknown;
    case 'z': return C.hiZ;
  }
}

function signalToHex(sv: SignalValue): string {
  const bits = sv.bits;
  if (bits.length === 0) return '?';
  // Check for unknown/hiZ
  if (bits.some(b => b === 'x')) return 'x';
  if (bits.some(b => b === 'z')) return 'z';
  // Convert bits to BigInt (MSB first)
  let val = 0n;
  for (const b of bits) {
    val = (val << 1n) | (b === '1' ? 1n : 0n);
  }
  const hex = val.toString(16).toUpperCase();
  const nibbles = Math.ceil(bits.length / 4);
  return '0x' + hex.padStart(nibbles, '0');
}

function isSingleBit(sv: SignalValue | undefined): boolean {
  return !sv || sv.width === 1;
}

/**
 * Look up a signal value in a snapshot by name (string key) or numeric key.
 * Returns undefined when not found.
 */
function lookupSignal(
  snapshot: Map<string | number, SignalValue>,
  id: string,
): SignalValue | undefined {
  // Direct string lookup first
  if (snapshot.has(id)) return snapshot.get(id);
  // Try numeric parse
  const n = parseInt(id, 10);
  if (!isNaN(n) && snapshot.has(n)) return snapshot.get(n);
  return undefined;
}

// ── Canvas renderer ──────────────────────────────────────────────────────────

interface DrawOptions {
  canvas: HTMLCanvasElement;
  signalHistory: SimHistory;
  watchedSignals: string[];
  scrollX: number;
  currentTime: number;
}

function drawWaveforms({
  canvas,
  signalHistory,
  watchedSignals,
  scrollX,
  currentTime,
}: DrawOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const ticks = signalHistory.times.length;

  ctx.clearRect(0, 0, W, H);

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Grid lines (alternating row stripes) ────────────────────────────────
  watchedSignals.forEach((_, i) => {
    const y = HEADER_HEIGHT + i * ROW_HEIGHT;
    if (i % 2 === 1) {
      ctx.fillStyle = C.rowAlt;
      ctx.fillRect(0, y, W, ROW_HEIGHT);
    }
  });

  // ── Header tick labels ───────────────────────────────────────────────────
  ctx.fillStyle = C.headerBg;
  ctx.fillRect(0, 0, W, HEADER_HEIGHT);
  ctx.fillStyle = C.muted;
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  const firstTick = Math.floor(scrollX / TICK_WIDTH);
  const lastTick = Math.min(
    ticks,
    Math.ceil((scrollX + W) / TICK_WIDTH) + 1,
  );
  for (let t = firstTick; t <= lastTick; t++) {
    const x = t * TICK_WIDTH - scrollX;
    ctx.fillStyle = C.grid;
    ctx.fillRect(x, 0, 1, H);
    if (t % 5 === 0) {
      ctx.fillStyle = C.muted;
      ctx.fillText(String(t), x, HEADER_HEIGHT - 4);
    }
  }

  // ── Waveforms ────────────────────────────────────────────────────────────
  watchedSignals.forEach((sigId, rowIdx) => {
    const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT;
    const clipTop = rowY + PADDING_V;
    const clipBot = rowY + ROW_HEIGHT - PADDING_V;

    if (ticks === 0) return;

    // Collect value history for this signal
    const valueAt: (SignalValue | undefined)[] = signalHistory.snapshots.map(
      snap => lookupSignal(snap, sigId),
    );

    const firstVal = valueAt[0];
    const single = isSingleBit(firstVal);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, rowY, W, ROW_HEIGHT);
    ctx.clip();

    if (single) {
      // ── Single-bit digital trace ────────────────────────────────────────
      let prevBit: Bit = firstVal?.bits[0] ?? 'x';
      let prevX = 0 * TICK_WIDTH - scrollX;

      for (let t = 0; t < ticks; t++) {
        const sv = valueAt[t];
        const bit: Bit = sv?.bits[0] ?? 'x';
        const x = t * TICK_WIDTH - scrollX;
        const nextX = (t + 1) * TICK_WIDTH - scrollX;

        // Transition line (vertical)
        if (t > 0 && bit !== prevBit) {
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, clipTop + 2);
          ctx.lineTo(x, clipBot - 2);
          ctx.stroke();
        }

        // Horizontal trace
        const y = bit === '1'
          ? rowY + WAVE_HIGH
          : bit === 'x' || bit === 'z'
            ? rowY + WAVE_MID
            : rowY + WAVE_LOW;

        ctx.strokeStyle = sigColor(bit);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.max(x, -scrollX), y);
        ctx.lineTo(nextX, y);
        ctx.stroke();

        // x/z fill hatching
        if (bit === 'x' || bit === 'z') {
          ctx.fillStyle = bit === 'x'
            ? 'rgba(247,118,142,0.12)'
            : 'rgba(157,124,216,0.12)';
          ctx.fillRect(x, clipTop, TICK_WIDTH, ROW_HEIGHT - PADDING_V * 2);
        }

        prevBit = bit;
        prevX = x;
      }
      void prevX;
    } else {
      // ── Multi-bit bus trace (transition boxes) ──────────────────────────
      let segStart = 0;
      let prevHex = signalToHex(firstVal ?? { bits: ['x'], width: 1 });

      const drawSegment = (start: number, end: number, hex: string) => {
        const x0 = start * TICK_WIDTH - scrollX;
        const x1 = end * TICK_WIDTH - scrollX;
        if (x1 < 0 || x0 > W) return;

        const isUnknown = hex === 'x' || hex === 'z';
        const fillColor = isUnknown
          ? (hex === 'x' ? 'rgba(247,118,142,0.15)' : 'rgba(157,124,216,0.15)')
          : 'rgba(122,162,247,0.12)';
        const strokeColor = isUnknown
          ? (hex === 'x' ? C.unknown : C.hiZ)
          : C.bus;

        // Box fill
        ctx.fillStyle = fillColor;
        ctx.fillRect(x0 + 1, clipTop, x1 - x0 - 2, clipBot - clipTop);

        // Top and bottom lines
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, clipTop);
        ctx.lineTo(x1, clipTop);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0, clipBot);
        ctx.lineTo(x1, clipBot);
        ctx.stroke();

        // Transition chevrons
        if (start > 0) {
          ctx.beginPath();
          ctx.moveTo(x0, clipTop);
          ctx.lineTo(x0 + 4, WAVE_MID + rowY);
          ctx.lineTo(x0, clipBot);
          ctx.stroke();
        }

        // Value label
        const labelW = x1 - x0 - 12;
        if (labelW > 20) {
          ctx.fillStyle = strokeColor;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.save();
          ctx.beginPath();
          ctx.rect(x0 + 2, clipTop, labelW + 10, clipBot - clipTop);
          ctx.clip();
          ctx.fillText(hex, x0 + (x1 - x0) / 2, rowY + WAVE_MID + 4);
          ctx.restore();
        }
      };

      for (let t = 1; t <= ticks; t++) {
        const sv = t < ticks ? valueAt[t] : undefined;
        const hex = sv ? signalToHex(sv) : prevHex;

        if (t === ticks || hex !== prevHex) {
          drawSegment(segStart, t, prevHex);
          segStart = t;
          prevHex = hex;
        }
      }
    }

    ctx.restore();
  });

  // ── Current-time cursor ──────────────────────────────────────────────────
  if (currentTime > 0) {
    const curX = currentTime * TICK_WIDTH - scrollX;
    ctx.strokeStyle = C.cursor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Row dividers ─────────────────────────────────────────────────────────
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  watchedSignals.forEach((_, i) => {
    const y = HEADER_HEIGHT + (i + 1) * ROW_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });

  // ── Header bottom border ─────────────────────────────────────────────────
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_HEIGHT);
  ctx.lineTo(W, HEADER_HEIGHT);
  ctx.stroke();

  // ── "No signals" placeholder ─────────────────────────────────────────────
  if (watchedSignals.length === 0) {
    ctx.fillStyle = C.muted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Right-click a wire to add signals',
      W / 2,
      HEADER_HEIGHT + 40,
    );
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WaveformProps {
  /** Full signal history from useSimulation. */
  signalHistory: SimHistory;
  /** Net-IDs / signal names to watch (controlled by parent). */
  watchedSignals: string[];
  /** Current simulation time in ticks. */
  time: number;
  /** Called when the user removes a signal row. */
  onRemoveSignal?: (id: string) => void;
  /** Called to clear all watched signals. */
  onClearSignals?: () => void;
}

// ── Waveform component ────────────────────────────────────────────────────────

export function Waveform({
  signalHistory,
  watchedSignals,
  time,
  onRemoveSignal,
  onClearSignals,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  // Canvas dimensions tracked from ResizeObserver
  const [canvasW, setCanvasW] = useState(600);
  const [canvasH, setCanvasH] = useState(200);

  // Total logical width of the canvas
  const totalLogicalW = useMemo(
    () => Math.max(signalHistory.times.length * TICK_WIDTH, canvasW),
    [signalHistory.times.length, canvasW],
  );

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasW(Math.floor(width));
        setCanvasH(Math.floor(height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Draw on canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasW;
    canvas.height = canvasH;
    drawWaveforms({
      canvas,
      signalHistory,
      watchedSignals,
      scrollX,
      currentTime: time,
    });
  }, [canvasW, canvasH, signalHistory, watchedSignals, scrollX, time]);

  // ── Scroll handler ─────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setScrollX(prev =>
        Math.max(0, Math.min(totalLogicalW - canvasW, prev + e.deltaX + e.deltaY)),
      );
    },
    [totalLogicalW, canvasW],
  );

  // Auto-scroll to keep current time visible
  useEffect(() => {
    if (time <= 0) return;
    const cursorX = time * TICK_WIDTH;
    setScrollX(prev => {
      if (cursorX < prev + 40) return Math.max(0, cursorX - 40);
      if (cursorX > prev + canvasW - 60) return cursorX - canvasW + 60;
      return prev;
    });
  }, [time, canvasW]);

  // ── Computed heights ───────────────────────────────────────────────────────
  const labelAreaH =
    HEADER_HEIGHT + watchedSignals.length * ROW_HEIGHT;

  return (
    <div style={styles.root}>
      {/* Panel header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Waveform</span>
        <span style={styles.headerTime}>t = {time}</span>
        <div style={styles.spacer} />
        {watchedSignals.length > 0 && onClearSignals && (
          <button
            style={styles.clearBtn}
            onClick={onClearSignals}
            title="Clear all signals"
          >
            Clear
          </button>
        )}
      </div>

      {/* Body: labels + canvas */}
      <div style={styles.body}>
        {/* ── Left label column ──────────────────────────────────────────── */}
        <div style={styles.labelCol}>
          {/* Header spacer */}
          <div style={{ height: HEADER_HEIGHT, borderBottom: `1px solid ${C.border}` }} />

          {/* Signal rows */}
          {watchedSignals.map((id, i) => (
            <div
              key={id}
              style={{
                ...styles.labelRow,
                background: i % 2 === 1 ? C.rowAlt : C.bg,
              }}
            >
              <span style={styles.labelText} title={id}>
                {id.length > 16 ? id.slice(0, 14) + '…' : id}
              </span>
              {onRemoveSignal && (
                <button
                  style={styles.removeBtn}
                  onClick={() => onRemoveSignal(id)}
                  title={`Remove ${id}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Empty state */}
          {watchedSignals.length === 0 && (
            <div style={styles.emptyLabel}>
              No signals
            </div>
          )}
        </div>

        {/* ── Canvas area (fills remaining width, scrollable) ──────────── */}
        <div
          ref={containerRef}
          style={styles.canvasContainer}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={Math.max(
              canvasH,
              labelAreaH,
              HEADER_HEIGHT + 80,
            )}
            style={{ display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: C.bg,
    borderTop: `1px solid ${C.border}`,
    overflow: 'hidden',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  } satisfies React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 30,
    padding: '0 10px',
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
    userSelect: 'none' as const,
  } satisfies React.CSSProperties,

  headerTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: C.text,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  } satisfies React.CSSProperties,

  headerTime: {
    fontSize: 11,
    color: C.cursor,
    fontFamily: '"JetBrains Mono", monospace',
  } satisfies React.CSSProperties,

  spacer: { flex: 1 } satisfies React.CSSProperties,

  clearBtn: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 3,
    border: `1px solid ${C.border}`,
    background: 'transparent',
    color: C.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } satisfies React.CSSProperties,

  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  } satisfies React.CSSProperties,

  labelCol: {
    width: LABEL_WIDTH,
    flexShrink: 0,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    overflow: 'hidden',
  } satisfies React.CSSProperties,

  labelRow: {
    display: 'flex',
    alignItems: 'center',
    height: ROW_HEIGHT,
    padding: '0 6px 0 10px',
    borderBottom: `1px solid ${C.border}`,
    gap: 4,
  } satisfies React.CSSProperties,

  labelText: {
    flex: 1,
    fontSize: 11,
    color: C.text,
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
  } satisfies React.CSSProperties,

  removeBtn: {
    fontSize: 13,
    lineHeight: 1,
    color: C.muted,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0 2px',
    flexShrink: 0,
    fontFamily: 'inherit',
  } satisfies React.CSSProperties,

  emptyLabel: {
    padding: '12px 10px',
    fontSize: 11,
    color: C.muted,
    fontStyle: 'italic',
  } satisfies React.CSSProperties,

  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
    cursor: 'default',
  } satisfies React.CSSProperties,
} as const;

export default Waveform;
