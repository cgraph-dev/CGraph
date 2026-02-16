/**
 * Blog content types — single source of truth
 *
 * Used by both Blog.tsx (listing) and BlogArticle.tsx (full article).
 * To add a new blog post, create an entry in posts.ts and articles.ts.
 *
 * @since v0.9.26
 */

/** Full blog article data including HTML content */
export interface BlogArticleData {
  readonly title: string;
  readonly category: string;
  readonly author: string;
  readonly date: string;
  readonly readTime: string;
  readonly image: string;
  readonly tags: readonly string[];
  readonly content: string;
}

/** Blog post listing metadata (no content — used for index page cards) */
export interface BlogPost {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly category: string;
  readonly author: string;
  readonly date: string;
  readonly readTime: string;
  readonly featured: boolean;
  readonly image: string;
  readonly tags: readonly string[];
}

/** Category color mapping */
export interface CategoryColor {
  readonly bg: string;
  readonly text: string;
}
