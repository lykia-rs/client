import { mount } from '@vue/test-utils'
import { Component } from 'vue'

/**
 * Helper function to create a component wrapper with common options
 */
export function createWrapper(component: Component, options = {}) {
  return mount(component, {
    global: {
      stubs: {
        // Stub splitpanes to avoid issues in tests
        Splitpanes: {
          template: '<div><slot /></div>',
        },
        Pane: {
          template: '<div><slot /></div>',
        },
      },
    },
    ...options,
  })
}

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
