import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, DecorationSet, EditorView } from '@codemirror/view'

export interface ErrorMarker {
  from: number
  to: number
  message: string
  severity?: 'error' | 'warning' | 'info'
}

const setErrorsEffect = StateEffect.define<ErrorMarker[]>()
const clearErrorsEffect = StateEffect.define<null>()

function markClass(severity?: ErrorMarker['severity']) {
  if (severity === 'warning') return 'cm-error-warning'
  if (severity === 'info') return 'cm-error-info'
  return 'cm-error-span'
}

function buildDecorations(errors: ErrorMarker[], docLength: number): DecorationSet {
  const decorations = errors
    .map((e) => {
      const from = Math.max(0, Math.min(e.from, docLength))
      const to = Math.max(from, Math.min(e.to, docLength))
      if (from === to) return null
      return Decoration.mark({ class: markClass(e.severity) }).range(from, to)
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => a.from - b.from)

  return Decoration.set(decorations)
}

const errorDecorationField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorsEffect)) return buildDecorations(effect.value, tr.state.doc.length)
      if (effect.is(clearErrorsEffect)) return Decoration.none
    }
    if (tr.docChanged) return decorations.map(tr.changes)
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

export function errorHighlighting() {
  return [errorDecorationField]
}

export function setErrors(view: EditorView, errors: ErrorMarker[]) {
  view.dispatch({ effects: setErrorsEffect.of(errors) })
}

export function clearErrors(view: EditorView) {
  view.dispatch({ effects: clearErrorsEffect.of(null) })
}
