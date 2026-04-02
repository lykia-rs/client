import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultTable from '@/components/ResultTable.vue'
import type { QueryResult } from '@/composables/useQueryTabs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mountTable = (data: QueryResult | (Record<string, any>) | (string | number | boolean)[]) =>
  mount(ResultTable, { props: { data: data as QueryResult } })

describe('ResultTable.vue', () => {
  it('renders table for array data with objects', () => {
    const wrapper = mountTable([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.find('tbody').exists()).toBe(true)
  })

  it('renders column headers from object keys', () => {
    const wrapper = mountTable([{ id: 1, name: 'Alice', email: 'alice@test.com' }])
    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(3)
    expect(headers[0].text()).toContain('id')
    expect(headers[1].text()).toContain('name')
    expect(headers[2].text()).toContain('email')
  })

  it('renders all rows of data', () => {
    const wrapper = mountTable([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('renders cell values correctly', () => {
    const wrapper = mountTable([{ id: 1, name: 'Alice', active: true }])
    const cells = wrapper.findAll('tbody td')
    expect(cells[0].text()).toBe('1')
    expect(cells[1].text()).toBe('Alice')
    expect(cells[2].text()).toBe('true')
  })

  it.each([
    ['null', [{ id: 1, v: null }], 'null'],
    ['undefined', [{ id: 1, v: undefined }], 'undefined'],
    ['object as JSON', [{ id: 1, v: { key: 'value', count: 42 } }], '{"key":"value","count":42}'],
    ['empty string', [{ id: 1, v: '' }], ''],
    ['string', [{ id: 1, v: 'This is a test string' }], 'This is a test string'],
    ['array nested in object', [{ id: 1, v: ['tag1', 'tag2', 'tag3'] }], '["tag1","tag2","tag3"]'],
  ])('formats %s values', (_, data, expected) => {
    const cells = mountTable(data).findAll('tbody td')
    expect(cells[cells.length - 1].text()).toBe(expected)
  })

  it('renders number values correctly', () => {
    const cells = mountTable([{ integer: 42, float: 3.14, negative: -10 }]).findAll('tbody td')
    expect(cells[0].text()).toBe('42')
    expect(cells[1].text()).toBe('3.14')
    expect(cells[2].text()).toBe('-10')
  })

  it('renders boolean values correctly', () => {
    const cells = mountTable([{ isActive: true, isDeleted: false }]).findAll('tbody td')
    expect(cells[0].text()).toBe('true')
    expect(cells[1].text()).toBe('false')
  })

  it('renders zero values correctly', () => {
    const cells = mountTable([{ count: 0, balance: 0.0 }]).findAll('tbody td')
    expect(cells[0].text()).toBe('0')
    expect(cells[1].text()).toBe('0')
  })

  it('handles mixed data types in columns', () => {
    const data = [
      { value: 'string' },
      { value: 123 },
      { value: null },
      { value: { nested: 'object' } },
    ]
    const rows = mountTable(data).findAll('tbody tr')
    expect(rows).toHaveLength(4)
    expect(rows[0].find('td').text()).toBe('string')
    expect(rows[1].find('td').text()).toBe('123')
    expect(rows[2].find('td').text()).toBe('null')
    expect(rows[3].find('td').text()).toContain('nested')
  })

  it.each([
    ['empty array', []],
    ['non-array data', { message: 'Not an array' }],
    ['primitive array', [1, 2, 3, 'string', true]],
  ])('does not render table for %s', (_, data) => {
    const wrapper = mountTable(data)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('has sticky table header with uppercase styling', () => {
    const wrapper = mountTable([{ id: 1 }])
    const thead = wrapper.find('thead')
    expect(thead.classes()).toContain('sticky')
    expect(thead.classes()).toContain('top-0')
    expect(wrapper.find('th').classes()).toContain('uppercase')
  })

  it('has hover effect on table rows', () => {
    expect(
      mountTable([{ id: 1 }])
        .find('tbody tr')
        .classes(),
    ).toContain('hover:bg-zinc-50')
  })

  it('uses monospace font for cell values', () => {
    expect(
      mountTable([{ code: 'SELECT' }])
        .find('tbody td')
        .classes(),
    ).toContain('font-mono')
  })

  it('handles large datasets', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }))
    expect(mountTable(data).findAll('tbody tr')).toHaveLength(100)
  })

  it('handles objects with many columns', () => {
    const data = [
      Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`col${i + 1}`, String.fromCharCode(97 + i)]),
      ),
    ]
    expect(mountTable(data).findAll('th')).toHaveLength(10)
  })

  it('has scrollable container', () => {
    expect(
      mountTable([{ id: 1 }])
        .find('.overflow-auto')
        .exists(),
    ).toBe(true)
  })
})
