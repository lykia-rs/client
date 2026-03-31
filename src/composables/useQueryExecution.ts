import { invoke } from '@tauri-apps/api/core'
import type { QueryTab } from './useQueryTabs'
import type { Connection } from './useConnections'

const loadingTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function useQueryExecution() {
  async function executeQuery(tab: QueryTab, connection: Connection) {
    if (!tab || !tab.query.trim()) return

    tab.loading = true
    tab.loadingIndicator = false
    tab.error = ''
    tab.errorSpan = null
    tab.duration = null

    const timer = setTimeout(() => {
      if (tab.loading) {
        tab.loadingIndicator = true
      }
    }, 500)
    loadingTimers.set(tab.id, timer)

    try {
      const res = await invoke<any>('execute_query', {
        address: connection.address,
        query: tab.query,
      })

      tab.duration = res.duration

      if (res.success) {
        tab.result = res.data
      } else {
        tab.error = res.error || 'Query failed'
        tab.errorSpan = res.error_span ?? null
      }
    } catch (e) {
      tab.error = String(e)
      tab.errorSpan = null
    } finally {
      clearTimeout(loadingTimers.get(tab.id))
      loadingTimers.delete(tab.id)
      tab.loading = false
      tab.loadingIndicator = false
    }
  }

  return {
    executeQuery,
  }
}
