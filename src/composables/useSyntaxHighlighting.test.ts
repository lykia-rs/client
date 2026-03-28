import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core')

// Import after mock setup
import { useSyntaxHighlighting, type ErrorInfo } from '@/composables/useSyntaxHighlighting'

/** Advance past the 60 ms debounce and settle all pending IPC promises. */
async function flushIpc() {
  await vi.runAllTimersAsync()
  await nextTick()
}

describe('useSyntaxHighlighting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty highlighted HTML before IPC responds', () => {
    vi.mocked(invoke).mockResolvedValue({ success: true, tokens: [], error: null })
    const source = ref('SELECT * FROM users')
    const { highlightedHtml } = useSyntaxHighlighting(source)
    expect(highlightedHtml.value).toBe('')
  })

  it('calls tokenize_query after debounce', async () => {
    vi.mocked(invoke).mockResolvedValue({ success: true, tokens: [], error: null })
    const source = ref('SELECT * FROM users')
    useSyntaxHighlighting(source)

    expect(invoke).not.toHaveBeenCalled()

    await flushIpc()

    expect(invoke).toHaveBeenCalledWith('tokenize_query', { source: 'SELECT * FROM users' })
  })

  it('highlights using token data from IPC', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [
        { tok_type: 'sql_keyword', lexeme: 'SELECT', start: 0, end: 6, line: 0, line_end: 0 },
        { tok_type: 'identifier', lexeme: 'users', start: 7, end: 12, line: 0, line_end: 0 },
      ],
      error: null,
    })

    const source = ref('SELECT users')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value).toContain('hl-sql-keyword')
    expect(highlightedHtml.value).toContain('SELECT')
    expect(highlightedHtml.value).toContain('hl-identifier')
    expect(highlightedHtml.value).toContain('users')
  })

  it('renders empty HTML and skips IPC for empty source', async () => {
    const source = ref('')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value).toBe('')
    expect(invoke).not.toHaveBeenCalled()
  })

  it('renders empty HTML and skips IPC for whitespace-only source', async () => {
    const source = ref('   ')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value).toBe('')
    expect(invoke).not.toHaveBeenCalled()
  })

  it('retains last valid tokens when IPC returns a parse error', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce({
        success: true,
        tokens: [{ tok_type: 'sql_keyword', lexeme: 'SELECT', start: 0, end: 6, line: 0, line_end: 0 }],
        error: null,
      })
      .mockResolvedValueOnce({
        success: false,
        tokens: [],
        error: { message: 'Unexpected character', start: 7, end: 8, line: 0, line_end: 0 },
      })

    const source = ref('SELECT')
    const { highlightedHtml, scanError } = useSyntaxHighlighting(source)

    await flushIpc()
    expect(highlightedHtml.value).toContain('hl-sql-keyword')
    expect(scanError.value).toBeNull()

    source.value = 'SELECT @'
    await flushIpc()

    expect(scanError.value?.message).toBe('Unexpected character')
    // Retained SELECT highlight from last valid IPC response
    expect(highlightedHtml.value).toContain('hl-sql-keyword')
    // Error span also rendered
    expect(highlightedHtml.value).toContain('hl-error')
  })

  it('applies external errors via setErrors', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [{ tok_type: 'identifier', lexeme: 'hello', start: 0, end: 5, line: 0, line_end: 0 }],
      error: null,
    })

    const source = ref('hello')
    const { highlightedHtml, setErrors, externalErrors } = useSyntaxHighlighting(source)

    await flushIpc()

    const errors: ErrorInfo[] = [
      { message: 'Undefined variable', start: 0, end: 5, line: 0, line_end: 0 },
    ]
    setErrors(errors)

    expect(externalErrors.value).toHaveLength(1)
    expect(highlightedHtml.value).toContain('hl-error')
    expect(highlightedHtml.value).toContain('hl-identifier')
  })

  it('removes external errors via clearErrors', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [{ tok_type: 'identifier', lexeme: 'hello', start: 0, end: 5, line: 0, line_end: 0 }],
      error: null,
    })

    const source = ref('hello')
    const { highlightedHtml, setErrors, clearErrors, externalErrors } = useSyntaxHighlighting(source)

    await flushIpc()

    setErrors([{ message: 'error', start: 0, end: 5, line: 0, line_end: 0 }])
    expect(externalErrors.value).toHaveLength(1)
    expect(highlightedHtml.value).toContain('hl-error')

    clearErrors()
    expect(externalErrors.value).toHaveLength(0)
    expect(highlightedHtml.value).not.toContain('hl-error')
    expect(highlightedHtml.value).toContain('hl-identifier')
  })

  it('escapes HTML special characters in source text', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [{ tok_type: 'string', lexeme: '"<b>"', start: 0, end: 5, line: 0, line_end: 0 }],
      error: null,
    })

    const source = ref('"<b>"')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value).not.toContain('<b>')
    expect(highlightedHtml.value).toContain('&lt;b&gt;')
  })

  it('debounces rapid source changes and calls IPC once for the final value', async () => {
    vi.mocked(invoke).mockResolvedValue({ success: true, tokens: [], error: null })

    const source = ref('S')
    useSyntaxHighlighting(source)

    source.value = 'SE'
    source.value = 'SEL'
    source.value = 'SELE'
    source.value = 'SELECT'

    await flushIpc()

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith('tokenize_query', { source: 'SELECT' })
  })

  it('highlights all supported token types', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [
        { tok_type: 'keyword',     lexeme: 'var',  start: 0,  end: 3,  line: 0, line_end: 0 },
        { tok_type: 'identifier',  lexeme: 'x',    start: 4,  end: 5,  line: 0, line_end: 0 },
        { tok_type: 'symbol',      lexeme: '=',    start: 6,  end: 7,  line: 0, line_end: 0 },
        { tok_type: 'number',      lexeme: '42',   start: 8,  end: 10, line: 0, line_end: 0 },
        { tok_type: 'symbol',      lexeme: ';',    start: 10, end: 11, line: 0, line_end: 0 },
      ],
      error: null,
    })

    const source = ref('var x = 42;')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value).toContain('hl-keyword')
    expect(highlightedHtml.value).toContain('hl-identifier')
    expect(highlightedHtml.value).toContain('hl-symbol')
    expect(highlightedHtml.value).toContain('hl-number')
  })

  it('highlights variable tokens', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [{ tok_type: 'variable', lexeme: '$count', start: 0, end: 6, line: 0, line_end: 0 }],
      error: null,
    })

    const source = ref('$count')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value).toContain('hl-variable')
    expect(highlightedHtml.value).toContain('$count')
  })

  it('appends trailing newline to highlighted output', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      tokens: [{ tok_type: 'identifier', lexeme: 'x', start: 0, end: 1, line: 0, line_end: 0 }],
      error: null,
    })

    const source = ref('x')
    const { highlightedHtml } = useSyntaxHighlighting(source)

    await flushIpc()

    expect(highlightedHtml.value.endsWith('\n')).toBe(true)
  })
})
