import { invoke } from '@tauri-apps/api/core'
import type { QueryTab } from './useQueryTabs'
import type { Connection } from './useConnections'

export function useQueryExecution() {
  async function executeQuery(tab: QueryTab, connection: Connection) {
    if (!tab || !tab.query.trim()) return
    
    tab.loading = true
    tab.error = ''
    tab.duration = null
    
    try {
      const res = await invoke<any>('execute_query', {
        address: connection.address,
        query: tab.query
      })
      
      tab.duration = res.duration
      
      if (res.success) {
        // TEMPORARY: Parse stringified JSON (this will be fixed in backend soon)
        let parsedData = res.data
        console.log('[DEBUG] Raw data type:', typeof res.data)
        console.log('[DEBUG] Raw data:', res.data)
        
        if (typeof res.data === 'string') {
          try {
            // Try standard JSON parse first
            parsedData = JSON.parse(res.data)
            console.log('[DEBUG] Parsed as valid JSON')
            console.log('[DEBUG] Parsed data:', parsedData)
          } catch (e) {
            // Try to fix JavaScript object notation by adding quotes to keys
            try {
              const jsonString = res.data.trim()
              const fixed = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
              console.log('[DEBUG] Fixed string:', fixed)
              parsedData = JSON.parse(fixed)
              console.log('[DEBUG] Parsed after fixing keys')
              console.log('[DEBUG] Parsed data:', parsedData)
            } catch (e2) {
              // If both fail, keep original data
              console.warn('[TEMPORARY] Could not parse data:', e2)
              parsedData = res.data
            }
          }
        }
        
        console.log('[DEBUG] Final result:', parsedData)
        console.log('[DEBUG] Is array?', Array.isArray(parsedData))
        tab.result = parsedData
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
