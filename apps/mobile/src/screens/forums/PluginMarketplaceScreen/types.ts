/**
 * PluginMarketplaceScreen Types
 */

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  version: string;
  author: {
    id: string;
    name: string;
    verified: boolean;
  };
  icon_url?: string;
  banner_url?: string;
  category: PluginCategory;
  tags: string[];
  rating: number;
  review_count: number;
  install_count: number;
  is_installed: boolean;
  is_official: boolean;
  is_premium: boolean;
  price?: number;
  updated_at: string;
  permissions: string[];
}

export type PluginCategory =
  | 'moderation'
  | 'analytics'
  | 'automation'
  | 'content'
  | 'integration'
  | 'customization'
  | 'games'
  | 'utility';

export type TabType = 'browse' | 'installed';

export interface CategoryConfig {
  key: PluginCategory | null;
  label: string;
  icon: string;
}
