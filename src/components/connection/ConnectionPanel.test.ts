import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConnectionPanel from '@/components/connection/ConnectionPanel.vue'
import { Database, X } from 'lucide-vue-next'
import { createMockConnection } from '@/test/utils'

describe('ConnectionPanel.vue', () => {
  const createWrapper = (props = {}) =>
    mount(ConnectionPanel, {
      props: {
        connections: [createMockConnection()],
        hasRunningQueries: () => false,
        ...props,
      },
    })

  const twoConns = () => [createMockConnection({ id: '1' }), createMockConnection({ id: '2' })]

  it('renders the component with header and add button', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('h2').text()).toBe('Connections')
    expect(wrapper.find('button[title="New Connection"]').exists()).toBe(true)
  })

  it('emits add event when add button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('button[title="New Connection"]').trigger('click')
    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('renders all connections', () => {
    const connections = [
      createMockConnection({ id: '1', name: 'DB1', address: 'localhost:9001' }),
      createMockConnection({ id: '2', name: 'DB2', address: 'localhost:9002' }),
      createMockConnection({ id: '3', name: 'DB3', address: 'localhost:9003' }),
    ]
    const wrapper = createWrapper({ connections })

    expect(wrapper.findAll('[data-testid], .group').length).toBeGreaterThanOrEqual(3)
    expect(wrapper.text()).toContain('DB1')
    expect(wrapper.text()).toContain('DB2')
    expect(wrapper.text()).toContain('DB3')
  })

  it('displays connection name and address', () => {
    const wrapper = createWrapper({
      connections: [
        createMockConnection({ name: 'Production DB', address: 'prod.example.com:5432' }),
      ],
    })
    expect(wrapper.text()).toContain('Production DB')
    expect(wrapper.text()).toContain('prod.example.com:5432')
  })

  it('shows connection status indicator', () => {
    const wrapper = createWrapper({
      connections: [
        createMockConnection({ connected: true, color: '#4db6ac' }),
        createMockConnection({ id: '2', connected: false, color: '#ff0000' }),
      ],
    })
    expect(wrapper.findAll('.w-2.h-2.rounded-full')).toHaveLength(2)
  })

  it('highlights active connection', () => {
    const wrapper = createWrapper({
      connections: [
        createMockConnection({ id: '1', active: true }),
        createMockConnection({ id: '2', active: false }),
      ],
    })
    expect(wrapper.findAll('.group')[0].classes()).toContain('bg-zinc-200')
  })

  it('emits select event when connection is clicked', async () => {
    const connection = createMockConnection({ id: '1', name: 'Test DB' })
    const wrapper = createWrapper({ connections: [connection] })
    await wrapper.find('.group').trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')?.[0]).toEqual([connection])
  })

  it('shows remove button on hover for multiple connections', () => {
    const wrapper = createWrapper({ connections: twoConns() })
    const removeButtons = wrapper
      .findAll('button')
      .filter((btn) => btn.html().includes('X') || btn.findComponent(X).exists())
    expect(removeButtons.length).toBeGreaterThan(0)
  })

  it('does not show remove button when only one connection exists', () => {
    const wrapper = createWrapper()
    const removeButtons = wrapper
      .findAll('button')
      .filter((btn) => btn.html().includes('group-hover:opacity-100'))
    expect(removeButtons.length).toBe(0)
  })

  it('emits remove event when remove button is clicked', async () => {
    const wrapper = createWrapper({ connections: twoConns() })
    const groups = wrapper.findAll('.group')
    await groups[1].find('button[class*="group-hover:opacity-100"]').trigger('click')

    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('remove')?.[0]).toEqual(['2'])
  })

  it('prevents remove event from triggering select', async () => {
    const wrapper = createWrapper({ connections: twoConns() })
    await wrapper
      .findAll('.group')[1]
      .find('button[class*="group-hover:opacity-100"]')
      .trigger('click')

    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('select')).toBeFalsy()
  })

  it('applies connection color to active indicator and status dot', () => {
    const wrapper = createWrapper({
      connections: [createMockConnection({ active: true, connected: true, color: '#ff00ff' })],
    })
    expect(wrapper.find('.absolute.left-0').attributes('style')).toContain('#ff00ff')
    expect(wrapper.find('.w-2.h-2.rounded-full').attributes('style')).toContain('#ff00ff')
  })

  it('shows glow effect for connected status', () => {
    const wrapper = createWrapper({
      connections: [createMockConnection({ connected: true, color: '#4db6ac' })],
    })
    expect(wrapper.find('.w-2.h-2.rounded-full').attributes('style')).toContain('box-shadow')
  })

  it.each([
    ['Connected', true],
    ['Disconnected', false],
  ])('shows %s title for status dot', (expected, connected) => {
    const wrapper = createWrapper({ connections: [createMockConnection({ connected })] })
    expect(wrapper.find('.w-2.h-2.rounded-full').attributes('title')).toBe(expected)
  })

  it('truncates long connection names', () => {
    const wrapper = createWrapper({
      connections: [
        createMockConnection({
          name: 'This is a very long database connection name that should be truncated',
        }),
      ],
    })
    expect(wrapper.find('.text-xs.font-medium.truncate').classes()).toContain('truncate')
  })

  it('has hover effects on connections', () => {
    expect(createWrapper().find('.group').classes()).toContain('hover:bg-zinc-200')
  })

  it('renders Database icon for each connection', () => {
    expect(createWrapper({ connections: twoConns() }).findAllComponents(Database)).toHaveLength(2)
  })

  it('maintains scroll on overflow', () => {
    expect(createWrapper().find('.flex-1.overflow-y-auto').exists()).toBe(true)
  })

  it('disables remove button when connection has running queries', () => {
    const wrapper = createWrapper({
      connections: twoConns(),
      hasRunningQueries: (connId: string) => connId === '2',
    })
    const removeButtons = wrapper
      .findAll('button')
      .filter(
        (btn) => btn.html().includes('Remove connection') || btn.html().includes('Cannot remove'),
      )
    expect(removeButtons.length).toBeGreaterThan(0)
    const disabledButton = removeButtons.find((btn) =>
      btn.attributes('title')?.includes('Cannot remove'),
    )
    expect(disabledButton).toBeDefined()
    expect(disabledButton?.attributes('disabled')).toBeDefined()
  })

  it('enables remove button when connection has no running queries', () => {
    const wrapper = createWrapper({ connections: twoConns() })
    const removeButtons = wrapper
      .findAll('button')
      .filter((btn) => btn.attributes('title')?.includes('Remove connection'))
    removeButtons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeUndefined()
    })
  })

  it('prevents remove event when connection has running queries', async () => {
    const wrapper = createWrapper({
      connections: twoConns(),
      hasRunningQueries: (connId: string) => connId === '2',
    })
    const disabledButton = wrapper
      .findAll('button')
      .find((btn) => btn.attributes('title')?.includes('Cannot remove'))
    expect(disabledButton).toBeDefined()
    if (disabledButton) await disabledButton.trigger('click')
    expect(wrapper.emitted('remove')).toBeFalsy()
  })

  it('renders settings button', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('button[title="Settings"]').exists()).toBe(true)
  })

  it('emits openSettings when settings button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('button[title="Settings"]').trigger('click')
    expect(wrapper.emitted('openSettings')).toHaveLength(1)
  })
})
