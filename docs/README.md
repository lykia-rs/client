# Application Layout

## Overview

LykiaDB Client is a Tauri desktop application with a split-pane interface for managing database connections and executing queries.

## Layout Structure

```
┌──────────────────────────────────────────────────┐
│ Splitpanes (horizontal)                          │
│ ┌────────────┬───────────────────────────────────┤
│ │ 20%        │ 80%                               │
│ │            │                                   │
│ │ Connection │ QueryPanel                        │
│ │ Panel      │ ┌───────────────────────────────┐ │
│ │            │ │ Splitpanes (vertical)         │ │
│ │ [conn 1]   │ │ ┌───────────────────────────┐ │ │
│ │ [conn 2]   │ │ │ 40% — Editor pane         │ │ │
│ │            │ │ │ [tabs] [+] [execute]       │ │ │
│ │            │ │ │ <CodeEditor>               │ │ │
│ │            │ │ │ [parse error bar]          │ │ │
│ │            │ │ ├───────────────────────────┤ │ │
│ │            │ │ │ 60% — Results pane        │ │ │
│ │            │ │ │ [shimmer bar]             │ │ │
│ │            │ │ │ <ResultTable>             │ │ │
│ │            │ │ │ [error display]           │ │ │
│ │            │ │ │ [status bar: duration]    │ │ │
│ │            │ │ └───────────────────────────┘ │ │
│ │ [theme     │ └───────────────────────────────┘ │
│ │  toggle]   │                                   │
│ └────────────┴───────────────────────────────────┘
│                                                  │
│ ConnectionDialog (modal, when open)              │
└──────────────────────────────────────────────────┘
```

## Component Tree

```
App.vue
├── Splitpanes
│   ├── Pane (20%) → ConnectionPanel
│   │   ├── Header: "Connections" + Add button
│   │   ├── Connection list (scrollable)
│   │   └── Footer: ThemeToggle
│   └── Pane (80%) → QueryPanel
│       └── Splitpanes (horizontal)
│           ├── Pane (40%) — Editor
│           │   ├── Tab bar (tab buttons + New Query + Execute)
│           │   ├── CodeEditor
│           │   └── Parse error status bar
│           └── Pane (60%) — Results
│               ├── Loading shimmer bar
│               ├── ResultTable (or error, or empty state)
│               └── Status bar (duration, row count)
└── ConnectionDialog (conditional modal)
```

## State Flow

```
useConnections() ──→ App.vue ──→ ConnectionPanel (display)
                       │              ↑ events (add/select/remove)
                       │
                       └──→ QueryPanel
                              ├── useQueryTabs(connection)
                              │     └── tabs, activeTab, addTab, closeTab
                              └── useQueryExecution()
                                    └── executeQuery(tab, connection)
                                          └── invoke('execute_query')
```

## Feature Index

| Feature              | Doc                                                  |
|----------------------|------------------------------------------------------|
| Connections          | [connection-management.md](connection-management.md) |
| Query tabs & execute | [query-execution.md](query-execution.md)             |
| Result table         | [result-display.md](result-display.md)               |
| Code editor          | [code-editor.md](code-editor.md)                     |
| Dark/light theme     | [theme.md](theme.md)                                 |
| Tauri backend & WASM | [tauri-commands.md](tauri-commands.md)                |
