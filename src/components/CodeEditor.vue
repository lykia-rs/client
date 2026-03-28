<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
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
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
let suppressUpdate = false

onMounted(async () => {
  await initWasm()
  if (!containerRef.value) return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      keymap.of([...defaultKeymap, indentWithTab]),
      lykiaLanguage(tokenize),
      errorHighlighting(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          suppressUpdate = true
          emit('update:modelValue', update.state.doc.toString())
          suppressUpdate = false
        }
      }),
      EditorState.readOnly.of(!!props.readonly),
      EditorView.editable.of(!props.disabled),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': {
          fontFamily:
            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
          fontSize: '0.875rem',
          lineHeight: '1.5rem',
          padding: '1rem 0',
        },
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
  if (view) setEditorErrors(view, errors)
}

function hideErrors() {
  if (view) clearEditorErrors(view)
}

defineExpose({ showErrors, hideErrors })
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full flex-1 flex overflow-hidden bg-white dark:bg-zinc-900 transition-opacity duration-200 code-editor"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  />
</template>

<style>
/* CodeMirror base theming */
.code-editor .cm-editor {
  height: 100%;
}

/* Syntax highlighting — Light theme */
.code-editor .cm-keyword {
  color: #7c3aed;
  font-weight: 600;
}

.code-editor .cm-sqlkeyword {
  color: #2563eb;
  font-weight: 600;
}

.code-editor .cm-string {
  color: #16a34a;
}

.code-editor .cm-number {
  color: #d97706;
}

.code-editor .cm-boolean {
  color: #d97706;
}

.code-editor .cm-symbol {
  color: #71717a;
}

.code-editor .cm-identifier {
  color: #18181b;
}

.code-editor .cm-variable {
  color: #dc2626;
}

.code-editor .cm-null {
  color: #71717a;
  font-style: italic;
}

/* Error / warning / info marks */
.code-editor .cm-error {
  text-decoration: wavy underline;
  text-decoration-color: #ef4444;
  text-underline-offset: 3px;
}

.code-editor .cm-warning {
  text-decoration: wavy underline;
  text-decoration-color: #eab308;
  text-underline-offset: 3px;
}

.code-editor .cm-info-mark {
  text-decoration: wavy underline;
  text-decoration-color: #3b82f6;
  text-underline-offset: 3px;
}

/* Dark theme */
.dark .code-editor .cm-keyword {
  color: #a78bfa;
  font-weight: 600;
}

.dark .code-editor .cm-sqlkeyword {
  color: #60a5fa;
  font-weight: 600;
}

.dark .code-editor .cm-string {
  color: #4ade80;
}

.dark .code-editor .cm-number {
  color: #fbbf24;
}

.dark .code-editor .cm-boolean {
  color: #fbbf24;
}

.dark .code-editor .cm-symbol {
  color: #a1a1aa;
}

.dark .code-editor .cm-identifier {
  color: #e4e4e7;
}

.dark .code-editor .cm-variable {
  color: #f87171;
}

.dark .code-editor .cm-null {
  color: #a1a1aa;
  font-style: italic;
}

.dark .code-editor .cm-error {
  text-decoration-color: #ef4444;
}

.dark .code-editor .cm-warning {
  text-decoration-color: #eab308;
}

.dark .code-editor .cm-info-mark {
  text-decoration-color: #3b82f6;
}

/* Dark theme editor background */
.dark .code-editor .cm-editor {
  color: #e4e4e7;
}

.dark .code-editor .cm-cursor {
  border-left-color: #e4e4e7;
}

.dark .code-editor .cm-activeLine {
  background-color: rgba(255, 255, 255, 0.04);
}

.dark .code-editor .cm-selectionBackground,
.dark .code-editor .cm-focused .cm-selectionBackground {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
