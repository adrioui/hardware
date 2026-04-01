/**
 * App — top-level layout for the Verilog hierarchy visualizer.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │  Toolbar (title + status)                │
 *   ├──────────────────┬───────────────────────┤
 *   │  Code Editor     │  Diagram Canvas       │
 *   │  (textarea)      │  (React Flow)         │
 *   │                  │                       │
 *   ├──────────────────┴───────────────────────┤
 *   │  Error bar (parse errors, if any)        │
 *   └──────────────────────────────────────────┘
 *
 * Data flow:
 *   code (string) → useParser → ParsedDesign
 *                             → useLayout  → nodes/edges → DiagramCanvas
 */

import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useParser } from './hooks/useParser';
import { useLayout } from './hooks/useLayout';
import { DiagramCanvas } from './components/DiagramCanvas';

// ── Default Verilog code shown on first load ──────────────────────────────────

const DEFAULT_CODE = `// Full adder — hierarchy example
// full_adder instantiates two half_adder modules and an or gate

module half_adder (
    input  wire a,
    input  wire b,
    output wire sum,
    output wire carry
);
  assign sum   = a ^ b;
  assign carry = a & b;
endmodule

module full_adder (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
  wire sum1, carry1, carry2;

  half_adder ha0 (
      .a    (a),
      .b    (b),
      .sum  (sum1),
      .carry(carry1)
  );

  half_adder ha1 (
      .a    (sum1),
      .b    (cin),
      .sum  (sum),
      .carry(carry2)
  );

  assign cout = carry1 | carry2;
endmodule
`.trimStart();

// ── Inline style constants ────────────────────────────────────────────────────

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    background: 'var(--color-bg-canvas)',
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
  } satisfies React.CSSProperties,

  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: 40,
    background: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
    userSelect: 'none' as const,
  } satisfies React.CSSProperties,

  toolbarTitle: {
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: '0.02em',
    color: 'var(--color-text-primary)',
  } satisfies React.CSSProperties,

  toolbarStatus: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    fontFamily: 'monospace',
  } satisfies React.CSSProperties,

  panelGroup: {
    flex: 1,
    overflow: 'hidden',
  } satisfies React.CSSProperties,

  editorPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'var(--color-bg-surface)',
    borderRight: '1px solid var(--color-border)',
  } satisfies React.CSSProperties,

  editorLabel: {
    padding: '4px 12px',
    fontSize: 11,
    color: 'var(--color-text-muted)',
    background: 'var(--color-bg-canvas)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  } satisfies React.CSSProperties,

  textarea: {
    flex: 1,
    resize: 'none' as const,
    border: 'none',
    outline: 'none',
    padding: '12px 14px',
    background: 'var(--color-bg-canvas)',
    color: 'var(--color-text-primary)',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    fontSize: 13,
    lineHeight: 1.6,
    overflowY: 'auto' as const,
    whiteSpace: 'pre' as const,
    tabSize: 2,
  } satisfies React.CSSProperties,

  resizeHandle: {
    width: 4,
    background: 'var(--color-border)',
    cursor: 'col-resize',
    transition: 'background 150ms',
    flexShrink: 0,
  } satisfies React.CSSProperties,

  canvasPanel: {
    height: '100%',
    position: 'relative' as const,
  } satisfies React.CSSProperties,

  errorBar: {
    flexShrink: 0,
    padding: '6px 14px',
    background: '#2d1b1e',
    borderTop: '1px solid #5a1f28',
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'var(--color-wire-reset)',
    overflowY: 'auto' as const,
    maxHeight: 100,
  } satisfies React.CSSProperties,

  errorItem: {
    marginBottom: 2,
  } satisfies React.CSSProperties,
} as const;

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);

  // 1. Parse the Verilog source (debounced 300 ms)
  const { design, errors, isParsing } = useParser(code);

  // 2. Run ELK layout on the parsed design
  const { nodes, edges, isLayouting } = useLayout(design);

  const busy = isParsing || isLayouting;

  // Status line shown in toolbar
  const statusText = busy
    ? isParsing
      ? 'Parsing…'
      : 'Laying out…'
    : errors.length > 0
      ? `${errors.length} error${errors.length > 1 ? 's' : ''}`
      : nodes.length > 0
        ? `${nodes.length} node${nodes.length > 1 ? 's' : ''}, ${edges.length} wire${edges.length !== 1 ? 's' : ''}`
        : 'Ready';

  return (
    <div style={S.root}>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <header style={S.toolbar}>
        <span style={S.toolbarTitle}>Verilog Visualizer</span>
        <span style={S.toolbarStatus}>{statusText}</span>
      </header>

      {/* ── Split pane ──────────────────────────────────────────────── */}
      <PanelGroup direction="horizontal" style={S.panelGroup}>
        {/* Left: code editor */}
        <Panel defaultSize={35} minSize={15} maxSize={60}>
          <div style={S.editorPanel}>
            <div style={S.editorLabel}>Verilog source</div>
            <textarea
              style={S.textarea}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              aria-label="Verilog source editor"
            />
            {errors.length > 0 && (
              <div style={S.errorBar}>
                {errors.map((err, i) => (
                  <div key={i} style={S.errorItem}>
                    {err.severity === 'warning' ? '⚠' : '✖'}{' '}
                    Line {err.loc.line}: {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* Resize handle */}
        <PanelResizeHandle style={S.resizeHandle} />

        {/* Right: diagram canvas */}
        <Panel minSize={30}>
          <div style={S.canvasPanel}>
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              style={{ height: '100%' }}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
