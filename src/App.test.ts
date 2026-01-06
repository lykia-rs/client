import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import App from '@/App.vue'
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import QueryPanel from '@/components/QueryPanel.vue'
import ConnectionDialog from '@/components/ConnectionDialog.vue'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main application structure', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div class="splitpanes"><slot /></div>' },
          Pane: { template: '<div class="pane"><slot /></div>' },
        },
      },
    })

    expect(wrapper.find('.splitpanes').exists()).toBe(true)
    expect(wrapper.findComponent(ConnectionPanel).exists()).toBe(true)
    expect(wrapper.findComponent(QueryPanel).exists()).toBe(true)
  })

  it('initializes with one default connection', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    expect(connectionPanel.props('connections')).toHaveLength(1)
    expect(connectionPanel.props('connections')[0]).toMatchObject({
      name: 'localhost',
      address: 'localhost:19191',
      host: 'localhost',
      port: '19191',
    })
  })

  it('tests initial connection on mount', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)

    mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    await flushPromises()

    expect(invoke).toHaveBeenCalledWith('test_connection', {
      address: 'localhost:19191',
    })
  })

  it('marks connection as connected when test succeeds', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    await flushPromises()

    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    expect(connectionPanel.props('connections')[0].connected).toBe(true)
  })

  it('marks connection as disconnected when test fails', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Connection failed'))

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    await flushPromises()

    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    expect(connectionPanel.props('connections')[0].connected).toBe(false)
  })

  it('selects connection when ConnectionPanel emits select event', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    
    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    // Add a second connection first
    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()

    const dialog = wrapper.findComponent(ConnectionDialog)
    await dialog.props('connectHandler')('newhost', '9999')
    await flushPromises()

    let connections = wrapper.findComponent(ConnectionPanel).props('connections')
    
    // Now select the first connection
    await connectionPanel.vm.$emit('select', connections[0])
    await wrapper.vm.$nextTick()

    connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections[0].active).toBe(true)
    expect(connections[1].active).toBe(false)
  })

  it('shows connection dialog when add button is clicked', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.findComponent(ConnectionDialog).exists()).toBe(false)

    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    await connectionPanel.vm.$emit('add')

    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ConnectionDialog).exists()).toBe(true)
  })

  it('adds new connection when dialog emits connect with valid data', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    // Show dialog
    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()

    // Emit connect event
    const dialog = wrapper.findComponent(ConnectionDialog)
    const onConnect = dialog.props('connectHandler')
    await onConnect('newhost', '9999')

    await flushPromises()

    const connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections).toHaveLength(2)
    expect(connections[1]).toMatchObject({
      name: 'newhost',
      address: 'newhost:9999',
      host: 'newhost',
      port: '9999',
      connected: true,
    })
  })

  it('does not add connection if test fails', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Connection failed'))

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    // Show dialog
    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()

    // Try to connect
    const dialog = wrapper.findComponent(ConnectionDialog)
    const onConnect = dialog.props('connectHandler')
    
    await expect(onConnect('badhost', '9999')).rejects.toThrow()

    const connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections).toHaveLength(1) // Still only the default connection
  })

  it('removes connection when remove event is emitted', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    // Add a second connection
    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()

    const dialog = wrapper.findComponent(ConnectionDialog)
    await dialog.props('connectHandler')('newhost', '9999')
    await flushPromises()

    let connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections).toHaveLength(2)

    // Remove the second connection
    const secondConnId = connections[1].id
    await connectionPanel.vm.$emit('remove', secondConnId)
    await wrapper.vm.$nextTick()

    connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections).toHaveLength(1)
    expect(connections.find((c: any) => c.id === secondConnId)).toBeUndefined()
  })

  it('does not remove connection if it is the last one', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    const connections = connectionPanel.props('connections')
    expect(connections).toHaveLength(1)

    // Try to remove the only connection
    await connectionPanel.vm.$emit('remove', connections[0].id)
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(ConnectionPanel).props('connections')).toHaveLength(1)
  })

  it('switches active connection when removing currently active connection', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    // Add a second connection
    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()

    const dialog = wrapper.findComponent(ConnectionDialog)
    await dialog.props('connectHandler')('newhost', '9999')
    await flushPromises()

    let connections = wrapper.findComponent(ConnectionPanel).props('connections')
    const newConnId = connections[1].id
    
    // The new connection should be active
    expect(connections[1].active).toBe(true)

    // Remove the active connection
    await connectionPanel.vm.$emit('remove', newConnId)
    await wrapper.vm.$nextTick()

    connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections[0].active).toBe(true) // First connection should now be active
  })

  it('assigns different colors to new connections', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)

    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    const connectionPanel = wrapper.findComponent(ConnectionPanel)

    // Add first connection
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()
    let dialog = wrapper.findComponent(ConnectionDialog)
    await dialog.props('connectHandler')('host1', '9991')
    await flushPromises()

    // Add second connection
    await connectionPanel.vm.$emit('add')
    await wrapper.vm.$nextTick()
    dialog = wrapper.findComponent(ConnectionDialog)
    await dialog.props('connectHandler')('host2', '9992')
    await flushPromises()

    const connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections[0].color).not.toBe(connections[1].color)
    expect(connections[1].color).not.toBe(connections[2].color)
  })

  it('passes active connection to QueryPanel', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Splitpanes: { template: '<div><slot /></div>' },
          Pane: { template: '<div><slot /></div>' },
        },
      },
    })

    const connectionPanel = wrapper.findComponent(ConnectionPanel)
    const queryPanel = wrapper.findComponent(QueryPanel)

    const activeConn = connectionPanel.props('connections').find((c: any) => c.active)
    expect(queryPanel.props('connection')).toEqual(activeConn)
  })
})
