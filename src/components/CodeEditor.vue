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
  if (!content.trim()) {
    if (hasLocalErrors) clearEditorErrors(v)
    hasLocalErrors = false
    emit('parseError', false)
    emit('parseErrorMessage', '')
    return
  }
  const result = tokenize(content)
  if (!result) return
  if (result.errors.length > 0) {
    hasLocalErrors = true
    const firstError = result.errors[0]
    setEditorErrors(v, result.errors.map(e => ({
      from: e.from, to: e.to, message: e.message, severity: 'error' as const,
    })))
    emit('parseError', true)
    emit('parseErrorMessage', firstError.message)
  } else {
    if (hasLocalErrors) clearEditorErrors(v)
    hasLocalErrors = false
    emit('parseError', false)
    emit('parseErrorMessage', '')
  }
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

watch(
  [() => props.disabled, () => props.readonly],
  ([disabled, readonly]) => {
    if (!view || !editableCompartment) return
    view.dispatch({
      effects: editableCompartment.reconfigure([
        EditorState.readOnly.of(!!readonly),
        EditorView.editable.of(!disabled),
      ]),
    })
  },
)

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
    hasLocalErrors = false  // External errors override local state
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
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  />
</template>

<style>
.code-editor .cm-editor { height: 100%; }
:root { --cm-cursor-color: #18181b; }
.dark { --cm-cursor-color: #e4e4e7; }

/* Syntax highlighting */
.code-editor .cm-keyword { color: #7c3aed; font-weight: 600; }
.code-editor .cm-sqlkeyword { color: #2563eb; font-weight: 600; }
.code-editor .cm-string { color: #16a34a; }
.code-editor .cm-number,
.code-editor .cm-boolean { color: #d97706; }
.code-editor .cm-symbol { color: #71717a; }
.code-editor .cm-identifier { color: #18181b; }
.code-editor .cm-variable { color: #dc2626; }
.code-editor .cm-null { color: #71717a; font-style: italic; }

/* Error marks */
.code-editor .cm-error-span,
.code-editor .cm-error-warning,
.code-editor .cm-error-info { text-decoration: wavy underline; text-underline-offset: 3px; }
.code-editor .cm-error-span { text-decoration-color: #ef4444; }
.code-editor .cm-error-warning { text-decoration-color: #eab308; }
.code-editor .cm-error-info { text-decoration-color: #3b82f6; }

/* Dark theme */
.dark .code-editor .cm-keyword { color: #a78bfa; }
.dark .code-editor .cm-sqlkeyword { color: #60a5fa; }
.dark .code-editor .cm-string { color: #4ade80; }
.dark .code-editor .cm-number,
.dark .code-editor .cm-boolean { color: #fbbf24; }
.dark .code-editor .cm-symbol,
.dark .code-editor .cm-null { color: #a1a1aa; }
.dark .code-editor .cm-identifier { color: #e4e4e7; }
.dark .code-editor .cm-variable { color: #f87171; }
.dark .code-editor .cm-editor { color: #e4e4e7; }
.dark .code-editor .cm-activeLine { background-color: rgba(255, 255, 255, 0.04); }
.dark .code-editor .cm-selectionBackground,
.dark .code-editor .cm-focused .cm-selectionBackground { background-color: rgba(255, 255, 255, 0.1) !important; }
</style>
