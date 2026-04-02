import type { QueryResultValue } from '@/composables/useQueryTabs'

export function isExpandable(val: QueryResultValue): val is Record<string, QueryResultValue> | QueryResultValue[] {
  return val !== null && val !== undefined && typeof val === 'object'
}

export function typeClass(val: QueryResultValue): string {
  if (val === null || val === undefined) return 'text-zinc-400 dark:text-zinc-500 italic'
  if (typeof val === 'string') return 'text-green-600 dark:text-green-400'
  if (typeof val === 'number') return 'text-blue-600 dark:text-blue-400'
  if (typeof val === 'boolean') return 'text-purple-600 dark:text-purple-400'
  return ''
}

export function formatPrimitive(val: QueryResultValue): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}
