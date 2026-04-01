# Phase 3: Split-Pane Layout + Editor Integration

## Overview

Wire up CodeMirror 6 editor with Verilog syntax highlighting, resizable split-pane layout, toolbar with example selector, and cross-panel signal highlighting.

## CodeMirror 6 Editor Component

**File**: `src/components/Editor.tsx`

```bash
npm install @codemirror/view @codemirror/state @codemirror/language \
  @codemirror/legacy-modes @codemirror/commands @codemirror/search \
  @codemirror/autocomplete
npm install @fontsource/jetbrains-mono
```

Setup:
- `StreamLanguage.define()` with CM5 Verilog mode from `@codemirror/legacy-modes/mode/verilog`
- Theme: `oneDark` as base, customized with CSS tokens
- Font: JetBrains Mono, 14px
- Extensions: line numbers, bracket matching, active line highlight, search (Ctrl+F), code folding
- `onChange` callback wired to `useParser` hook
- `highlightSignal(name)` imperative method: highlight all occurrences when user clicks a wire

## App Layout with Split Panes

**File**: `src/App.tsx`

```tsx
<PanelGroup direction="horizontal">
  <Panel defaultSize={40} minSize={20}>
    <div className="editor-panel">
      <Toolbar />
      <Editor />
    </div>
  </Panel>
  <PanelResizeHandle className="resize-handle" />
  <Panel defaultSize={60} minSize={30}>
    <DiagramCanvas />
  </Panel>
</PanelGroup>
```

## Toolbar

**File**: `src/components/Toolbar.tsx`

- **Example selector**: `<select>` dropdown listing example files from `public/examples/`
- **Parse indicator**: green dot on success, red on errors
- **Theme toggle**: dark/light switch (localStorage)
- Future placeholders: "Synthesize" button (Phase 4), "Simulate" button (Phase 5)

## StatusBar

**File**: `src/components/StatusBar.tsx`

Bottom bar showing:
- Parse status: "Parsed 3 modules, 5 instances" or "Parse error at line 12"
- Module count and instance count

## Cross-Panel Signal Highlighting

When user clicks a wire in diagram:
1. Wire edge highlights with accent color + thicker stroke
2. Signal name passed to `Editor.highlightSignal(name)`
3. Editor scrolls to and highlights the signal declaration/usage

Shared `selectedSignal` state in App, passed to both Editor and DiagramCanvas.

## Global Styles

**File**: `src/index.css`

- Import `@fontsource/jetbrains-mono`
- Apply theme tokens from `tokens.css`
- Style resize handle, panels, scrollbars

## Success Criteria

- `npx tsc --noEmit` — no TypeScript errors
- `npm run build` — builds successfully
- Editor shows Verilog syntax highlighting
- Example dropdown loads files into editor, diagram updates
- Split pane resizing works smoothly
- Theme toggle switches dark/light
- Clicking wire highlights signal in editor
- StatusBar shows parse results
- JetBrains Mono font in editor
