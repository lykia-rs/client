<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, keymap, drawSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { lykiaLanguage } from '@/lib/lykia-lang'
import {
  errorHighlighting,
  setErrors as setEditorErrors,
  clearErrors as clearEditorErrors,
  type ErrorMarker,
} from '@/lib/error-highlighting'
import { initWasm, tokenize } from '@/lib/wasm'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  readonly?: boolean
  dimmed?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'parseError', hasErrors: boolean): void
  (e: 'parseErrorMessage', message: string): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
let suppressUpdate = false
let hasLocalErrors = false
let editableCompartment: Compartment | null = null

function applyParseErrors(v: EditorView, content: string) {
  const result = content.trim() ? tokenize(content) : null
  const errors = result?.errors ?? []
  if (errors.length > 0) {
    hasLocalErrors = true
    setEditorErrors(
      v,
      errors.map((e) => ({
        from: e.from,
        to: e.to,
        message: e.message,
        severity: 'error' as const,
      })),
    )
  } else if (hasLocalErrors) {
    clearEditorErrors(v)
    hasLocalErrors = false
  }
  emit('parseError', errors.length > 0)
  emit('parseErrorMessage', errors.length > 0 ? errors[0].message : '')
}

onMounted(async () => {
  await initWasm()
  if (!containerRef.value) return

  editableCompartment = new Compartment()

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      keymap.of([...defaultKeymap, indentWithTab]),
      drawSelection(),
      lykiaLanguage(tokenize),
      errorHighlighting(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          suppressUpdate = true
          emit('update:modelValue', update.state.doc.toString())
          suppressUpdate = false
          applyParseErrors(update.view, update.state.doc.toString())
        }
      }),
      editableCompartment.of([
        EditorState.readOnly.of(!!props.readonly),
        EditorView.editable.of(!props.disabled),
      ]),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': {
          fontFamily:
            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
          fontSize: '0.875rem',
          lineHeight: '1.5rem',
          padding: '6px 8px',
          caretColor: 'transparent',
        },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--cm-cursor-color, #000)' },
        '.cm-gutters': { display: 'none' },
        '.cm-focused': { outline: 'none' },
        '&.cm-editor': { background: 'transparent' },
      }),
    ],
  })

  view = new EditorView({
    state,
    parent: containerRef.value,
  })

  // Check initial content for parse errors
  applyParseErrors(view, props.modelValue)
})

watch([() => props.disabled, () => props.readonly], ([disabled, readonly]) => {
  if (!view || !editableCompartment) return
  view.dispatch({
    effects: editableCompartment.reconfigure([
      EditorState.readOnly.of(!!readonly),
      EditorView.editable.of(!disabled),
    ]),
  })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (suppressUpdate || !view) return
    const current = view.state.doc.toString()
    if (current !== newVal) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: newVal },
      })
    }
  },
)

function showErrors(errors: ErrorMarker[]) {
  if (view) {
    hasLocalErrors = false // External errors override local state
    setEditorErrors(view, errors)
  }
}

function hideErrors() {
  if (view) {
    hasLocalErrors = false
    clearEditorErrors(view)
  }
}

defineExpose({ showErrors, hideErrors })
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900 transition-opacity duration-200 code-editor"
    :class="{
      'opacity-50 cursor-not-allowed': dimmed,
      'cursor-wait': disabled && !dimmed,
    }"
  />
</template>

<style>
:root {
  --cm-cursor-color: #18181b;
  --cm-keyword: #7c3aed;
  --cm-sqlkeyword: #2563eb;
  --cm-string: #16a34a;
  --cm-number: #d97706;
  --cm-symbol: #71717a;
  --cm-identifier: #18181b;
  --cm-variable: #dc2626;
  --cm-base: inherit;
}
.dark {
  --cm-cursor-color: #e4e4e7;
  --cm-keyword: #a78bfa;
  --cm-sqlkeyword: #60a5fa;
  --cm-string: #4ade80;
  --cm-number: #fbbf24;
  --cm-symbol: #a1a1aa;
  --cm-identifier: #e4e4e7;
  --cm-variable: #f87171;
  --cm-base: #e4e4e7;
}
.code-editor .cm-editor {
  height: 100%;
  color: var(--cm-base);
}
.code-editor .cm-keyword {
  color: var(--cm-keyword);
  font-weight: 600;
}
.code-editor .cm-sqlkeyword {
  color: var(--cm-sqlkeyword);
  font-weight: 600;
}
.code-editor .cm-string {
  color: var(--cm-string);
}
.code-editor .cm-number,
.code-editor .cm-boolean {
  color: var(--cm-number);
}
.code-editor .cm-symbol {
  color: var(--cm-symbol);
}
.code-editor .cm-identifier {
  color: var(--cm-identifier);
}
.code-editor .cm-variable {
  color: var(--cm-variable);
}
.code-editor .cm-null {
  color: var(--cm-symbol);
  font-style: italic;
}

.code-editor .cm-error-span,
.code-editor .cm-error-warning,
.code-editor .cm-error-info {
  text-decoration: wavy underline;
  text-underline-offset: 3px;
}
.code-editor .cm-error-span {
  text-decoration-color: #ef4444;
}
.code-editor .cm-error-warning {
  text-decoration-color: #eab308;
}
.code-editor .cm-error-info {
  text-decoration-color: #3b82f6;
}

.dark .code-editor .cm-activeLine {
  background-color: rgba(255, 255, 255, 0.04);
}
.dark .code-editor .cm-selectionBackground,
.dark .code-editor .cm-focused .cm-selectionBackground {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
