/**
 * Documentation data barrel export
 *
 * @example
 * ```ts
 * import { docArticles, docCategories } from '@/data/docs';
 * ```
 *
 * @since v0.9.26
 */

export type { DocArticleData, DocCategory, DocCategoryArticle } from './types';
export { docArticles } from './articles';
export {
  docCategories,
  apiOverview,
  securityTable,
  apiEndpointGroups,
  methodColors,
  defaultMethodColor,
} from './categories';
