/**
 * BBCode tag definitions
 *
 * Combines basic and formatting tag sets into a single array.
 */

import type { BBCodeTag } from './types';
import { basicTags } from './tags-basic';
import { formattingTags } from './tags-formatting';

/** All BBCode tags combined */
export const bbcodeTags: BBCodeTag[] = [...basicTags, ...formattingTags];
