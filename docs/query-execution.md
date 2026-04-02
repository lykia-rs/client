# Query Execution

## Overview

Users write queries in tabbed editors and execute them against the active connection. Managed by `useQueryTabs` (tab state) and `useQueryExecution` (execution logic). UI is in `QueryPanel`.

## Tab Data Model

```typescript
interface QueryTab {
  id: string
  name: string               // "Query 1", "Query 2", ...
  query: string              // editor content
  result: QueryResult        // QueryResultRow[] | null
  error: string
  errorSpan: { from: number; to: number } | null
  loading: boolean
  loadingIndicator: boolean  // true after 500ms of loading
  connectionId: string
  duration: number | null    // ms
}
```

## Tab Management

### Adding Tabs

- Click `button[title="New Query"]`.
- New tab created for the current connection. Name increments: "Query 1", "Query 2", etc. (count based on existing tabs for that connection).
- New tab becomes active.

### Closing Tabs

- Click `button[title="Close tab"]` (X icon on tab, visible on hover).
- **Blocked** if the tab is currently loading (`loading: true`).
- **Blocked** if it's the last remaining tab for the connection.
- If the closed tab was active, switches to the first remaining tab.

### Switching Tabs

- Click a tab button. Sets `activeTabId` to that tab's ID.
- Each tab preserves independent state (query, result, error, duration).

### Connection Switching

- When active connection changes, tabs for the new connection are shown.
- If the new connection has no tabs, one is created automatically.
- Previous connection's tabs are preserved (restored when switching back).
- All tabs stored in a shared global `allTabs` ref, filtered by `connectionId`.

## Execution Flow

1. User writes a query in the editor and clicks `[data-testid="execute-button"]`.
2. **Pre-checks**: if tab is null or `query.trim()` is empty, execution is skipped (no invoke).
3. Tab state is updated:
   - `loading = true`, `loadingIndicator = false`
   - `error = ''`, `errorSpan = null`, `duration = null`
   - Previous `result` is **preserved** (visible during loading).
4. A 500ms timer starts. If still loading after 500ms, `loadingIndicator = true`.
5. `invoke('execute_query', { address: connection.address, query: tab.query })` is called.
6. **On success** (`response.success === true`):
   - `tab.result = response.data`
   - `tab.duration = response.duration`
7. **On query error** (`response.success === false`):
   - `tab.error = response.error || 'Query failed'`
   - `tab.errorSpan = response.error_span ?? null`
   - `tab.duration = response.duration`
   - `tab.result` remains unchanged (previous result kept).
8. **On invoke exception** (network error, etc.):
   - `tab.error = String(exception)`
   - `tab.errorSpan = null`
9. **Finally**: `loading = false`, `loadingIndicator = false`, timer cleared.

## Execute Button States

| Condition              | State    | Text       |
|------------------------|----------|------------|
| Query empty            | disabled | Execute    |
| Parse error active     | disabled | Execute    |
| Query valid, idle      | enabled  | Execute    |
| Executing              | disabled | Running... |

The execute button uses the active connection's color as background.

## Loading UI

- **Shimmer bar**: `.loading-shimmer` element appears at top of results pane during execution.
- **Spinner**: `.animate-spin` icon shown on the active tab and the execute button after 500ms.
- **Tab close button**: replaced by spinner while that tab's query is running.
- **Previous results**: remain visible with `ResultTable` locked (`isLocked: true`).

## Error Display

- **Query errors** (with `errorSpan`): shown in the editor status bar (`.px-4.h-8` at bottom of editor pane), not in the results area. The editor highlights the error range.
- **Query errors** (without `errorSpan`): shown in the results area as `.text-red-700` text.
- **Parse errors** (client-side, from WASM): shown in a status bar below the editor (`.text-red-500`). These disable the Execute button.

## Status Bar

- Bottom of results pane shows execution duration when available (e.g., "123ms").
- Shows row count for tabular results.

## DOM Selectors

| Element           | Selector                           |
|-------------------|------------------------------------|
| Execute button    | `[data-testid="execute-button"]`   |
| New tab button    | `button[title="New Query"]`        |
| Close tab button  | `button[title="Close tab"]`        |
| Tab button        | Buttons containing "Query" text    |
| Loading shimmer   | `.loading-shimmer`                 |
| Loading spinner   | `.animate-spin`                    |
| Error message     | `.text-red-700`                    |
| Parse error       | `.text-red-500`                    |
| Editor pane       | First `.splitpanes` child (40%)    |
| Results pane      | Second `.splitpanes` child (60%)   |
