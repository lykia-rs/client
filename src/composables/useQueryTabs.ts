import { ref, computed, watch, type Ref } from 'vue'
import type { Connection } from './useConnections'

export interface QueryTab {
  id: string
  name: string
  query: string
  result: any
  error: string
  errorSpan: { from: number; to: number } | null
  loading: boolean
  connectionId: string
  duration: number | null
}

// Shared state for all tabs across all connections
const allTabs = ref<QueryTab[]>([])
let tabIdCounter = 1

export function useQueryTabs(connectionRef: Ref<Connection>) {
  // Initialize first tab if needed
  if (allTabs.value.length === 0) {
    allTabs.value.push({ 
      id: '0', 
      name: 'Query 1', 
      query: '', 
      result: null, 
      error: '', 
      errorSpan: null,
      loading: false, 
      connectionId: connectionRef.value.id, 
      duration: null 
    })
  }
  
  const activeTabId = ref('0')

  const tabs = computed(() => allTabs.value.filter(t => t.connectionId === connectionRef.value.id))
  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))
  const hasRunningQueries = computed(() => tabs.value.some(t => t.loading))

  watch(() => connectionRef.value.id, () => {
    const firstTab = tabs.value[0]
    if (firstTab) {
      activeTabId.value = firstTab.id
    } else {
      addTab()
    }
  })

  function addTab() {
    const connTabs = tabs.value
    const newTab: QueryTab = {
      id: `${Date.now()}-${tabIdCounter++}`,
      name: `Query ${connTabs.length + 1}`,
      query: '',
      result: null,
      error: '',
      errorSpan: null,
      loading: false,
      connectionId: connectionRef.value.id,
      duration: null
    }
    allTabs.value.push(newTab)
    activeTabId.value = newTab.id
  }

  function closeTab(id: string) {
    if (tabs.value.length === 1) return
    
    const tabToClose = allTabs.value.find(t => t.id === id)
    // Prevent closing tabs that are currently executing a query
    if (tabToClose?.loading) return
    
    const index = allTabs.value.findIndex(t => t.id === id)
    allTabs.value.splice(index, 1)
    
    if (activeTabId.value === id) {
      const connTabs = tabs.value
      activeTabId.value = connTabs[Math.max(0, Math.min(index, connTabs.length - 1))]?.id || connTabs[0]?.id
    }
  }

  return {
    tabs,
    activeTab,
    activeTabId,
    hasRunningQueries,
    addTab,
    closeTab
  }
}

// Helper function to check if a connection has running queries
export function hasRunningQueriesForConnection(connectionId: string): boolean {
  return allTabs.value.some(t => t.connectionId === connectionId && t.loading)
}

// Helper function to reset state (for testing)
export function resetQueryTabsState() {
  allTabs.value = []
  tabIdCounter = 1
}
