import { ref, watch, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export interface TokenInfo {
  tok_type: string
  lexeme: string | null
  start: number
  end: number
  line: number
  line_end: number
}

export interface ErrorInfo {
  message: string
  start: number
  end: number
  line: number
  line_end: number
}

interface TokenizeResult {
  success: boolean
  tokens: TokenInfo[]
  error: ErrorInfo | null
}

export interface HighlightSpan {
  start: number
  end: number
  className: string
  kind: 'token' | 'error'
  message?: string
}

const TOKEN_CLASS_MAP: Record<string, string> = {
  keyword: 'hl-keyword',
  sql_keyword: 'hl-sql-keyword',
  string: 'hl-string',
  number: 'hl-number',
  symbol: 'hl-symbol',
  identifier: 'hl-identifier',
  variable: 'hl-variable',
  eof: '',
}

export function useSyntaxHighlighting(source: Ref<string>) {
  // The stable highlighted HTML shown in the pre layer. Only ever updated
  // when an IPC response arrives for the exact current source text — never on
  // every keystroke. This is what prevents flicker: stale token positions are
  // never applied to a newer source string.
  const highlightedHtml = ref<string>('')
  const scanError = ref<ErrorInfo | null>(null)
  const externalErrors = ref<ErrorInfo[]>([])

  // Last successful token set and the source text they were derived from
  let lastValidTokens: TokenInfo[] = []
  let lastValidSource = ''

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function buildHtml(text: string, tokens: TokenInfo[], err: ErrorInfo | null, extErrors: ErrorInfo[]): string {
    if (!text) return ''

    const spans: HighlightSpan[] = []

    for (const token of tokens) {
      if (token.tok_type === 'eof') continue
      const className = TOKEN_CLASS_MAP[token.tok_type] || ''
      if (className) {
        spans.push({ start: token.start, end: token.end, className, kind: 'token' })
      }
    }

    if (err) {
      spans.push({ start: err.start, end: err.end, className: 'hl-error', kind: 'error', message: err.message })
    }

    for (const e of extErrors) {
      spans.push({ start: e.start, end: e.end, className: 'hl-error', kind: 'error', message: e.message })
    }

    // Trailing newline gives the pre element room for the cursor on the last line
    return renderSpans(text, spans) + '\n'
  }

  async function tokenize(text: string) {
    if (!text.trim()) {
      lastValidTokens = []
      lastValidSource = ''
      scanError.value = null
      highlightedHtml.value = ''
      return
    }

    try {
      const result = await invoke<TokenizeResult>('tokenize_query', { source: text })

      // Discard stale responses — source changed while IPC was in flight
      if (source.value !== text) return

      if (result.success) {
        lastValidTokens = result.tokens
        lastValidSource = text
        scanError.value = null
      } else {
        // On parse error: retain last valid tokens so the highlight stays
        // stable for the valid portion; only the error span changes
        scanError.value = result.error
      }

      // Build HTML for `text` using the token set we have.
      // Because we only reach here when source.value === text, token positions
      // are always applied to their corresponding source — no stale mismatches.
      highlightedHtml.value = buildHtml(text, lastValidTokens, scanError.value, externalErrors.value)
    } catch {
      // IPC error — keep previous highlighted state
    }
  }

  watch(source, (newSource) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => tokenize(newSource), 60)
  }, { immediate: true })

  function setErrors(errors: ErrorInfo[]) {
    externalErrors.value = errors
    highlightedHtml.value = buildHtml(lastValidSource, lastValidTokens, scanError.value, errors)
  }

  function clearErrors() {
    externalErrors.value = []
    highlightedHtml.value = buildHtml(lastValidSource, lastValidTokens, scanError.value, [])
  }

  return {
    highlightedHtml,
    scanError,
    externalErrors,
    setErrors,
    clearErrors,
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Renders text with overlapping highlight spans.
 * Token spans provide syntax coloring; error spans overlay on top.
 */
function renderSpans(text: string, spans: HighlightSpan[]): string {
  if (spans.length === 0) {
    return escapeHtml(text)
  }

  // Build an event list for span boundaries
  interface SpanEvent {
    pos: number
    type: 'open' | 'close'
    span: HighlightSpan
  }

  const events: SpanEvent[] = []

  for (const span of spans) {
    const clampedStart = Math.max(0, Math.min(span.start, text.length))
    const clampedEnd = Math.max(clampedStart, Math.min(span.end, text.length))
    if (clampedStart === clampedEnd) continue

    events.push({ pos: clampedStart, type: 'open', span })
    events.push({ pos: clampedEnd, type: 'close', span })
  }

  // Sort: by position, then opens before closes at same position
  events.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos
    if (a.type !== b.type) return a.type === 'open' ? -1 : 1
    return 0
  })

  const parts: string[] = []
  let cursor = 0
  const activeStack: HighlightSpan[] = []

  for (const event of events) {
    // Emit text up to this event position
    if (event.pos > cursor) {
      const segment = text.slice(cursor, event.pos)
      if (activeStack.length > 0) {
        const classes = getActiveClasses(activeStack)
        parts.push(`<span class="${classes}">${escapeHtml(segment)}</span>`)
      } else {
        parts.push(escapeHtml(segment))
      }
      cursor = event.pos
    }

    if (event.type === 'open') {
      activeStack.push(event.span)
    } else {
      const idx = activeStack.lastIndexOf(event.span)
      if (idx !== -1) activeStack.splice(idx, 1)
    }
  }

  // Remaining text
  if (cursor < text.length) {
    const segment = text.slice(cursor)
    if (activeStack.length > 0) {
      const classes = getActiveClasses(activeStack)
      parts.push(`<span class="${classes}">${escapeHtml(segment)}</span>`)
    } else {
      parts.push(escapeHtml(segment))
    }
  }

  return parts.join('')
}

function getActiveClasses(stack: HighlightSpan[]): string {
  const classes = new Set<string>()
  for (const span of stack) {
    if (span.className) classes.add(span.className)
  }
  return Array.from(classes).join(' ')
}
