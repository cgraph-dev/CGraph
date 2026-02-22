/**
 * @cgraph/test-utils — Shared testing utilities.
 *
 * Builders, factories, custom matchers, and MSW handler
 * presets for consistent testing across web and mobile.
 *
 * @module @cgraph/test-utils
 */

export { createMockUser, createMockMessage, createMockConversation } from './factories';
export { createMockStore } from './store-helpers';
export { waitForNextTick, flushPromises } from './async-helpers';
