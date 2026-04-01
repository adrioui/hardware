/**
 * useKeyboardShortcuts — registers global keyboard shortcuts for the app.
 *
 * Shortcuts:
 *   Ctrl+Enter          → onParse (parse / re-layout)
 *   Ctrl+Shift+Enter    → onSynthesize
 *   Space               → onSimPlayPause  (diagram focused only)
 *   →                   → onSimStep       (diagram focused only)
 *   Ctrl+\              → onToggleEditor
 *   Ctrl+J              → onToggleWaveform
 *   F                   → onFitView       (when not typing)
 *
 * Uses a stable ref internally so callbacks don't need to be memoised by the
 * caller and the event listener is only added once.
 */

import { useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KeyboardShortcutsConfig {
  /** Ctrl+Enter — force parse / re-layout */
  onParse?: () => void;
  /** Ctrl+Shift+Enter — trigger synthesis */
  onSynthesize?: () => void;
  /** Space (diagram focused) — toggle simulation play/pause */
  onSimPlayPause?: () => void;
  /** ArrowRight (diagram focused) — step one clock cycle */
  onSimStep?: () => void;
  /** Ctrl+\ — collapse/expand the editor panel */
  onToggleEditor?: () => void;
  /** Ctrl+J — collapse/expand the waveform panel */
  onToggleWaveform?: () => void;
  /** F (when not in a text field) — fit diagram to view */
  onFitView?: () => void;
  /**
   * Return true when the diagram area is considered focused.
   * Space and → only fire when this returns true.
   */
  isDiagramFocused?: () => boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig): void {
  // Keep a stable ref so the effect is only registered once yet always sees the
  // latest callbacks without needing them as dependencies.
  const configRef = useRef<KeyboardShortcutsConfig>(config);
  configRef.current = config;

  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      const cfg = configRef.current;
      const target = e.target as HTMLElement;

      // Don't steal keystrokes from form inputs or CodeMirror
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      const ctrl = e.ctrlKey || e.metaKey;
      const diagramFocused = cfg.isDiagramFocused?.() ?? false;

      // ── Global shortcuts (always fire unless editing) ─────────────────────

      // Ctrl+Shift+Enter → synthesize
      if (ctrl && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        cfg.onSynthesize?.();
        return;
      }

      // Ctrl+Enter → parse / re-layout
      if (ctrl && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        cfg.onParse?.();
        return;
      }

      // Ctrl+\ → toggle editor panel
      if (ctrl && e.key === '\\') {
        e.preventDefault();
        cfg.onToggleEditor?.();
        return;
      }

      // Ctrl+J → toggle waveform panel
      if (ctrl && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        cfg.onToggleWaveform?.();
        return;
      }

      // ── Non-editing shortcuts ─────────────────────────────────────────────
      if (!isEditing) {
        // F → fit diagram to view
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          cfg.onFitView?.();
          return;
        }

        // Diagram-focused shortcuts
        if (diagramFocused) {
          // Space → play/pause simulation
          if (e.key === ' ') {
            e.preventDefault();
            cfg.onSimPlayPause?.();
            return;
          }

          // → → step simulation
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            cfg.onSimStep?.();
            return;
          }
        }
      }
    }

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []); // intentionally empty — config is read via ref
}
