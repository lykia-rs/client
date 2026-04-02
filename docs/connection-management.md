# Connection Management

## Overview

Users manage database connections via the left sidebar (`ConnectionPanel`) and a modal dialog (`ConnectionDialog`). State is managed by the `useConnections` composable.

## Data Model

```typescript
interface Connection {
  id: string            // unique, timestamp-based
  name: string          // display name (initially same as host)
  address: string       // "host:port"
  host: string
  port: string
  color: string         // hex from palette
  active: boolean       // currently selected
  connected: boolean    // test_connection succeeded
}
```

Color palette (assigned sequentially, cycling): `#4db6ac`, `#a5d6a7`, `#81c784`, `#64b5f6`, `#ba68c8`, `#ff8a65`.

## Initialization

- App starts with one default connection: `localhost:19191`.
- On mount, `invoke('test_connection', { address })` is called. Connection's `connected` flag is set based on success/failure.

## Adding a Connection

1. User clicks `button[title="New Connection"]` in the sidebar — opens `ConnectionDialog`.
2. Dialog renders with default values: host=`localhost`, port=`19191`.
3. User edits inputs (type `text`), clicks `button[type="submit"]` (Connect).
4. Values are trimmed. If either is empty after trim, submission is blocked (no invoke).
5. `invoke('test_connection', { address: "host:port" })` is called.
6. **On success**: new connection is created, assigned next color in palette, marked `active: true` (all others deactivated), dialog closes.
7. **On failure**: error message displayed in `.text-red-700` box inside dialog. User can retry.

### Dialog States

| State   | Button text    | Inputs   | Spinner        |
|---------|---------------|----------|----------------|
| Idle    | Connect       | enabled  | hidden         |
| Loading | Connecting... | disabled | `.animate-spin` |
| Error   | Connect       | enabled  | hidden         |

### Dialog Dismissal

- Close (X) button: `button` in header area.
- Cancel button.
- Backdrop click (`.fixed.inset-0`), but not clicks on the dialog card itself.

## Selecting a Connection

- User clicks a connection row (`.group` element) in the sidebar.
- Emits `select` event. The clicked connection becomes `active: true`; all others become `active: false`.
- QueryPanel switches to the selected connection's tabs.

## Removing a Connection

- Remove button (`button[title^="Remove"]`) appears on hover when multiple connections exist.
- Hidden entirely when only one connection remains.
- Disabled (`button[title="Cannot remove"]`) when the connection has running queries.
- Click emits `remove` with connection ID. The connection is deleted from the list.
- If the removed connection was active, the first remaining connection becomes active.

## Connection Panel UI

- Active connection: highlighted background (`bg-zinc-200 dark:bg-zinc-800/30`) + left color bar.
- Status dot (`.w-2.h-2.rounded-full`): glows with `box-shadow` when `connected: true`; dim when `disconnected`. Title attribute shows "Connected" or "Disconnected".
- Long names are truncated.
- Scrollable list: `overflow-y-auto`.

## DOM Selectors

| Element              | Selector                          |
|----------------------|-----------------------------------|
| Add button           | `button[title="New Connection"]`  |
| Connection row       | `.group`                          |
| Status dot           | `.w-2.h-2.rounded-full`          |
| Remove button        | `button[title^="Remove"]`         |
| Disabled remove      | `button[title="Cannot remove"]`   |
| Dialog backdrop      | `.fixed.inset-0`                  |
| Dialog host input    | First `input[type="text"]`        |
| Dialog port input    | Second `input[type="text"]`       |
| Dialog submit        | `button[type="submit"]`           |
| Dialog error         | `.text-red-700`                   |
| Dialog spinner       | `.animate-spin`                   |
