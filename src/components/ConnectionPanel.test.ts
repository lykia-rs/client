import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConnectionPanel from '@/components/ConnectionPanel.vue'
import { Database, X } from 'lucide-vue-next'
import { createMockConnection } from '@/test/utils'

describe('ConnectionPanel.vue', () => {
  const createWrapper = (props = {}) => {
    return mount(ConnectionPanel, {
      props: {
        connections: [createMockConnection()],
        ...props,
      },
    })
  }

  it('renders the component with header', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('h2').text()).toBe('Connections')
  })

  it('renders add connection button', () => {
    const wrapper = createWrapper()
    const addButton = wrapper.find('button[title="New Connection"]')
    expect(addButton.exists()).toBe(true)
  })

  it('emits add event when add button is clicked', async () => {
    const wrapper = createWrapper()
    const addButton = wrapper.find('button[title="New Connection"]')
    
    await addButton.trigger('click')
    
    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('renders all connections', () => {
    const connections = [
      createMockConnection({ id: '1', name: 'DB1', address: 'localhost:9001' }),
      createMockConnection({ id: '2', name: 'DB2', address: 'localhost:9002' }),
      createMockConnection({ id: '3', name: 'DB3', address: 'localhost:9003' }),
    ]
    
    const wrapper = createWrapper({ connections })
    
    const connectionElements = wrapper.findAll('[data-testid], .group')
    expect(connectionElements.length).toBeGreaterThanOrEqual(3)
    expect(wrapper.text()).toContain('DB1')
    expect(wrapper.text()).toContain('DB2')
    expect(wrapper.text()).toContain('DB3')
  })

  it('displays connection name and address', () => {
    const connection = createMockConnection({ 
      name: 'Production DB', 
      address: 'prod.example.com:5432' 
    })
    
    const wrapper = createWrapper({ connections: [connection] })
    
    expect(wrapper.text()).toContain('Production DB')
    expect(wrapper.text()).toContain('prod.example.com:5432')
  })

  it('shows connection status indicator', () => {
    const connectedConn = createMockConnection({ connected: true, color: '#4db6ac' })
    const disconnectedConn = createMockConnection({ 
      id: '2', 
      connected: false, 
      color: '#ff0000' 
    })
    
    const wrapper = createWrapper({ 
      connections: [connectedConn, disconnectedConn] 
    })
    
    const statusIndicators = wrapper.findAll('.w-2.h-2.rounded-full')
    expect(statusIndicators).toHaveLength(2)
  })

  it('highlights active connection', () => {
    const connections = [
      createMockConnection({ id: '1', active: true }),
      createMockConnection({ id: '2', active: false }),
    ]
    
    const wrapper = createWrapper({ connections })
    
    const connectionElements = wrapper.findAll('.group')
    // Active connection should have background style
    expect(connectionElements[0].classes()).toContain('bg-zinc-800/30')
  })

  it('emits select event when connection is clicked', async () => {
    const connection = createMockConnection({ id: '1', name: 'Test DB' })
    const wrapper = createWrapper({ connections: [connection] })
    
    const connectionElement = wrapper.find('.group')
    await connectionElement.trigger('click')
    
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')?.[0]).toEqual([connection])
  })

  it('shows remove button on hover for multiple connections', () => {
    const connections = [
      createMockConnection({ id: '1' }),
      createMockConnection({ id: '2' }),
    ]
    
    const wrapper = createWrapper({ connections })
    
    // Check that remove buttons exist when there are multiple connections
    const removeButtons = wrapper.findAll('button').filter(btn => 
      btn.html().includes('X') || btn.findComponent(X).exists()
    )
    expect(removeButtons.length).toBeGreaterThan(0)
  })

  it('does not show remove button when only one connection exists', () => {
    const wrapper = createWrapper({ 
      connections: [createMockConnection()] 
    })
    
    // Find all X icon instances - should be only the add button's close
    wrapper.findAllComponents(X)
    // The only X should be in a remove button context which shouldn't be rendered
    const removeButtons = wrapper.findAll('button').filter(btn => {
      const html = btn.html()
      return html.includes('group-hover:opacity-100')
    })
    expect(removeButtons.length).toBe(0)
  })

  it('emits remove event when remove button is clicked', async () => {
    const connections = [
      createMockConnection({ id: '1' }),
      createMockConnection({ id: '2' }),
    ]
    
    const wrapper = createWrapper({ connections })
    
    // Find remove button for second connection
    const groups = wrapper.findAll('.group')
    const removeButton = groups[1].find('button[class*="group-hover:opacity-100"]')
    
    await removeButton.trigger('click')
    
    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('remove')?.[0]).toEqual(['2'])
  })

  it('prevents remove event from triggering select', async () => {
    const connections = [
      createMockConnection({ id: '1' }),
      createMockConnection({ id: '2' }),
    ]
    
    const wrapper = createWrapper({ connections })
    
    const groups = wrapper.findAll('.group')
    const removeButton = groups[1].find('button[class*="group-hover:opacity-100"]')
    
    await removeButton.trigger('click')
    
    expect(wrapper.emitted('remove')).toBeTruthy()
    // Select should not be emitted when clicking remove
    expect(wrapper.emitted('select')).toBeFalsy()
  })

  it('applies connection color to active indicator', () => {
    const connection = createMockConnection({ 
      active: true, 
      color: '#ff00ff' 
    })
    
    const wrapper = createWrapper({ connections: [connection] })
    
    const colorBar = wrapper.find('.absolute.left-0')
    expect(colorBar.attributes('style')).toContain('#ff00ff')
  })

  it('applies connection color to status dot', () => {
    const connection = createMockConnection({ 
      connected: true, 
      color: '#00ff00' 
    })
    
    const wrapper = createWrapper({ connections: [connection] })
    
    const statusDot = wrapper.find('.w-2.h-2.rounded-full')
    expect(statusDot.attributes('style')).toContain('#00ff00')
  })

  it('shows glow effect for connected status', () => {
    const connection = createMockConnection({ 
      connected: true, 
      color: '#4db6ac' 
    })
    
    const wrapper = createWrapper({ connections: [connection] })
    
    const statusDot = wrapper.find('.w-2.h-2.rounded-full')
    const style = statusDot.attributes('style')
    expect(style).toContain('box-shadow')
  })

  it('has proper accessibility attributes', () => {
    const connection = createMockConnection({ connected: true })
    const wrapper = createWrapper({ connections: [connection] })
    
    const statusDot = wrapper.find('.w-2.h-2.rounded-full')
    expect(statusDot.attributes('title')).toBe('Connected')
  })

  it('shows disconnected title when not connected', () => {
    const connection = createMockConnection({ connected: false })
    const wrapper = createWrapper({ connections: [connection] })
    
    const statusDot = wrapper.find('.w-2.h-2.rounded-full')
    expect(statusDot.attributes('title')).toBe('Disconnected')
  })

  it('truncates long connection names', () => {
    const connection = createMockConnection({ 
      name: 'This is a very long database connection name that should be truncated'
    })
    
    const wrapper = createWrapper({ connections: [connection] })
    
    const nameElement = wrapper.find('.text-sm.font-medium.truncate')
    expect(nameElement.exists()).toBe(true)
    expect(nameElement.classes()).toContain('truncate')
  })

  it('has hover effects on connections', () => {
    const wrapper = createWrapper()
    
    const connectionElement = wrapper.find('.group')
    expect(connectionElement.classes()).toContain('hover:bg-zinc-800/50')
  })

  it('renders Database icon for each connection', () => {
    const connections = [
      createMockConnection({ id: '1' }),
      createMockConnection({ id: '2' }),
    ]
    
    const wrapper = createWrapper({ connections })
    
    const databaseIcons = wrapper.findAllComponents(Database)
    expect(databaseIcons).toHaveLength(2)
  })

  it('maintains scroll on overflow', () => {
    const wrapper = createWrapper()
    
    const scrollableArea = wrapper.find('.flex-1.overflow-y-auto')
    expect(scrollableArea.exists()).toBe(true)
  })
})
