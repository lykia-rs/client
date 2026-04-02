import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { useQueryExecution } from './useQueryExecution'
import type { QueryTab, QueryResult } from './useQueryTabs'
import type { Connection } from './useConnections'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

const makeTab = (o: Partial<QueryTab> = {}): QueryTab => ({
  id: 'tab1',
  name: 'Query 1',
  query: 'SELECT * FROM users',
  result: null,
  error: '',
  loading: false,
  loadingIndicator: false,
  connectionId: 'conn1',
  duration: null,
  errorSpan: null,
  viewMode: 'table',
  ...o,
})

const makeConn = (o: Partial<Connection> = {}): Connection => ({
  id: 'conn1',
  name: 'Test DB',
  address: 'localhost:19191',
  host: 'localhost',
  port: '19191',
  color: '#4db6ac',
  active: true,
  connected: true,
  ...o,
})

const mockSuccess = (data: QueryResult = [], duration = 10) =>
  vi.mocked(invoke).mockResolvedValue({ success: true, data, duration })
const mockError = (error: string, extra: Record<string, string | number | boolean | { from: number; to: number }> = {}) =>
  vi.mocked(invoke).mockResolvedValue({ success: false, error, duration: 5, ...extra })

describe('useQueryExecution', () => {
  let tab: QueryTab
  let connection: Connection

  beforeEach(() => {
    vi.clearAllMocks()
    connection = makeConn()
    tab = makeTab()
  })

  it('executes query successfully', async () => {
    mockSuccess([{ id: 1, name: 'Alice' }], 42)
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)

    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'localhost:19191',
      query: 'SELECT * FROM users',
    })
    expect(tab.result).toEqual([{ id: 1, name: 'Alice' }])
    expect(tab.duration).toBe(42)
    expect(tab.error).toBe('')
    expect(tab.loading).toBe(false)
  })

  it('sets loading to true during execution', async () => {
    vi.mocked(invoke).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 100),
        ),
    )
    const { executeQuery } = useQueryExecution()
    const promise = executeQuery(tab, connection)
    await flushPromises()
    expect(tab.loading).toBe(true)
    await promise
    expect(tab.loading).toBe(false)
  })

  it('keeps previous results and clears error when executing', async () => {
    tab.result = [{ id: 999 }]
    tab.error = 'Old error'
    tab.duration = 999

    vi.mocked(invoke).mockImplementation(() => new Promise(() => {}))
    const { executeQuery } = useQueryExecution()
    executeQuery(tab, connection)
    await flushPromises()

    expect(tab.result).toEqual([{ id: 999 }])
    expect(tab.error).toBe('')
    expect(tab.duration).toBe(null)
  })

  it('handles query errors from response', async () => {
    mockError('Syntax error in query')
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)

    expect(tab.error).toBe('Syntax error in query')
    expect(tab.result).toBe(null)
    expect(tab.duration).toBe(5)
    expect(tab.loading).toBe(false)
  })

  it('handles query errors without error message', async () => {
    vi.mocked(invoke).mockResolvedValue({ success: false, duration: 5 })
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.error).toBe('Query failed')
    expect(tab.result).toBe(null)
  })

  it('handles invoke exceptions', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Network error'))
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)

    expect(tab.error).toBe('Error: Network error')
    expect(tab.result).toBe(null)
    expect(tab.loading).toBe(false)
  })

  it('handles non-Error exceptions', async () => {
    vi.mocked(invoke).mockRejectedValue('String error')
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.error).toBe('String error')
  })

  it.each([
    ['tab is null', () => [null as unknown as QueryTab, 'SELECT 1']],
    ['query is empty', () => [makeTab({ query: '' }), '']],
    ['query is only whitespace', () => [makeTab({ query: '   \n\t  ' }), '']],
  ])('does not execute if %s', async (_, getArgs) => {
    const [tabArg] = getArgs() as [QueryTab, string]
    const { executeQuery } = useQueryExecution()
    await executeQuery(tabArg, connection)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('trims query before checking if empty', async () => {
    tab.query = '  SELECT 1  '
    mockSuccess()
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'localhost:19191',
      query: '  SELECT 1  ',
    })
  })

  it('uses correct connection address', async () => {
    connection.address = 'custom.host:9999'
    mockSuccess()
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'custom.host:9999',
      query: tab.query,
    })
  })

  it('preserves query content after execution', async () => {
    mockSuccess()
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.query).toBe('SELECT * FROM users')
  })

  it('handles multiple concurrent executions on different tabs', async () => {
    const tab1 = makeTab({ id: 'tab1', query: 'SELECT 1' })
    const tab2 = makeTab({ id: 'tab2', query: 'SELECT 2' })

    vi.mocked(invoke)
      .mockResolvedValueOnce({ success: true, data: [{ result: 1 }], duration: 10 })
      .mockResolvedValueOnce({ success: true, data: [{ result: 2 }], duration: 20 })

    const { executeQuery } = useQueryExecution()
    await Promise.all([executeQuery(tab1, connection), executeQuery(tab2, connection)])

    expect(tab1.result).toEqual([{ result: 1 }])
    expect(tab1.duration).toBe(10)
    expect(tab2.result).toEqual([{ result: 2 }])
    expect(tab2.duration).toBe(20)
  })

  it.each([
    ['successful query', { success: true, data: [], duration: 123 }, 123],
    ['failed query', { success: false, error: 'Failed', duration: 456 }, 456],
  ])('stores duration from %s', async (_, response, expected) => {
    vi.mocked(invoke).mockResolvedValue(response)
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.duration).toBe(expected)
  })

  it('handles missing duration in response', async () => {
    vi.mocked(invoke).mockResolvedValue({ success: true, data: [] })
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.duration).toBeUndefined()
  })

  it('can be called multiple times on same tab', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce({ success: true, data: [{ id: 1 }], duration: 10 })
      .mockResolvedValueOnce({ success: true, data: [{ id: 2 }], duration: 20 })

    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.result).toEqual([{ id: 1 }])
    await executeQuery(tab, connection)
    expect(tab.result).toEqual([{ id: 2 }])
  })

  it('handles regular object data without parsing', async () => {
    const data = [{ id: 1, name: 'Test' }]
    mockSuccess(data)
    const { executeQuery } = useQueryExecution()
    await executeQuery(tab, connection)
    expect(tab.result).toEqual(data)
  })

  describe('loadingIndicator', () => {
    it('does not show loadingIndicator immediately', async () => {
      vi.useFakeTimers()
      vi.mocked(invoke).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 5000),
          ),
      )
      const { executeQuery } = useQueryExecution()
      const promise = executeQuery(tab, connection)
      await vi.advanceTimersByTimeAsync(0)

      expect(tab.loading).toBe(true)
      expect(tab.loadingIndicator).toBe(false)

      vi.advanceTimersByTime(5000)
      await vi.advanceTimersByTimeAsync(0)
      await promise
      vi.useRealTimers()
    })

    it('shows loadingIndicator after 500ms if still loading', async () => {
      vi.useFakeTimers()
      vi.mocked(invoke).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 5000),
          ),
      )
      const { executeQuery } = useQueryExecution()
      const promise = executeQuery(tab, connection)

      await vi.advanceTimersByTimeAsync(499)
      expect(tab.loadingIndicator).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(tab.loadingIndicator).toBe(true)

      vi.advanceTimersByTime(5000)
      await vi.advanceTimersByTimeAsync(0)
      await promise
      vi.useRealTimers()
    })

    it('resets loadingIndicator after execution completes', async () => {
      vi.useFakeTimers()
      vi.mocked(invoke).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 1000),
          ),
      )
      const { executeQuery } = useQueryExecution()
      const promise = executeQuery(tab, connection)

      await vi.advanceTimersByTimeAsync(600)
      expect(tab.loadingIndicator).toBe(true)
      await vi.advanceTimersByTimeAsync(500)
      await promise

      expect(tab.loading).toBe(false)
      expect(tab.loadingIndicator).toBe(false)
      vi.useRealTimers()
    })

    it('does not set loadingIndicator if query completes before 500ms', async () => {
      vi.useFakeTimers()
      vi.mocked(invoke).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 200),
          ),
      )
      const { executeQuery } = useQueryExecution()
      const promise = executeQuery(tab, connection)

      await vi.advanceTimersByTimeAsync(200)
      await promise
      expect(tab.loadingIndicator).toBe(false)
      vi.useRealTimers()
    })

    it('resets loadingIndicator on error', async () => {
      vi.useFakeTimers()
      vi.mocked(invoke).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('fail')), 1000)),
      )
      const { executeQuery } = useQueryExecution()
      const promise = executeQuery(tab, connection)

      await vi.advanceTimersByTimeAsync(600)
      expect(tab.loadingIndicator).toBe(true)
      await vi.advanceTimersByTimeAsync(500)
      await promise

      expect(tab.loadingIndicator).toBe(false)
      vi.useRealTimers()
    })

    it('handles concurrent timers for different tabs', async () => {
      vi.useFakeTimers()
      const tab2 = makeTab({ id: 'tab2', query: 'SELECT 2' })

      vi.mocked(invoke)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ success: true, data: [{ r: 1 }], duration: 10 }), 1000),
            ),
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ success: true, data: [{ r: 2 }], duration: 20 }), 300),
            ),
        )

      const { executeQuery } = useQueryExecution()
      const p1 = executeQuery(tab, connection)
      const p2 = executeQuery(tab2, connection)

      await vi.advanceTimersByTimeAsync(300)
      await p2
      expect(tab2.loadingIndicator).toBe(false)
      expect(tab.loadingIndicator).toBe(false)

      await vi.advanceTimersByTimeAsync(200)
      expect(tab.loadingIndicator).toBe(true)

      await vi.advanceTimersByTimeAsync(600)
      await p1
      expect(tab.loadingIndicator).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('error_span handling', () => {
    it('sets errorSpan from response', async () => {
      mockError('Syntax error near SELECT', { error_span: { from: 0, to: 6 } })
      const { executeQuery } = useQueryExecution()
      await executeQuery(tab, connection)
      expect(tab.errorSpan).toEqual({ from: 0, to: 6 })
      expect(tab.error).toBe('Syntax error near SELECT')
    })

    it.each([
      [
        'error without error_span',
        async (t: QueryTab, c: Connection) => {
          mockError('Some error')
          const { executeQuery } = useQueryExecution()
          await executeQuery(t, c)
        },
      ],
      [
        'successful execution',
        async (t: QueryTab, c: Connection) => {
          t.errorSpan = { from: 0, to: 5 }
          mockSuccess()
          const { executeQuery } = useQueryExecution()
          await executeQuery(t, c)
        },
      ],
      [
        'invoke exception',
        async (t: QueryTab, c: Connection) => {
          t.errorSpan = { from: 0, to: 5 }
          vi.mocked(invoke).mockRejectedValue(new Error('Crash'))
          const { executeQuery } = useQueryExecution()
          await executeQuery(t, c)
        },
      ],
    ])('clears errorSpan on %s', async (_, run) => {
      await run(tab, connection)
      expect(tab.errorSpan).toBeNull()
    })
  })
})
