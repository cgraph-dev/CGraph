/**
 * Discovery module barrel export
 *
 * @module modules/discovery
 */

// Components
export { FeedModeTabs } from './components/feed-mode-tabs';
export { TopicCard } from './components/topic-card';
export { FrequencyPicker } from './components/frequency-picker';

// Hooks
export { useFeed } from './hooks/useFeed';
export type { FeedThread } from './hooks/useFeed';
export { useTopics, useUserFrequencies, useUpdateFrequencies } from './hooks/useFrequencies';
export type { Topic, UserFrequency } from './hooks/useFrequencies';

// Store
export { useDiscoveryStore } from './store/discoveryStore';
export type { FeedMode } from './store/discoveryStore';
