/**
 * Blog Module Types
 *
 * Type definitions for the company blog page components.
 *
 * @module pages/company/blog
 * @since v0.9.6
 */

export interface BlogPost {
  /** Unique post identifier */
  id: number;
  /** Post title */
  title: string;
  /** Short excerpt/summary */
  excerpt: string;
  /** Category label (e.g., 'Engineering', 'Product') */
  category: string;
  /** Author display name */
  author: string;
  /** Published date string */
  date: string;
  /** Estimated reading time */
  readTime: string;
  /** Whether this post is featured prominently */
  featured: boolean;
  /** Hero image URL */
  image: string;
}

export interface NewsletterInfo {
  /** Number of subscribers (formatted string) */
  subscribers: string;
  /** Publishing frequency description */
  frequency: string;
}
