/**
 * Blog data barrel export
 *
 * Import from '@/data/blog' to access all blog-related data.
 *
 * @example
 * ```ts
 * import { blogArticles, blogPosts, categoryColors, articleSlugs } from '@/data/blog';
 * ```
 *
 * @since v0.9.26
 */

export type { BlogArticleData, BlogPost, CategoryColor } from './types';
export { blogArticles } from './articles';
export { blogPosts } from './posts';
export { categoryColors, defaultCategoryColor, articleSlugs, categories } from './constants';
