import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { useQueryExecution } from './useQueryExecution'
import type { QueryTab } from './useQueryTabs'
import type { Connection } from './useConnections'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

describe('useQueryExecution', () => {
  let tab: QueryTab
  let connection: Connection

  beforeEach(() => {
    vi.clearAllMocks()

    connection = {
      id: 'conn1',
      name: 'Test DB',
      address: 'localhost:19191',
      host: 'localhost',
      port: '19191',
      color: '#4db6ac',
      active: true,
      connected: true,
    }

    tab = {
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
    }
  })

  it('executes query successfully', async () => {
    const mockResult = {
      success: true,
      data: [{ id: 1, name: 'Alice' }],
      duration: 42,
    }
    vi.mocked(invoke).mockResolvedValue(mockResult)

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
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 100))
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

    vi.mocked(invoke).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { executeQuery } = useQueryExecution()

    executeQuery(tab, connection)

    await flushPromises()

    expect(tab.result).toEqual([{ id: 999 }]) // Result is kept
    expect(tab.error).toBe('')
    expect(tab.duration).toBe(null)
  })

  it('handles query errors from response', async () => {
    const mockResult = {
      success: false,
      error: 'Syntax error in query',
      duration: 5,
    }
    vi.mocked(invoke).mockResolvedValue(mockResult)

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(tab.error).toBe('Syntax error in query')
    expect(tab.result).toBe(null)
    expect(tab.duration).toBe(5)
    expect(tab.loading).toBe(false)
  })

  it('handles query errors without error message', async () => {
    const mockResult = {
      success: false,
      duration: 5,
    }
    vi.mocked(invoke).mockResolvedValue(mockResult)

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

  it('does not execute if tab is null', async () => {
    const { executeQuery } = useQueryExecution()

    await executeQuery(null as any, connection)

    expect(invoke).not.toHaveBeenCalled()
  })

  it('does not execute if query is empty', async () => {
    tab.query = ''

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(invoke).not.toHaveBeenCalled()
  })

  it('does not execute if query is only whitespace', async () => {
    tab.query = '   \n\t  '

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(invoke).not.toHaveBeenCalled()
  })

  it('trims query before checking if empty', async () => {
    tab.query = '  SELECT 1  '

    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
      duration: 10,
    })

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'localhost:19191',
      query: '  SELECT 1  ', // Original query is sent as-is
    })
  })

  it('uses correct connection address', async () => {
    connection.address = 'custom.host:9999'

    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
      duration: 10,
    })

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(invoke).toHaveBeenCalledWith('execute_query', {
      address: 'custom.host:9999',
      query: tab.query,
    })
  })

  it('preserves query content after execution', async () => {
    const originalQuery = 'SELECT * FROM users'
    tab.query = originalQuery

    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
      duration: 10,
    })

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(tab.query).toBe(originalQuery)
  })

  it('handles multiple concurrent executions on different tabs', async () => {
    const tab1 = { ...tab, id: 'tab1', query: 'SELECT 1' }
    const tab2 = { ...tab, id: 'tab2', query: 'SELECT 2' }

    vi.mocked(invoke)
      .mockResolvedValueOnce({ success: true, data: [{ result: 1 }], duration: 10 })
      .mockResolvedValueOnce({ success: true, data: [{ result: 2 }], duration: 20 })

    const { executeQuery } = useQueryExecution()

    await Promise.all([
      executeQuery(tab1, connection),
      executeQuery(tab2, connection),
    ])

    expect(tab1.result).toEqual([{ result: 1 }])
    expect(tab1.duration).toBe(10)
    expect(tab2.result).toEqual([{ result: 2 }])
    expect(tab2.duration).toBe(20)
  })

  it('stores duration from successful query', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
      duration: 123,
    })

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(tab.duration).toBe(123)
  })

  it('stores duration from failed query', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: false,
      error: 'Failed',
      duration: 456,
    })

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(tab.duration).toBe(456)
  })

  it('handles missing duration in response', async () => {
    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: [],
    })

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

    vi.mocked(invoke).mockResolvedValue({
      success: true,
      data: data,
      duration: 10,
    })

    const { executeQuery } = useQueryExecution()

    await executeQuery(tab, connection)

    expect(tab.result).toEqual(data)
  })

  describe('loadingIndicator', () => {
    it('does not show loadingIndicator immediately', async () => {
      vi.useFakeTimers()
      vi.mocked(invoke).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 5000))
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
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 5000))
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
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 1000))
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
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [], duration: 10 }), 200))
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
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('fail')), 1000))
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
      const tab2 = { ...tab, id: 'tab2', query: 'SELECT 2' }

      vi.mocked(invoke)
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [{ r: 1 }], duration: 10 }), 1000)))
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [{ r: 2 }], duration: 20 }), 300)))

      const { executeQuery } = useQueryExecution()

      const p1 = executeQuery(tab, connection)
      const p2 = executeQuery(tab2, connection)

      await vi.advanceTimersByTimeAsync(300)
      await p2

      // tab2 finished before 500ms, should not have loadingIndicator
      expect(tab2.loadingIndicator).toBe(false)
      // tab still running, not yet 500ms
      expect(tab.loadingIndicator).toBe(false)

      await vi.advanceTimersByTimeAsync(200)
      // Now 500ms passed for tab
      expect(tab.loadingIndicator).toBe(true)

      await vi.advanceTimersByTimeAsync(600)
      await p1

      expect(tab.loadingIndicator).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('error_span handling', () => {
    it('sets errorSpan from response', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: false,
        error: 'Syntax error near SELECT',
        error_span: { from: 0, to: 6 },
        duration: 5,
      })

      const { executeQuery } = useQueryExecution()

      await executeQuery(tab, connection)

      expect(tab.errorSpan).toEqual({ from: 0, to: 6 })
      expect(tab.error).toBe('Syntax error near SELECT')
    })

    it('sets errorSpan to null when error_span is missing', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: false,
        error: 'Some error',
        duration: 5,
      })

      const { executeQuery } = useQueryExecution()

      await executeQuery(tab, connection)

      expect(tab.errorSpan).toBeNull()
    })

    it('clears errorSpan on successful execution', async () => {
      tab.errorSpan = { from: 0, to: 5 }

      vi.mocked(invoke).mockResolvedValue({
        success: true,
        data: [],
        duration: 10,
      })

      const { executeQuery } = useQueryExecution()

      await executeQuery(tab, connection)

      expect(tab.errorSpan).toBeNull()
    })

    it('clears errorSpan on invoke exception', async () => {
      tab.errorSpan = { from: 0, to: 5 }

      vi.mocked(invoke).mockRejectedValue(new Error('Crash'))

      const { executeQuery } = useQueryExecution()

      await executeQuery(tab, connection)

      expect(tab.errorSpan).toBeNull()
    })
  })

})
