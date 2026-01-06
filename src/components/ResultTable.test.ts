import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultTable from '@/components/ResultTable.vue'

describe('ResultTable.vue', () => {
  it('renders table for array data with objects', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.find('tbody').exists()).toBe(true)
  })

  it('renders column headers from object keys', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(3)
    expect(headers[0].text()).toBe('id')
    expect(headers[1].text()).toBe('name')
    expect(headers[2].text()).toBe('email')
  })

  it('renders all rows of data', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  it('renders cell values correctly', () => {
    const data = [
      { id: 1, name: 'Alice', active: true },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[0].text()).toBe('1')
    expect(cells[1].text()).toBe('Alice')
    expect(cells[2].text()).toBe('true')
  })

  it('formats null values', () => {
    const data = [
      { id: 1, name: null },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[1].text()).toBe('null')
  })

  it('formats undefined values', () => {
    const data = [
      { id: 1, name: undefined },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[1].text()).toBe('undefined')
  })

  it('formats object values as JSON', () => {
    const data = [
      { id: 1, metadata: { key: 'value', count: 42 } },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[1].text()).toBe('{"key":"value","count":42}')
  })

  it('handles empty array', () => {
    const data: any[] = []
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('pre').exists()).toBe(true)
  })

  it('handles non-array data by showing JSON', () => {
    const data = { message: 'Not an array' }
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('pre').exists()).toBe(true)
    expect(wrapper.text()).toContain('Not an array')
  })

  it('handles primitive array values', () => {
    const data = [1, 2, 3, 'string', true]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('pre').exists()).toBe(true)
  })

  it('renders string values correctly', () => {
    const data = [
      { id: 1, description: 'This is a test string' },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[1].text()).toBe('This is a test string')
  })

  it('renders number values correctly', () => {
    const data = [
      { integer: 42, float: 3.14, negative: -10 },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[0].text()).toBe('42')
    expect(cells[1].text()).toBe('3.14')
    expect(cells[2].text()).toBe('-10')
  })

  it('renders boolean values correctly', () => {
    const data = [
      { isActive: true, isDeleted: false },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[0].text()).toBe('true')
    expect(cells[1].text()).toBe('false')
  })

  it('handles mixed data types in columns', () => {
    const data = [
      { value: 'string' },
      { value: 123 },
      { value: null },
      { value: { nested: 'object' } },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(4)
    expect(rows[0].find('td').text()).toBe('string')
    expect(rows[1].find('td').text()).toBe('123')
    expect(rows[2].find('td').text()).toBe('null')
    expect(rows[3].find('td').text()).toContain('nested')
  })

  it('renders JSON with proper formatting for non-table data', () => {
    const data = { 
      status: 'success', 
      count: 42,
      items: ['a', 'b', 'c'] 
    }
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const pre = wrapper.find('pre')
    expect(pre.exists()).toBe(true)
    expect(pre.text()).toContain('"status": "success"')
    expect(pre.text()).toContain('"count": 42')
  })

  it('has sticky table header', () => {
    const data = [{ id: 1, name: 'Test' }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const thead = wrapper.find('thead')
    expect(thead.classes()).toContain('sticky')
    expect(thead.classes()).toContain('top-0')
  })

  it('has hover effect on table rows', () => {
    const data = [{ id: 1, name: 'Test' }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const row = wrapper.find('tbody tr')
    expect(row.classes()).toContain('hover:bg-zinc-800/30')
  })

  it('uses monospace font for cell values', () => {
    const data = [{ code: 'SELECT * FROM users' }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cell = wrapper.find('tbody td')
    expect(cell.classes()).toContain('font-mono')
  })

  it('handles large datasets', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
    }))
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(100)
  })

  it('handles objects with many columns', () => {
    const data = [{
      col1: 'a', col2: 'b', col3: 'c', col4: 'd', col5: 'e',
      col6: 'f', col7: 'g', col8: 'h', col9: 'i', col10: 'j',
    }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(10)
  })

  it('handles empty string values', () => {
    const data = [{ id: 1, name: '' }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[1].text()).toBe('')
  })

  it('handles zero values', () => {
    const data = [{ count: 0, balance: 0.0 }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[0].text()).toBe('0')
    expect(cells[1].text()).toBe('0')
  })

  it('applies uppercase styling to headers', () => {
    const data = [{ id: 1, name: 'Test' }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const header = wrapper.find('th')
    expect(header.classes()).toContain('uppercase')
  })

  it('has scrollable container', () => {
    const data = [{ id: 1, name: 'Test' }]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const container = wrapper.find('.overflow-auto')
    expect(container.exists()).toBe(true)
  })

  it('handles array nested in object', () => {
    const data = [
      { id: 1, tags: ['tag1', 'tag2', 'tag3'] },
    ]
    
    const wrapper = mount(ResultTable, {
      props: { data },
    })
    
    const cells = wrapper.findAll('tbody td')
    expect(cells[1].text()).toBe('["tag1","tag2","tag3"]')
  })
})
