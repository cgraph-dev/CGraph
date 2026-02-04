/**
 * ConversationScreen Module
 *
 * Modular conversation screen with split components for maintainability.
 * Maximum file size: 300 lines (per Meta/Google code standards).
 *
 * @module screens/messages/ConversationScreen
 */

// Main screen component (re-export from parent for backwards compatibility)
// The main ConversationScreen.tsx stays in parent directory for route compatibility
export { default } from '../ConversationScreen';

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';

// Components
export * from './components';

// Styles
export { styles, SCREEN_WIDTH, SCREEN_HEIGHT } from './styles';

// Hooks
export * from './hooks';
