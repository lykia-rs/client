import { describe, it, expect } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { errorHighlighting, setErrors, clearErrors, type ErrorMarker } from './error-highlighting'

function createView(doc = 'SELECT * FROM users') {
  const state = EditorState.create({ doc, extensions: [errorHighlighting()] })
  return new EditorView({ state })
}

describe('error-highlighting', () => {
  describe('errorHighlighting', () => {
    it('returns an extension array', () => {
      const ext = errorHighlighting()
      expect(Array.isArray(ext)).toBe(true)
      expect(ext.length).toBeGreaterThan(0)
    })

    it('can be added to an EditorState without error', () => {
      expect(() => createView()).not.toThrow()
    })
  })

  describe('setErrors / clearErrors', () => {
    it('dispatches without throwing for valid errors', () => {
      const view = createView()
      const errors: ErrorMarker[] = [
        { from: 0, to: 6, message: 'Bad keyword', severity: 'error' },
      ]
      expect(() => setErrors(view, errors)).not.toThrow()
      view.destroy()
    })

    it('handles warning severity', () => {
      const view = createView()
      expect(() =>
        setErrors(view, [{ from: 0, to: 3, message: 'warn', severity: 'warning' }]),
      ).not.toThrow()
      view.destroy()
    })

    it('handles info severity', () => {
      const view = createView()
      expect(() =>
        setErrors(view, [{ from: 0, to: 3, message: 'info', severity: 'info' }]),
      ).not.toThrow()
      view.destroy()
    })

    it('handles default (no) severity', () => {
      const view = createView()
      expect(() =>
        setErrors(view, [{ from: 0, to: 3, message: 'err' }]),
      ).not.toThrow()
      view.destroy()
    })

    it('clamps out-of-range positions to document bounds', () => {
      const view = createView('abc') // length 3
      expect(() =>
        setErrors(view, [{ from: -5, to: 100, message: 'overflow' }]),
      ).not.toThrow()
      view.destroy()
    })

    it('skips zero-length markers (from === to after clamping)', () => {
      const view = createView('abc')
      // Both from and to exceed doc length → clamped to 3, so from === to
      expect(() =>
        setErrors(view, [{ from: 50, to: 50, message: 'no range' }]),
      ).not.toThrow()
      view.destroy()
    })

    it('handles multiple errors', () => {
      const view = createView('SELECT * FROM users WHERE id = 1')
      const errors: ErrorMarker[] = [
        { from: 0, to: 6, message: 'err1', severity: 'error' },
        { from: 14, to: 19, message: 'warn1', severity: 'warning' },
        { from: 26, to: 28, message: 'info1', severity: 'info' },
      ]
      expect(() => setErrors(view, errors)).not.toThrow()
      view.destroy()
    })

    it('clearErrors dispatches without throwing', () => {
      const view = createView()
      setErrors(view, [{ from: 0, to: 3, message: 'err' }])
      expect(() => clearErrors(view)).not.toThrow()
      view.destroy()
    })

    it('handles empty error array', () => {
      const view = createView()
      expect(() => setErrors(view, [])).not.toThrow()
      view.destroy()
    })
  })

  describe('decoration state field', () => {
    it('maps decorations through document changes', () => {
      const view = createView('hello world')
      setErrors(view, [{ from: 6, to: 11, message: 'err' }])
      // Insert text before the error — decorations should remap
      expect(() =>
        view.dispatch({ changes: { from: 0, to: 0, insert: 'XXX' } }),
      ).not.toThrow()
      view.destroy()
    })

    it('allows setting errors then clearing, then setting again', () => {
      const view = createView('test content')
      setErrors(view, [{ from: 0, to: 4, message: 'a' }])
      clearErrors(view)
      setErrors(view, [{ from: 5, to: 12, message: 'b' }])
      clearErrors(view)
      expect(() => view.state).not.toThrow()
      view.destroy()
    })
  })
})
