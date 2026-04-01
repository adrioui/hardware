/**
 * App — top-level layout for the Verilog hierarchy visualizer.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │  PanelGroup (horizontal split)           │
 *   │  ┌─────────────────┬────────────────────┐│
 *   │  │  editor-panel   │  diagram-panel     ││
 *   │  │  ┌───────────┐  │                    ││
 *   │  │  │ Toolbar   │  │  DiagramCanvas     ││
 *   │  │  ├───────────┤  │  (React Flow)      ││
 *   │  │  │ Editor    │  │                    ││
 *   │  │  │ (CM6)     │  │                    ││
 *   │  │  └───────────┘  │                    ││
 *   │  └─────────────────┴────────────────────┘│
 *   │  StatusBar                               │
 *   └──────────────────────────────────────────┘
 *
 * Data flow:
 *   code (string) → useParser → ParsedDesign
 *                             → useLayout  → nodes/edges → DiagramCanvas
 *
 * Cross-panel signal highlighting:
 *   clicking a wire edge → selectedSignal → Editor.highlightSignal()
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useParser } from './hooks/useParser';
import { useLayout } from './hooks/useLayout';
import { DiagramCanvas } from './components/DiagramCanvas';
import { Editor, type EditorHandle } from './components/Editor';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';

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

// ── Theme helpers ─────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light';

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem('verilog-viz-theme');
    if (v === 'dark' || v === 'light') return v;
  } catch {
    // ignore
  }
  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [code, setCode] = useState(DEFAULT_CODE);
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  // Ref to CodeMirror editor for imperative API
  const editorRef = useRef<EditorHandle>(null);

  // ── Apply theme on mount and changes ───────────────────────────────────────
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('verilog-viz-theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // ── Parse & layout ─────────────────────────────────────────────────────────
  const { design, errors, isParsing } = useParser(code);
  const { nodes, edges, isLayouting } = useLayout(design);

  const busy = isParsing || isLayouting;
  const isOk = !busy && errors.length === 0 && nodes.length > 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleThemeToggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleExampleLoad = useCallback(async (filename: string) => {
    try {
      const res = await fetch(`/examples/${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setCode(text);
      editorRef.current?.clearSignalHighlight();
      setSelectedSignal(null);
    } catch (err) {
      console.error('Failed to load example:', filename, err);
    }
  }, []);

  const handleSignalSelect = useCallback((signal: string | null) => {
    setSelectedSignal(signal);
    if (signal) {
      editorRef.current?.highlightSignal(signal);
    } else {
      editorRef.current?.clearSignalHighlight();
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      <PanelGroup direction="horizontal" className="app-panel-group">
        {/* ── Left: editor panel ───────────────────────────────────────── */}
        <Panel defaultSize={40} minSize={20} maxSize={65}>
          <div className="editor-panel">
            <Toolbar
              isOk={isOk}
              isBusy={busy}
              theme={theme}
              onThemeToggle={handleThemeToggle}
              onExampleLoad={handleExampleLoad}
            />
            <Editor
              ref={editorRef}
              value={code}
              onChange={setCode}
              onSignalClick={handleSignalSelect}
              className="editor-cm"
            />
          </div>
        </Panel>

        {/* ── Resize handle ────────────────────────────────────────────── */}
        <PanelResizeHandle className="resize-handle" />

        {/* ── Right: diagram panel ─────────────────────────────────────── */}
        <Panel defaultSize={60} minSize={30}>
          <div className="diagram-panel">
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              onPaneClick={() => handleSignalSelect(null)}
              onSignalSelect={handleSignalSelect}
              selectedSignal={selectedSignal}
              style={{ height: '100%' }}
            />
          </div>
        </Panel>
      </PanelGroup>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <StatusBar
        design={design}
        errors={errors}
        isParsing={isParsing}
        isLayouting={isLayouting}
      />
    </div>
  );
}

export default App;
