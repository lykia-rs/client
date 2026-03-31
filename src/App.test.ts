import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import App from '@/App.vue'
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import QueryPanel from '@/components/QueryPanel.vue'
import ConnectionDialog from '@/components/ConnectionDialog.vue'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

const stubs = {
  Splitpanes: { template: '<div class="splitpanes"><slot /></div>' },
  Pane: { template: '<div class="pane"><slot /></div>' },
}

function mountApp() {
  return mount(App, { global: { stubs } })
}

async function addSecondConnection(wrapper: ReturnType<typeof mountApp>) {
  const cp = wrapper.findComponent(ConnectionPanel)
  await cp.vm.$emit('add')
  await wrapper.vm.$nextTick()
  const dialog = wrapper.findComponent(ConnectionDialog)
  await dialog.props('connectHandler')('newhost', '9999')
  await flushPromises()
}

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main application structure', () => {
    const wrapper = mountApp()
    expect(wrapper.find('.splitpanes').exists()).toBe(true)
    expect(wrapper.findComponent(ConnectionPanel).exists()).toBe(true)
    expect(wrapper.findComponent(QueryPanel).exists()).toBe(true)
  })

  it('initializes with one default connection', () => {
    const wrapper = mountApp()
    const connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections).toHaveLength(1)
    expect(connections[0]).toMatchObject({
      name: 'localhost',
      address: 'localhost:19191',
      host: 'localhost',
      port: '19191',
    })
  })

  it('tests initial connection on mount', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    mountApp()
    await flushPromises()
    expect(invoke).toHaveBeenCalledWith('test_connection', { address: 'localhost:19191' })
  })

  it('marks connection as connected when test succeeds', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const wrapper = mountApp()
    await flushPromises()
    expect(wrapper.findComponent(ConnectionPanel).props('connections')[0].connected).toBe(true)
  })

  it('marks connection as disconnected when test fails', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Connection failed'))
    const wrapper = mountApp()
    await flushPromises()
    expect(wrapper.findComponent(ConnectionPanel).props('connections')[0].connected).toBe(false)
  })

  it('selects connection when ConnectionPanel emits select event', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const wrapper = mountApp()
    await addSecondConnection(wrapper)

    const cp = wrapper.findComponent(ConnectionPanel)
    let connections = cp.props('connections')
    await cp.vm.$emit('select', connections[0])
    await wrapper.vm.$nextTick()

    connections = wrapper.findComponent(ConnectionPanel).props('connections')
    expect(connections[0].active).toBe(true)
    expect(connections[1].active).toBe(false)
  })

  it('shows connection dialog when add button is clicked', async () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent(ConnectionDialog).exists()).toBe(false)
    await wrapper.findComponent(ConnectionPanel).vm.$emit('add')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ConnectionDialog).exists()).toBe(true)
  })

  it('adds new connection when dialog emits connect with valid data', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const wrapper = mountApp()
    await addSecondConnection(wrapper)

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
    const wrapper = mountApp()

    const cp = wrapper.findComponent(ConnectionPanel)
    await cp.vm.$emit('add')
    await wrapper.vm.$nextTick()

    const dialog = wrapper.findComponent(ConnectionDialog)
    await expect(dialog.props('connectHandler')('badhost', '9999')).rejects.toThrow()

    expect(cp.props('connections')).toHaveLength(1)
  })

  it('removes connection when remove event is emitted', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const wrapper = mountApp()
    await addSecondConnection(wrapper)

    const cp = wrapper.findComponent(ConnectionPanel)
    let connections = cp.props('connections')
    expect(connections).toHaveLength(2)

    await cp.vm.$emit('remove', connections[1].id)
    await wrapper.vm.$nextTick()

    connections = cp.props('connections')
    expect(connections).toHaveLength(1)
  })

  it('does not remove connection if it is the last one', async () => {
    const wrapper = mountApp()
    const cp = wrapper.findComponent(ConnectionPanel)
    const connections = cp.props('connections')
    await cp.vm.$emit('remove', connections[0].id)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ConnectionPanel).props('connections')).toHaveLength(1)
  })

  it('switches active connection when removing currently active connection', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const wrapper = mountApp()
    await addSecondConnection(wrapper)

    const cp = wrapper.findComponent(ConnectionPanel)
    let connections = cp.props('connections')
    const newConnId = connections[1].id
    expect(connections[1].active).toBe(true)

    await cp.vm.$emit('remove', newConnId)
    await wrapper.vm.$nextTick()

    connections = cp.props('connections')
    expect(connections[0].active).toBe(true)
  })

  it('assigns different colors to new connections', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined)
    const wrapper = mountApp()
    const cp = wrapper.findComponent(ConnectionPanel)

    await cp.vm.$emit('add')
    await wrapper.vm.$nextTick()
    await wrapper.findComponent(ConnectionDialog).props('connectHandler')('host1', '9991')
    await flushPromises()

    await cp.vm.$emit('add')
    await wrapper.vm.$nextTick()
    await wrapper.findComponent(ConnectionDialog).props('connectHandler')('host2', '9992')
    await flushPromises()

    const connections = cp.props('connections')
    expect(connections[0].color).not.toBe(connections[1].color)
    expect(connections[1].color).not.toBe(connections[2].color)
  })

  it('passes active connection to QueryPanel', () => {
    const wrapper = mountApp()
    const cp = wrapper.findComponent(ConnectionPanel)
    const qp = wrapper.findComponent(QueryPanel)
    const activeConn = cp.props('connections').find((c: any) => c.active)
    expect(qp.props('connection')).toEqual(activeConn)
  })
})
