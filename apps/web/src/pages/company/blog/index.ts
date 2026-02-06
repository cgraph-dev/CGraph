/**
 * Blog Module
 *
 * Company blog and updates page with featured posts,
 * categorized grid layout, newsletter subscription, and RSS links.
 *
 * @module pages/company/blog
 * @since v0.9.6
 */

// Main component
export { default } from './Blog';

// Sub-components
export { BlogHero } from './BlogHero';
export { BlogFeatured } from './BlogFeatured';
export { BlogGrid } from './BlogGrid';
export { BlogNewsletter } from './BlogNewsletter';
export { BlogFooterLinks } from './BlogFooterLinks';

// Types
export type { BlogPost, NewsletterInfo } from './types';

// Constants
export { blogPosts, categories, newsletter } from './constants';
