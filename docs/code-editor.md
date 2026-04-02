# Code Editor

## Overview

`CodeEditor` wraps CodeMirror 6 with Lykia language support, real-time parse error detection via WASM, and error/warning highlighting.

## Props

| Prop          | Type      | Default | Description              |
|---------------|-----------|---------|--------------------------|
| `modelValue`  | `string`  | —       | Editor content (v-model) |
| `disabled`    | `boolean` | `false` | Disables editing         |
| `readonly`    | `boolean` | `false` | Read-only mode           |
| `placeholder` | `string`  | —       | Placeholder text         |

## Emitted Events

| Event              | Payload              | Description                        |
|--------------------|----------------------|------------------------------------|
| `update:modelValue`| `string`             | Content changed                    |
| `parseError`       | `boolean`            | `true` if parse errors exist       |
| `parseErrorMessage`| `string`             | First error message (or `""`)      |

## Exposed Methods

```typescript
showErrors(errors: ErrorMarker[]): void  // highlight error ranges
hideErrors(): void                       // clear all highlights
```

```typescript
interface ErrorMarker {
  from: number       // character offset
  to: number         // character offset
  message: string
  severity?: 'error' | 'warning' | 'info'
}
```

## WASM Integration

- `initWasm()` called on mount (singleton, loads once).
- On every document change, `tokenize(content)` is called.
- If errors are returned, they're highlighted in the editor and `parseError(true)` is emitted.
- If no errors, previous highlights are cleared and `parseError(false)` is emitted.
- Empty/whitespace-only content skips tokenization.

## Syntax Highlighting

Token types and their CSS classes:

| Token        | CSS Variable         | Light       | Dark        |
|--------------|---------------------|-------------|-------------|
| Keyword      | `--cm-keyword`      | `#7c3aed`   | `#a78bfa`   |
| SqlKeyword   | `--cm-sqlkeyword`   | `#2563eb`   | `#60a5fa`   |
| String       | `--cm-string`       | `#16a34a`   | `#4ade80`   |
| Number       | `--cm-number`       | `#d97706`   | `#fbbf24`   |
| Boolean      | (same as Number)    | `#d97706`   | `#fbbf24`   |
| Identifier   | `--cm-identifier`   | `#18181b`   | `#e4e4e7`   |
| Variable ($) | `--cm-variable`     | `#dc2626`   | `#f87171`   |
| Symbol       | `--cm-symbol`       | `#71717a`   | `#a1a1aa`   |
| Null/Undef   |                     | gray italic | gray italic |

Keywords are **bold**. SqlKeywords are **bold**.

## Error Highlighting

Errors are rendered as wavy underlines on the affected character range:

| Severity  | CSS Class           | Color              |
|-----------|--------------------|--------------------|
| `error`   | `.cm-error-span`   | red (`#ef4444`)    |
| `warning` | `.cm-error-warning`| yellow (`#eab308`) |
| `info`    | `.cm-error-info`   | blue (`#3b82f6`)   |

Error positions are clamped to document bounds. Zero-length markers (from === to) are skipped.

## Editor Behavior

- Supports tab-to-indent (`indentWithTab` keymap).
- Default keymaps from `@codemirror/commands`.
- `disabled` prop: sets `EditorView.editable(false)`, adds `opacity-50 cursor-not-allowed`.
- `readonly` prop: sets `EditorState.readOnly(true)`.
- Editor destroyed on component unmount.
- External `modelValue` changes update the editor content (suppressing round-trip events).

## DOM Selectors

| Element              | Selector             |
|----------------------|----------------------|
| Container            | `.code-editor`       |
| CodeMirror root      | `.cm-editor`         |
| Content area         | `.cm-content`        |
| Error underline      | `.cm-error-span`     |
| Warning underline    | `.cm-error-warning`  |
| Info underline       | `.cm-error-info`     |
