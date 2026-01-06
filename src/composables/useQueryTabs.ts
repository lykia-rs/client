import { ref, computed, watch, type Ref } from 'vue'
import type { Connection } from './useConnections'

export interface QueryTab {
  id: string
  name: string
  query: string
  result: any
  error: string
  loading: boolean
  connectionId: string
  duration: number | null
}

export function useQueryTabs(connectionRef: Ref<Connection>) {
  const allTabs = ref<QueryTab[]>([
    { 
      id: '0', 
      name: 'Query 1', 
      query: '', 
      result: null, 
      error: '', 
      loading: false, 
      connectionId: connectionRef.value.id, 
      duration: null 
    }
  ])
  
  const activeTabId = ref('0')

  const tabs = computed(() => allTabs.value.filter(t => t.connectionId === connectionRef.value.id))
  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))

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
      id: String(Date.now()),
      name: `Query ${connTabs.length + 1}`,
      query: '',
      result: null,
      error: '',
      loading: false,
      connectionId: connectionRef.value.id,
      duration: null
    }
    allTabs.value.push(newTab)
    activeTabId.value = newTab.id
  }

  function closeTab(id: string) {
    if (tabs.value.length === 1) return
    
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
    addTab,
    closeTab
  }
}
