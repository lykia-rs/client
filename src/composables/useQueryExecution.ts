import { invoke } from '@tauri-apps/api/core'
import type { QueryTab } from './useQueryTabs'
import type { Connection } from './useConnections'

export function useQueryExecution() {
  async function executeQuery(tab: QueryTab, connection: Connection) {
    if (!tab || !tab.query.trim()) return
    
    tab.loading = true
    tab.error = ''
    tab.result = null
    tab.duration = null
    
    try {
      const res = await invoke<any>('execute_query', {
        address: connection.address,
        query: tab.query
      })
      
      tab.duration = res.duration
      
      if (res.success) {
        tab.result = res.data
      } else {
        tab.error = res.error || 'Query failed'
      }
    } catch (e) {
      tab.error = String(e)
    } finally {
      tab.loading = false
    }
  }

  return {
    executeQuery
  }
}
