# Result Display

## Overview

`ResultTable` renders query results as a sortable, paginated table (for arrays of objects) or as formatted JSON (for all other data shapes).

## Data Types

```typescript
type QueryResultValue = string | number | boolean | null | undefined
                      | QueryResultValue[]
                      | { [key: string]: QueryResultValue }
type QueryResultRow = Record<string, QueryResultValue>
type QueryResult = QueryResultRow[] | null
```

## Props

| Prop       | Type          | Default | Description                        |
|------------|---------------|---------|------------------------------------|
| `data`     | `QueryResult` | —       | Query result data                  |
| `isLocked` | `boolean`     | `false` | Overlay + disable during loading   |

## Rendering Modes

### Table Mode

Activated when `data` is a non-empty array of objects.

- **Columns**: auto-detected from keys of the first row.
- **Headers**: `<th>` elements with uppercase styling, sticky (`position: sticky; top: 0`).
- **Rows**: `<tbody tr>` with hover highlight.
- **Cells**: monospace font, `text-[12px]`.

### JSON Mode

Activated for all other data: `null`, empty arrays, plain objects, arrays of primitives.

- Rendered in `<pre>` element with `JSON.stringify(data, null, 2)`.

### Empty State

When `data` is `null` and no query has been executed: "Execute a query to see results" placeholder text.

## Value Formatting

| Input Value          | Rendered Text               |
|----------------------|-----------------------------|
| `null`               | `"null"`                    |
| `undefined`          | `"undefined"`               |
| `"hello"`            | `"hello"`                   |
| `42`                 | `"42"`                      |
| `true`               | `"true"`                    |
| `0`                  | `"0"`                       |
| `{ key: "value" }`  | `'{"key":"value"}'`         |
| `["a", "b"]`        | `'["a","b"]'`               |

## Sorting

- Click any column header to cycle sort: **unsorted → ascending → descending → unsorted**.
- Sort icons in header:
  - `ChevronsUpDown` — unsorted (dimmed)
  - `ChevronUp` — ascending (highlighted)
  - `ChevronDown` — descending (highlighted)

## Pagination

- Page size: 100 rows.
- Controls shown only when data exceeds one page (`table.getPageCount() > 1`).
- Displays: "Showing X–Y of Z" and "Page N of M".
- **Previous** button: disabled on first page.
- **Next** button: disabled on last page.

## Lock Overlay

When `isLocked: true` (query running):

- Semi-transparent overlay: `.absolute.inset-0` with backdrop blur.
- Text: "Query running...".
- Table content has `opacity-50`.
- Pointer events disabled on entire component (`pointer-events-none select-none`).

## DOM Selectors

| Element           | Selector                                   |
|-------------------|--------------------------------------------|
| Table             | `table`                                    |
| Header row        | `thead tr`                                 |
| Column header     | `th` (clickable)                           |
| Data rows         | `tbody tr`                                 |
| Data cells        | `tbody td`                                 |
| JSON display      | `pre`                                      |
| Scroll container  | `.overflow-auto`                           |
| Lock overlay      | `.absolute.inset-0` (within ResultTable)   |
| Lock message      | Text "Query running..."                    |
| Pagination prev   | Button containing "Previous"               |
| Pagination next   | Button containing "Next"                   |
