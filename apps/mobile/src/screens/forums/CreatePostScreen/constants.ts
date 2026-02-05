/**
 * CreatePostScreen constants
 */

import { Dimensions } from 'react-native';
import { PostTypeOption } from './types';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const MAX_TITLE_LENGTH = 300;

export const POST_TYPES: PostTypeOption[] = [
  { type: 'text', icon: 'document-text', label: 'Text', color: '#8B5CF6' },
  { type: 'link', icon: 'link', label: 'Link', color: '#3B82F6' },
  { type: 'image', icon: 'image', label: 'Image', color: '#10B981' },
  { type: 'poll', icon: 'stats-chart', label: 'Poll', color: '#F59E0B' },
];
