import { vi } from 'vitest'

// Mock WASM module so tests don't try to fetch the binary
vi.mock('@/lib/wasm', () => ({
  initWasm: vi.fn().mockResolvedValue(undefined),
  tokenize: vi.fn().mockReturnValue({ tree: null, errors: [] }),
}))

// Mock Tauri API
global.window = Object.assign(global.window || {}, {
  __TAURI__: {
    core: {
      invoke: vi.fn(),
    },
  },
})

// Mock Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-opener', () => ({
  open: vi.fn(),
}))
