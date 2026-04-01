/**
 * Editor — CodeMirror 6 editor with Verilog syntax highlighting.
 *
 * Features:
 * - Verilog syntax via StreamLanguage + CM5 legacy mode
 * - oneDark base theme customized with CSS tokens
 * - JetBrains Mono 14px
 * - Line numbers, bracket matching, active-line highlight
 * - Search (Ctrl+F), code folding
 * - onChange callback → drives useParser
 * - Imperative highlightSignal(name) → highlight all occurrences + scroll
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from 'react';
import type { ParseError } from '../types/parser';
import { EditorView, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  StreamLanguage,
  bracketMatching,
  codeFolding,
  foldGutter,
  syntaxHighlighting,
} from '@codemirror/language';
import { verilog } from '@codemirror/legacy-modes/mode/verilog';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';
import {
  oneDarkTheme,
  oneDarkHighlightStyle,
} from '@codemirror/theme-one-dark';
import {
  Decoration,
  DecorationSet,
  ViewUpdate,
  keymap,
} from '@codemirror/view';
import { linter, lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { StateEffect, StateField, RangeSet } from '@codemirror/state';

// ── Signal-highlight decoration ───────────────────────────────────────────────

const addHighlights = StateEffect.define<DecorationSet>();
const clearHighlights = StateEffect.define<null>();

const highlightField = StateField.define<DecorationSet>({
  create: () => RangeSet.empty,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(addHighlights)) return effect.value;
      if (effect.is(clearHighlights)) return RangeSet.empty;
    }
    // Map decorations through document changes
    return value.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const signalMark = Decoration.mark({ class: 'cm-signal-highlight' });

// ── Custom theme overlay ──────────────────────────────────────────────────────
// Customizes oneDark base to match the app's Tokyo Night palette

const customTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    background: 'var(--color-bg-canvas, #1a1b26)',
  },
  '.cm-scroller': {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    lineHeight: '1.6',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: 'var(--color-accent, #7aa2f7)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--color-accent, #7aa2f7)',
  },
  '.cm-gutters': {
    background: 'var(--color-bg-canvas, #1a1b26)',
    borderRight: '1px solid var(--color-border, #2a2b3d)',
    color: 'var(--color-text-muted, #565f89)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px',
    minWidth: '32px',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 4px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(122, 162, 247, 0.08)',
  },
  '.cm-activeLine': {
    background: 'rgba(122, 162, 247, 0.06)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    background: 'rgba(122, 162, 247, 0.2)',
  },
  '.cm-matchingBracket': {
    background: 'rgba(122, 162, 247, 0.25)',
    outline: '1px solid rgba(122, 162, 247, 0.5)',
  },
  '.cm-signal-highlight': {
    background: 'rgba(224, 175, 104, 0.3)',
    outline: '1px solid rgba(224, 175, 104, 0.6)',
    borderRadius: '2px',
  },
  // Search panel
  '.cm-panels': {
    background: 'var(--color-bg-surface, #1f2030)',
    borderTop: '1px solid var(--color-border, #2a2b3d)',
    color: 'var(--color-text-primary, #c0caf5)',
  },
  '.cm-searchMatch': {
    background: 'rgba(224, 175, 104, 0.2)',
    outline: '1px solid rgba(224, 175, 104, 0.4)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    background: 'rgba(224, 175, 104, 0.4)',
  },
});

// ── Editor public API (exposed via ref) ───────────────────────────────────────

export interface EditorHandle {
  /** Highlight all occurrences of a signal name and scroll to first match. */
  highlightSignal(name: string): void;
  /** Clear signal highlights. */
  clearSignalHighlight(): void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Called when the user clicks a word in the editor.
   * The diagram will highlight matching wires.
   * Pass `null` to clear wire highlighting.
   */
  onSignalClick?: (name: string | null) => void;
  /** Parse errors to show as red underlines in the editor. */
  parseErrors?: ParseError[];
  style?: React.CSSProperties;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { value, onChange, onSignalClick, parseErrors, style, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Track the latest callbacks without recreating extensions
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSignalClickRef = useRef(onSignalClick);
  onSignalClickRef.current = onSignalClick;
  const parseErrorsRef = useRef(parseErrors);
  parseErrorsRef.current = parseErrors;

  // Create the editor once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const verilogLang = StreamLanguage.define(verilog);

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        // Language
        verilogLang,
        syntaxHighlighting(oneDarkHighlightStyle),
        // Theme
        oneDarkTheme,
        customTheme,
        // UI features
        lineNumbers(),
        foldGutter(),
        lintGutter(),
        highlightActiveLine(),
        bracketMatching(),
        codeFolding(),
        // Linting (parse errors → red underlines)
        linter(() => [], { delay: 0 }),
        // History
        history(),
        // Search
        search(),
        // Autocomplete
        autocompletion(),
        // Keybindings
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        // Signal highlights
        highlightField,
        // Change listener
        updateListener,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Sync external value changes (e.g. loading an example file)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return; // No-op if already in sync
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  // Sync parse errors → CodeMirror diagnostics (red underlines)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const doc = view.state.doc;
    const diagnostics: Diagnostic[] = (parseErrors ?? []).map((err) => {
      // Convert 1-based line/col to doc offset
      const line = err.loc?.line ?? 1;
      const col = err.loc?.column ?? 1;
      const lineInfo = doc.line(Math.min(line, doc.lines));
      const from = Math.min(lineInfo.from + col - 1, lineInfo.to);
      const to = Math.min(from + 1, lineInfo.to);
      return {
        from,
        to,
        severity: 'error' as const,
        message: err.message,
      };
    });
    view.dispatch(setDiagnostics(view.state, diagnostics));
  }, [parseErrors]);

  // Expose imperative API
  useImperativeHandle(
    ref,
    () => ({
      highlightSignal(name: string) {
        const view = viewRef.current;
        if (!view) return;

        const doc = view.state.doc.toString();
        const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, 'g');
        const decorations: ReturnType<typeof signalMark.range>[] = [];
        let match: RegExpExecArray | null;
        let firstFrom: number | null = null;

        while ((match = pattern.exec(doc)) !== null) {
          const from = match.index;
          const to = from + match[0].length;
          decorations.push(signalMark.range(from, to));
          if (firstFrom === null) firstFrom = from;
        }

        if (decorations.length === 0) return;

        // Decorations must be in sorted order
        decorations.sort((a, b) => a.from - b.from);
        const decoSet = Decoration.set(decorations);

        view.dispatch({ effects: addHighlights.of(decoSet) });

        // Scroll to first occurrence
        if (firstFrom !== null) {
          view.dispatch({
            selection: { anchor: firstFrom },
            scrollIntoView: true,
          });
        }
      },

      clearSignalHighlight() {
        viewRef.current?.dispatch({ effects: clearHighlights.of(null) });
      },
    }),
    [],
  );

  // Detect the word under the mouse cursor on click and emit it as a
  // potential signal name so the diagram can highlight matching wires.
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const view = viewRef.current;
      if (!view) return;
      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      if (pos == null) return;
      const word = view.state.wordAt(pos);
      if (word) {
        const name = view.state.sliceDoc(word.from, word.to);
        onSignalClickRef.current?.(name);
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', overflow: 'hidden', ...style }}
      className={className}
      onMouseDown={handleMouseDown}
    />
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
