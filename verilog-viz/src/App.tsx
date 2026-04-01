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
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { useParser } from './hooks/useParser';
import { useLayout } from './hooks/useLayout';
import { useSimulation } from './hooks/useSimulation';
import { DiagramCanvas, type DiagramCanvasHandle } from './components/DiagramCanvas';
import { Editor, type EditorHandle } from './components/Editor';
import { Toolbar, type SimSpeed } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { Waveform } from './components/Waveform';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { buildShareUrl, parseShareUrl } from './core/url-encoding';

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

  // Ref to diagram canvas for imperative fitView
  const diagramRef = useRef<DiagramCanvasHandle>(null);

  // Ref to editor panel for toggle
  const editorPanelRef = useRef<ImperativePanelHandle>(null);

  // Waveform panel
  const waveformPanelRef = useRef<ImperativePanelHandle>(null);

  // Track whether the diagram area is hovered (for diagram-focused shortcuts)
  const isDiagramFocusedRef = useRef(false);

  // Increment to force re-layout via Ctrl+Enter
  const [layoutKey, setLayoutKey] = useState(0);
  const [watchedSignals, setWatchedSignals] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  // ── Apply theme on mount and changes ───────────────────────────────────────
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('verilog-viz-theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // ── Load code from URL hash on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!location.hash) return;
    parseShareUrl(location.hash)
      .then(async (target) => {
        if (!target) return;
        if (target.type === 'code') {
          setCode(target.source);
        } else if (target.type === 'example') {
          const res = await fetch(`/examples/${target.name}.v`);
          if (res.ok) setCode(await res.text());
        }
      })
      .catch((err: unknown) => console.warn('Failed to parse share URL:', err));
  }, []);

  // ── Parse & layout ─────────────────────────────────────────────────────────
  const { design, errors, isParsing } = useParser(code);
  const { nodes, edges, isLayouting } = useLayout(design, undefined, layoutKey);

  // ── Simulation controls state ────────────────────────────────────────
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);

  // ── Simulation (no netlist yet — wired up when synthesis completes) ─────────
  const {
    signalHistory: simHistory,
    time: simTime,
    isRunning: isSimRunning,
    isReady: isSimReady,
    step: simStep,
    run: simRun,
    pause: simPause,
    reset: simReset,
  } = useSimulation(null, null);

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

  const handleSimPlay = useCallback(() => {
    simRun({ stepsPerTick: simSpeed });
  }, [simRun, simSpeed]);

  const handleSimPause = useCallback(() => {
    simPause();
  }, [simPause]);

  const handleSimStep = useCallback(() => {
    simStep(1);
  }, [simStep]);

  const handleSimReset = useCallback(() => {
    simReset();
  }, [simReset]);

  // ── Keyboard shortcut handlers ─────────────────────────────────────────────

  const handleForceRelayout = useCallback(() => {
    setLayoutKey((k) => k + 1);
  }, []);

  const handleToggleEditor = useCallback(() => {
    const panel = editorPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, []);

  const handleToggleWaveform = useCallback(() => {
    const panel = waveformPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.resize(30);
    } else {
      panel.collapse();
    }
  }, []);

  const handleSimPlayPause = useCallback(() => {
    if (isSimRunning) {
      simPause();
    } else {
      simRun({ stepsPerTick: simSpeed });
    }
  }, [isSimRunning, simPause, simRun, simSpeed]);

  useKeyboardShortcuts({
    onParse: handleForceRelayout,
    onSimPlayPause: handleSimPlayPause,
    onSimStep: handleSimStep,
    onToggleEditor: handleToggleEditor,
    onToggleWaveform: handleToggleWaveform,
    onFitView: () => diagramRef.current?.fitView(),
    isDiagramFocused: () => isDiagramFocusedRef.current,
  });

  // ── Export handlers ───────────────────────────────────────────────────────

  const handleExportSvg = useCallback(() => {
    diagramRef.current?.exportSvg(theme).catch((err: unknown) =>
      console.error('SVG export failed:', err),
    );
  }, [theme]);

  const handleExportPng = useCallback(() => {
    diagramRef.current?.exportPng(theme).catch((err: unknown) =>
      console.error('PNG export failed:', err),
    );
  }, [theme]);

  const showToast = useCallback((text: string, variant: ToastMessage['variant'] = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, variant }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleShare = useCallback(() => {
    buildShareUrl(code)
      .then((url) => navigator.clipboard.writeText(url))
      .then(() => showToast('Share URL copied to clipboard ✓'))
      .catch(() => showToast('Failed to copy URL', 'error'));
  }, [code, showToast]);

  const handleSimSpeedChange = useCallback((speed: SimSpeed) => {
    setSimSpeed(speed);
    // If currently running, restart with new speed
    if (isSimRunning) {
      simRun({ stepsPerTick: speed });
    }
  }, [isSimRunning, simRun]);

  const handleAddToWaveform = useCallback((signalName: string) => {
    setWatchedSignals(prev => {
      if (prev.includes(signalName)) return prev;
      return [...prev, signalName];
    });
    // Expand the waveform panel if it's currently collapsed
    const panel = waveformPanelRef.current;
    if (panel && panel.getSize() < 5) {
      panel.resize(30);
    }
  }, []);

  const handleRemoveSignal = useCallback((id: string) => {
    setWatchedSignals(prev => prev.filter(s => s !== id));
  }, []);

  const handleClearSignals = useCallback(() => {
    setWatchedSignals([]);
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
        <Panel ref={editorPanelRef} collapsible defaultSize={40} minSize={20} maxSize={65}>
          <div className="editor-panel">
            <Toolbar
              isOk={isOk}
              isBusy={busy}
              theme={theme}
              onThemeToggle={handleThemeToggle}
              onExampleLoad={handleExampleLoad}
              onExportSvg={handleExportSvg}
              onExportPng={handleExportPng}
              onShare={handleShare}
              isSimReady={isSimReady}
              isSimRunning={isSimRunning}
              simTime={simTime}
              simSpeed={simSpeed}
              onSimPlay={handleSimPlay}
              onSimPause={handleSimPause}
              onSimStep={handleSimStep}
              onSimReset={handleSimReset}
              onSimSpeedChange={handleSimSpeedChange}
            />
            <Editor
              ref={editorRef}
              value={code}
              onChange={setCode}
              onSignalClick={handleSignalSelect}
              parseErrors={errors}
              className="editor-cm"
            />
          </div>
        </Panel>

        {/* ── Resize handle ────────────────────────────────────────────── */}
        <PanelResizeHandle className="resize-handle" />

        {/* ── Right: diagram panel ─────────────────────────────────────── */}
        {/* ── Right: diagram + waveform (vertical split) ─────────────────── */}
        <Panel defaultSize={60} minSize={30}>
          <PanelGroup direction="vertical">
            {/* Diagram canvas */}
            <Panel defaultSize={70} minSize={30}>
              <div
                className="diagram-panel"
                onMouseEnter={() => { isDiagramFocusedRef.current = true; }}
                onMouseLeave={() => { isDiagramFocusedRef.current = false; }}
              >
                <DiagramCanvas
                  ref={diagramRef}
                  nodes={nodes}
                  edges={edges}
                  onPaneClick={() => handleSignalSelect(null)}
                  onSignalSelect={handleSignalSelect}
                  selectedSignal={selectedSignal}
                  onAddToWaveform={handleAddToWaveform}
                  style={{ height: '100%' }}
                />
              </div>
            </Panel>

            {/* Waveform panel — collapsible, starts collapsed */}
            <PanelResizeHandle className="resize-handle resize-handle--horizontal" />
            <Panel
              ref={waveformPanelRef}
              defaultSize={0}
              minSize={15}
              collapsible
              collapsedSize={0}
            >
              <Waveform
                signalHistory={simHistory}
                watchedSignals={watchedSignals}
                time={simTime}
                onRemoveSignal={handleRemoveSignal}
                onClearSignals={handleClearSignals}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* ── Toast notifications ──────────────────────────────────────────── */}
      <ToastContainer messages={toasts} onDismiss={dismissToast} />

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
