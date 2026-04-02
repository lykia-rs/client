# Result Display

## Overview

Query results are displayed through a layered component architecture:

- **`ResultView`** — switcher component that handles view mode (table vs JSON), lock overlay during loading, and expand/collapse all controls
- **`ResultTable`** — pure table renderer using TanStack Vue Table (sorting, pagination)
- **`JsonTreeView`** — recursive collapsible JSON tree (MongoDB Compass-style)

Users can switch between views using toggle buttons in the results header bar.

## Data Types

```typescript
type QueryResultValue = string | number | boolean | null | undefined
                      | QueryResultValue[]
                      | { [key: string]: QueryResultValue }
type QueryResultRow = Record<string, QueryResultValue>
type QueryResult = QueryResultRow[] | null
type ResultViewMode = 'table' | 'json'
```

## Component Props

### ResultView

| Prop          | Type              | Default   | Description                                |
|---------------|-------------------|-----------|--------------------------------------------|
| `data`        | `QueryResult`     | —         | Query result data                          |
| `isLocked`    | `boolean`         | `false`   | Block interaction (pointer-events, select)  |
| `showOverlay` | `boolean`         | `false`   | Show dimming overlay + "Query running..."   |
| `viewMode`    | `ResultViewMode`  | `'table'` | Display mode: table or JSON tree           |

### ResultTable

| Prop   | Type          | Default | Description       |
|--------|---------------|---------|-------------------|
| `data` | `QueryResult` | —       | Query result data |

## View Mode Toggle

Toggle buttons appear in the results header bar (next to the "Results" label) once results are available. Each tab remembers its own view mode.

- **Table icon** (`Table2`): switches to table mode
- **JSON icon** (`Braces`): switches to JSON tree mode
- The active mode button is highlighted with a background color

## Rendering Modes

### Table Mode (default)

Activated when `viewMode` is `'table'` and `data` is a non-empty array of objects.

- **Columns**: auto-detected from keys of the first row.
- **Headers**: `<th>` elements with uppercase styling, sticky (`position: sticky; top: 0`).
- **Rows**: `<tbody tr>` with hover highlight.
- **Cells**: monospace font, `text-[12px]`.

### JSON Tree Mode

Activated when `viewMode` is `'json'`, or when data is not a tableable array (empty arrays, plain objects, arrays of primitives).

Renders using `JsonTreeView` — a recursive, collapsible tree component (MongoDB Compass-style):

- **Root arrays**: each item displayed as a numbered "Document N" with expand/collapse
- **Objects**: show field count when collapsed (e.g., `{ 3 fields }`), key-value pairs when expanded
- **Arrays**: show item count when collapsed (e.g., `[ 5 items ]`), indexed items when expanded
- **Nested structures**: recursively expandable to any depth
- **Syntax highlighting** by type:
  - Strings: green (`text-green-600`)
  - Numbers: blue (`text-blue-600`)
  - Booleans: purple (`text-purple-600`)
  - Null/undefined: gray italic (`text-zinc-400 italic`)
- **Default collapsed**: all nodes are collapsed by default
- **Expand/Collapse all**: toolbar button toggles between expanding and collapsing all nodes
- **Indentation**: nested levels have left border + indent for visual hierarchy

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

The lock state has two tiers:

### Interaction lock (`isLocked: true`)

Blocks user interaction without visual changes (used for fast queries < 500ms):

- `pointer-events-none` — prevents clicks/scrolling.
- `select-none` — prevents text selection.
- `cursor-wait` — indicates the UI is busy.
- No dimming, no overlay text.

### Visual overlay (`showOverlay: true`)

Full visual feedback for slow queries (≥ 500ms). Requires `isLocked: true`:

- Semi-transparent overlay: `.absolute.inset-0` with backdrop blur.
- Text: "Query running...".
- Content has `opacity-50`.
- Pointer events disabled on entire component.

## DOM Selectors

| Element                  | Selector                                   |
|--------------------------|--------------------------------------------|
| Table                    | `table`                                    |
| Header row               | `thead tr`                                 |
| Column header            | `th` (clickable)                           |
| Data rows                | `tbody tr`                                 |
| Data cells               | `tbody td`                                 |
| JSON tree container      | `[data-testid="json-tree"]`                |
| Expand/collapse all btn  | `[data-testid="expand-collapse-all"]`      |
| Scroll container         | `.overflow-auto`                           |
| Lock overlay             | `.absolute.inset-0` (within ResultView)    |
| Lock message             | Text "Query running..."                    |
| Pagination prev          | Button containing "Previous"               |
| Pagination next          | Button containing "Next"                   |
| Table view toggle        | `[title="Table view"]`                     |
| JSON view toggle         | `[title="JSON view"]`                      |
