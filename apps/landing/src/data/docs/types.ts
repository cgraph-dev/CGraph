/**
 * Documentation content types
 *
 * Used by both Documentation.tsx (index) and DocArticle.tsx (full article).
 *
 * @since v0.9.26
 */

/** Full documentation article data including HTML content */
export interface DocArticleData {
  readonly title: string;
  readonly category: string;
  readonly categoryIcon: string;
  readonly categoryColor: string;
  readonly readTime: string;
  readonly content: string;
}

/** Documentation category with articles list */
export interface DocCategory {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly color: string;
  readonly description: string;
  readonly articles: readonly DocCategoryArticle[];
}

/** Article entry within a category listing */
export interface DocCategoryArticle {
  readonly title: string;
  readonly time: string;
}
