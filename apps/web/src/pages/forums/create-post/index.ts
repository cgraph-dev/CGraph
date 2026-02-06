/**
 * Create Post Module
 *
 * Forum post creation page with support for multiple post types
 * (text, image, link, video, poll), attachment uploads, and markdown editing.
 *
 * @module pages/forums/create-post
 */

// Main component
export { default } from './CreatePost';

// Sub-components
export { default as PollForm } from './PollForm';
export { default as PostTypeTabs } from './PostTypeTabs';

// Hooks
export { useCreatePost } from './hooks';

// Types
export type { PostType } from './types';
