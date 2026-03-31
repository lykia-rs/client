/**
 * Wait for next tick and any pending promises
 */
export async function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

/**
 * Create a mock connection object
 */
export function createMockConnection(overrides = {}) {
  return {
    id: '1',
    name: 'test-db',
    address: 'localhost:19191',
    host: 'localhost',
    port: '19191',
    color: '#4db6ac',
    active: true,
    connected: true,
    ...overrides,
  }
}
