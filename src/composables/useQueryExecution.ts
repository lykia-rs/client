import { invoke } from '@tauri-apps/api/core'
import type { QueryTab } from './useQueryTabs'
import type { Connection } from './useConnections'

export function useQueryExecution() {
  async function executeQuery(tab: QueryTab, connection: Connection) {
    if (!tab || !tab.query.trim()) return
    
    tab.loading = true
    tab.error = ''
    tab.errorSpan = null
    tab.duration = null
    
    try {
      const res = await invoke<any>('execute_query', {
        address: connection.address,
        query: tab.query
      })
      
      tab.duration = res.duration
      
      if (res.success) {
        // Parse stringified JSON — backend may send data as a string in some cases
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch {
            // Keep original string if it's not valid JSON
          }
        }
        tab.result = data
      } else {
        tab.error = res.error || 'Query failed'
        tab.errorSpan = res.error_span ?? null
      }
    } catch (e) {
      tab.error = String(e)
      tab.errorSpan = null
    } finally {
      tab.loading = false
    }
  }

  return {
    executeQuery
  }
}
