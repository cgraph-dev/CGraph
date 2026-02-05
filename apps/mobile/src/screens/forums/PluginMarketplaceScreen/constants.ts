/**
 * PluginMarketplaceScreen Constants
 */

import { CategoryConfig } from './types';

export const CATEGORIES: CategoryConfig[] = [
  { key: 'moderation', label: 'Moderation', icon: 'shield-checkmark-outline' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
  { key: 'automation', label: 'Automation', icon: 'flash-outline' },
  { key: 'content', label: 'Content', icon: 'document-text-outline' },
  { key: 'integration', label: 'Integrations', icon: 'git-network-outline' },
  { key: 'customization', label: 'Customize', icon: 'color-palette-outline' },
  { key: 'games', label: 'Games', icon: 'game-controller-outline' },
  { key: 'utility', label: 'Utility', icon: 'construct-outline' },
];

export const ALL_CATEGORY: CategoryConfig = { key: null, label: 'All', icon: 'apps-outline' };
