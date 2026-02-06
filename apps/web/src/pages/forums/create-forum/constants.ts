/**
 * Constants for CreateForum module
 */

import {
  ChatBubbleLeftRightIcon,
  PaintBrushIcon,
  CogIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { ForumCategory, StepInfo } from './types';

export const FORUM_CATEGORIES: ForumCategory[] = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'technology', label: 'Technology' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art & Design' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'other', label: 'Other' },
];

export const WIZARD_STEPS: StepInfo[] = [
  { num: 1, label: 'Basic Info', icon: ChatBubbleLeftRightIcon },
  { num: 2, label: 'Appearance', icon: PaintBrushIcon },
  { num: 3, label: 'Settings', icon: CogIcon },
  { num: 4, label: 'Confirm', icon: CheckCircleIcon },
];

export const DEFAULT_FORM_DATA = {
  name: '',
  slug: '',
  description: '',
  category: 'other',
  iconUrl: '',
  bannerUrl: '',
  primaryColor: '#1a73e8',
  isPublic: true,
  isNsfw: false,
  allowPosts: true,
  registrationOpen: true,
};

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 21;
export const SLUG_MAX_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 500;
