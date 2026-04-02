import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import QueryEditor from '@/components/query/QueryEditor.vue'
import { setErrors, clearErrors } from '@/lib/error-highlighting'
import { flushPromises } from '@/test/utils'

// --- CodeMirror mocks ---

vi.mock('@codemirror/view', () => {
  class EditorView {
    state: { doc: { toString: () => string } }
    dispatch = vi.fn()
    destroy = vi.fn()
    constructor({ state, parent }: { state?: { doc: { toString: () => string } }; parent?: HTMLElement }) {
      this.state = state ?? { doc: { toString: () => '' } }
      if (parent) parent.setAttribute('data-codemirror', 'true')
    }
    static updateListener = { of: vi.fn(() => []) }
    static editable = { of: vi.fn(() => []) }
    static theme = vi.fn(() => [])
  }
  return {
    EditorView,
    keymap: { of: vi.fn(() => []) },
    drawSelection: vi.fn(() => []),
    lineNumbers: vi.fn(() => []),
  }
})

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn().mockReturnValue({ doc: { toString: () => '' } }),
    readOnly: { of: vi.fn(() => []) },
  },
  Compartment: class Compartment {
    of = vi.fn((x: string[]) => x)
    reconfigure = vi.fn((x: string[]) => x)
  },
  StateEffect: { define: vi.fn(() => ({ of: vi.fn() })) },
  StateField: { define: vi.fn(() => ({})) },
  Decoration: {
    none: {},
    mark: vi.fn(() => ({ range: vi.fn() })),
    set: vi.fn(() => ({})),
  },
}))

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  indentWithTab: {},
}))

vi.mock('@/lib/lykia-lang', () => ({
  lykiaLanguage: vi.fn(() => []),
}))

vi.mock('@/lib/error-highlighting', () => ({
  errorHighlighting: vi.fn(() => []),
  setErrors: vi.fn(),
  clearErrors: vi.fn(),
}))

// --- Tests ---

describe('QueryEditor.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return mount(QueryEditor, {
      props: { modelValue: '', ...props },
    })
  }

  it('renders a container div', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('div.code-editor').exists()).toBe(true)
  })

  it('applies opacity class when dimmed', () => {
    const wrapper = createWrapper({ dimmed: true })
    expect(wrapper.find('div').classes()).toContain('opacity-50')
    expect(wrapper.find('div').classes()).toContain('cursor-not-allowed')
  })

  it('applies cursor-wait when disabled but not dimmed', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('div').classes()).toContain('cursor-wait')
    expect(wrapper.find('div').classes()).not.toContain('opacity-50')
    expect(wrapper.find('div').classes()).not.toContain('cursor-not-allowed')
  })

  it('does not apply disabled or dimmed classes when enabled', () => {
    const wrapper = createWrapper({ disabled: false })
    expect(wrapper.find('div').classes()).not.toContain('opacity-50')
    expect(wrapper.find('div').classes()).not.toContain('cursor-wait')
  })

  it('exposes showErrors method', () => {
    const wrapper = createWrapper()
    expect(typeof (wrapper.vm as InstanceType<typeof QueryEditor>).showErrors).toBe('function')
  })

  it('exposes hideErrors method', () => {
    const wrapper = createWrapper()
    expect(typeof (wrapper.vm as InstanceType<typeof QueryEditor>).hideErrors).toBe('function')
  })

  it('calls setErrors when showErrors is invoked with a view', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const errors = [{ from: 0, to: 5, message: 'Test error', severity: 'error' as const }]
    ;(wrapper.vm as InstanceType<typeof QueryEditor>).showErrors(errors)
    expect(setErrors).toHaveBeenCalledWith(expect.anything(), errors)
  })

  it('calls clearErrors when hideErrors is invoked', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    ;(wrapper.vm as InstanceType<typeof QueryEditor>).hideErrors()
    expect(clearErrors).toHaveBeenCalled()
  })

  it('destroys the editor on unmount', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('accepts lineNumbers prop', () => {
    const wrapper = createWrapper({ lineNumbers: true })
    expect(wrapper.find('div.code-editor').exists()).toBe(true)
  })

  it('accepts lineNumbers false prop', () => {
    const wrapper = createWrapper({ lineNumbers: false })
    expect(wrapper.find('div.code-editor').exists()).toBe(true)
  })
})
