# LykiaDB Client — Agent Guide

## Project Overview

A Tauri 2.x desktop app with a Vue 3 + TypeScript frontend. It connects to a LykiaDB server via raw TCP (port 19191), sends queries through Tauri IPC commands, and displays results in a split-pane UI with CodeMirror-based syntax highlighting powered by WASM.

## Tech Stack

- **Frontend**: Vue 3.5, TypeScript 5.6, Vite 6
- **Desktop shell**: Tauri 2.x (Rust backend)
- **Editor**: CodeMirror 6 with custom Lykia language via WASM tokenizer
- **UI**: Tailwind CSS 4, shadcn-vue components, splitpanes
- **Tables**: @tanstack/vue-table
- **Tests**: Vitest 4 + happy-dom + @vue/test-utils
- **Package manager**: pnpm

## Architecture

```
src/
  components/
    connection/        # ConnectionPanel, ConnectionDialog
    query/             # QueryPanel, QueryEditor (CodeMirror wrapper)
    results/           # ResultPanel (view switcher), TableView, JsonView, ListView
    ui/                # shadcn-vue primitives (Button, Input, Label, etc.)
  composables/         # Shared state (useConnections, useQueryExecution, useQueryTabs, useTheme)
  lib/                 # WASM bindings (wasm.ts), language support (lykia-lang.ts), error highlighting
  integration/         # Integration tests (full App mount with mockIPC)
  test/                # Test setup and utilities
src-tauri/             # Rust Tauri backend
src-wasm/              # Rust WASM crate for tokenization
```

### Tauri IPC Commands

The backend exposes two commands via `invoke()`:

| Command            | Arguments                    | Returns                                                  |
|--------------------|------------------------------|----------------------------------------------------------|
| `test_connection`  | `{ address: string }`        | `void` (throws on failure)                               |
| `execute_query`    | `{ address, query: string }` | `{ success, data?, error?, duration, error_span? }` |

### Key Types

```ts
// src/composables/useQueryTabs.ts
type QueryResultValue = string | number | boolean | null | undefined | QueryResultValue[] | { [key: string]: QueryResultValue }
type QueryResultRow = Record<string, QueryResultValue>
type QueryResult = QueryResultRow[] | null

// src/composables/useConnections.ts
interface Connection { id: string; name: string; address: string; host: string; port: string; color: string; active: boolean; connected: boolean }

// src/composables/useQueryExecution.ts
interface QueryResponse { success: boolean; data?: QueryResult; error?: string; duration: number; error_span?: { from: number; to: number } | null }
```

## Commands

| Task                  | Command                              |
|-----------------------|--------------------------------------|
| Dev server            | `pnpm dev` (port 1420)               |
| Build                 | `pnpm build`                         |
| Build WASM            | `pnpm build:wasm`                    |
| Full build            | `pnpm build:full`                    |
| Lint                  | `pnpm lint`                          |
| Type check            | `npx vue-tsc --noEmit`               |
| All tests             | `pnpm test`                          |
| Integration tests     | `pnpm test:integration`              |
| Test with coverage    | `pnpm test:coverage`                 |

## Type Rules

- **No `any` or `unknown`** anywhere in source or test files. Use specific types.
- Run `npx vue-tsc --noEmit` to verify after type changes.

---

## Testing Guide

### Test Infrastructure

All tests use Vitest with happy-dom. Global test setup is in `src/test/setup.ts`, which mocks:

1. **WASM module** (`@/lib/wasm`) — `initWasm()` and `tokenize()` are mocked so tests don't load the binary
2. **Tauri IPC** (`@tauri-apps/api/core`) — `invoke` is a `vi.fn()`
3. **Tauri plugins** (`@tauri-apps/plugin-opener`) — `open` is mocked

Helper utilities live in `src/test/utils.ts`:

- `flushPromises()` — waits for pending microtasks/promises
- `createMockConnection(overrides)` — returns a well-typed mock Connection object

### Writing Unit Tests

Unit tests go next to their source file: `Foo.vue` → `Foo.test.ts`, `useFoo.ts` → `useFoo.test.ts`.

#### Component Test Pattern

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import MyComponent from '@/components/MyComponent.vue'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

// Stub QueryEditor to avoid CodeMirror DOM dependency
const QueryEditorStub = {
  name: 'QueryEditor',
  template: `<textarea
    :value="modelValue"
    :disabled="disabled"
    :readonly="readonly"
    @input="$emit('update:modelValue', $event.target.value)"
    class="code-editor-stub"
  />`,
  props: ['modelValue', 'disabled', 'readonly', 'dimmed', 'placeholder'],
  emits: ['update:modelValue', 'parseError', 'parseErrorMessage'],
}

// Stub splitpanes (they don't render in happy-dom)
const stubs = {
  Splitpanes: { template: '<div class="splitpanes"><slot /></div>' },
  Pane: { template: '<div class="pane"><slot /></div>' },
  QueryEditor: QueryEditorStub,
}

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { /* ... */ },
      global: { stubs },
    })
    expect(wrapper.find('.some-class').exists()).toBe(true)
  })
})
```

#### Composable Test Pattern

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { useMyComposable } from '@/composables/useMyComposable'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

describe('useMyComposable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls invoke with correct args', async () => {
    vi.mocked(invoke).mockResolvedValue({ success: true, data: [], duration: 10 })
    const { executeQuery } = useMyComposable()
    await executeQuery('SELECT 1')
    expect(invoke).toHaveBeenCalledWith('execute_query', { address: 'localhost:19191', query: 'SELECT 1' })
  })
})
```

#### Mocking Tauri IPC

```ts
// Success response
vi.mocked(invoke).mockResolvedValue({
  success: true,
  data: [{ id: 1, name: 'Alice' }],
  duration: 42,
})

// Error response (returned, not thrown)
vi.mocked(invoke).mockResolvedValue({
  success: false,
  error: 'Syntax error near SELECT',
  duration: 5,
  error_span: { from: 0, to: 5 },
})

// Connection failure (thrown)
vi.mocked(invoke).mockRejectedValue(new Error('Connection refused'))

// Command-specific mock
vi.mocked(invoke).mockImplementation(async (cmd: string) => {
  if (cmd === 'test_connection') return undefined
  if (cmd === 'execute_query') return { success: true, data: [], duration: 1 }
  throw new Error(`Unknown command: ${cmd}`)
})
```

#### Testing with Fake Timers

The loading indicator in QueryPanel appears after 500ms. To test timing-dependent behavior:

```ts
it('shows loading after 500ms', async () => {
  vi.useFakeTimers()

  // Mount component AFTER enabling fake timers
  const wrapper = mount(MyComponent, { global: { stubs } })
  await vi.advanceTimersByTimeAsync(100) // let initial setup complete

  // Set up a never-resolving promise for the query
  vi.mocked(invoke).mockImplementation(() => new Promise(() => {}))

  // Trigger the query
  await wrapper.find('textarea').setValue('SELECT 1')
  await wrapper.vm.$nextTick()
  await wrapper.find('[data-testid="execute-button"]').trigger('click')
  await wrapper.vm.$nextTick()

  // Before 500ms — no loading
  expect(wrapper.find('[data-testid="execute-button"]').text()).toBe('Execute')

  // Advance past 500ms
  vi.advanceTimersByTime(600)
  await wrapper.vm.$nextTick()

  expect(wrapper.find('[data-testid="execute-button"]').text()).toContain('Running...')
})
```

**Important**: Call `vi.useFakeTimers()` _before_ mounting, and use `vi.advanceTimersByTimeAsync()` (not `flushPromises()`) for promise resolution under fake timers.

### Writing Integration Tests

Integration tests live in `src/integration/` and mount the full `App.vue` with stubs for QueryEditor and Splitpanes. They test multi-component flows end-to-end within the Vitest/happy-dom environment.

Run with: `pnpm test:integration`

#### Integration Test Pattern

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { invoke } from '@tauri-apps/api/core'
import App from '@/App.vue'
import ConnectionPanel from '@/components/connection/ConnectionPanel.vue'
import ConnectionDialog from '@/components/connection/ConnectionDialog.vue'
import QueryPanel from '@/components/query/QueryPanel.vue'
import ResultPanel from '@/components/results/ResultPanel.vue'
import { resetQueryTabsState } from '@/composables/useQueryTabs'
import { flushPromises } from '@/test/utils'

vi.mock('@tauri-apps/api/core')

// Same stubs as unit tests (QueryEditorStub, Splitpanes, Pane)

function mountApp() {
  return mount(App, { global: { stubs } })
}

function mockIPC(/* overrides */) {
  vi.mocked(invoke).mockImplementation(async (cmd: string) => {
    if (cmd === 'test_connection') return undefined
    if (cmd === 'execute_query') return { success: true, data: [...], duration: 42 }
    throw new Error(`Unknown command: ${cmd}`)
  })
}

describe('Integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetQueryTabsState()  // Reset module-level tab state between tests
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('full connect → query → results flow', async () => {
    mockIPC()
    const wrapper = mountApp()
    await flushPromises()

    // Interact with ConnectionPanel, QueryPanel, verify ResultPanel
  })
})
```

#### Key Integration Helpers

- **`resetQueryTabsState()`** — must be called in `beforeEach` to reset the module-level `allTabs` ref and `tabIdCounter`
- **`flushPromises()`** — wait for async operations (IPC mocks resolving, component updates)
- **Emitting events on child components** — use `wrapper.findComponent(Component).vm.$emit('eventName', payload)` to simulate user interactions that bubble through the component tree
- **Adding connections** — find ConnectionDialog via `wrapper.findComponent(ConnectionDialog)`, then call `dialog.props('connectHandler')(host, port)`

### When Implementing a New Feature

1. **Understand the scope**: Read the relevant composable, component, and any Tauri commands involved.
2. **Write unit tests first**: Create or update the co-located `.test.ts` file. Mock `invoke` for any IPC calls.
3. **Implement the feature**: Edit the composable/component. Follow existing patterns (reactive refs, computed props, invoke wrapper).
4. **Add integration coverage**: If the feature affects multi-component flows, add a test in `src/integration/app-flows.test.ts`.
5. **Verify**:
   - `pnpm lint` — no ESLint errors
   - `npx vue-tsc --noEmit` — no type errors
   - `pnpm test` — all tests pass (unit + integration)
