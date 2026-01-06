import { vi } from 'vitest'

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
