// =============================================================================
// Forum Customization Types
//
// Shared types for the 55-option customization engine.
// =============================================================================

/**
 * 8 customization categories matching the backend constant.
 */
export type CustomizationCategory =
  | 'appearance'
  | 'layout'
  | 'header_and_branding'
  | 'sidebar_widgets'
  | 'post_and_thread_display'
  | 'custom_fields'
  | 'reputation_and_ranks'
  | 'custom_css_and_advanced';

/**
 * All 8 customization category keys.
 */
export const CUSTOMIZATION_CATEGORIES: CustomizationCategory[] = [
  'appearance',
  'layout',
  'header_and_branding',
  'sidebar_widgets',
  'post_and_thread_display',
  'custom_fields',
  'reputation_and_ranks',
  'custom_css_and_advanced',
];

// =============================================================================
// OPTION VALUES BY CATEGORY
// =============================================================================

export interface AppearanceOptions {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  link_color: string;
  font_family: string;
  header_font_family: string;
  font_size_base: string;
  border_radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  content_width: string;
  dark_mode: boolean;
}

export interface LayoutOptions {
  sidebar_position: 'left' | 'right' | 'none';
  header_style: 'standard' | 'compact' | 'banner' | 'minimal';
  thread_layout: 'classic' | 'cards' | 'compact';
  post_layout: 'classic' | 'modern' | 'minimal';
  category_layout: 'table' | 'grid' | 'list';
  board_layout: 'table' | 'grid' | 'list';
  sticky_header: boolean;
  show_breadcrumbs: boolean;
}

export interface HeaderAndBrandingOptions {
  logo_url: string | null;
  header_background_url: string | null;
  header_background_color: string;
  title_font: string;
  subtitle_text: string;
  favicon_url: string | null;
}

export interface SidebarWidgetOptions {
  widget_statistics: boolean;
  widget_recent_threads: boolean;
  widget_online_users: boolean;
  widget_leaderboard: boolean;
  widget_poll: boolean;
  widget_custom_html: boolean;
  widget_order: string[];
  widget_visibility: Record<string, boolean>;
}

export interface PostAndThreadDisplayOptions {
  post_template: 'classic' | 'modern' | 'compact';
  show_rank_images: boolean;
  show_badges: boolean;
  show_signature: boolean;
  max_signature_length: number;
  bbcode_in_signatures: boolean;
  posts_per_page: number;
  thread_preview_length: number;
}

export interface CustomFieldsOptions {
  profile_custom_fields: boolean;
  thread_custom_fields: boolean;
  post_custom_fields: boolean;
}

export interface ReputationAndRanksOptions {
  karma_name: string;
  upvote_label: string;
  downvote_label: string;
  rank_thresholds: RankThreshold[];
  rank_images: Record<string, string>;
  show_reputation: boolean;
}

export interface CustomCssAndAdvancedOptions {
  custom_css: string;
  custom_header_html: string;
  custom_footer_html: string;
  custom_js_enabled: boolean;
}

/**
 * Complete forum customization options — 55 options across 8 categories.
 */
export interface ForumCustomizationOptions {
  appearance: AppearanceOptions;
  layout: LayoutOptions;
  header_and_branding: HeaderAndBrandingOptions;
  sidebar_widgets: SidebarWidgetOptions;
  post_and_thread_display: PostAndThreadDisplayOptions;
  custom_fields: CustomFieldsOptions;
  reputation_and_ranks: ReputationAndRanksOptions;
  custom_css_and_advanced: CustomCssAndAdvancedOptions;
}

// =============================================================================
// CUSTOM FIELD
// =============================================================================

export type CustomFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'url';
export type CustomFieldTarget = 'thread' | 'post' | 'profile';

export interface CustomField {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  target: CustomFieldTarget;
  options: string[];
  required: boolean;
  position: number;
  visibleTo: 'all' | 'members' | 'mods' | 'admins';
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  forumId: string;
  insertedAt?: string;
  updatedAt?: string;
}

// =============================================================================
// THEME PRESETS
// =============================================================================

export type ForumThemePresetKey =
  | 'dark-elite'
  | 'cyberpunk'
  | 'classic-mybb'
  | 'forest'
  | 'ocean'
  | 'sunset'
  | 'neon'
  | 'monochrome'
  | 'custom';

export interface ForumThemePreset {
  key: ForumThemePresetKey;
  name: string;
  colors: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
    link_color: string;
  };
}

// =============================================================================
// RANK & REPUTATION
// =============================================================================

export interface RankThreshold {
  name: string;
  minPulse: number;
  imageUrl: string;
}

// =============================================================================
// WIDGET CONFIG
// =============================================================================

export interface WidgetConfig {
  key: string;
  enabled: boolean;
  position: number;
  settings: Record<string, unknown>;
}

// =============================================================================
// BADGE CONFIG
// =============================================================================

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: 'manual' | 'post_count' | 'karma' | 'registration_age';
  threshold: number;
  color: string;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Check whether a string is a valid customization category. */
export function isCustomizationCategory(value: string): value is CustomizationCategory {
  return CUSTOMIZATION_CATEGORIES.some((c) => c === value);
}

/** Check whether a string is a valid custom field type. */
export function isCustomFieldType(value: string): value is CustomFieldType {
  return ['text', 'number', 'select', 'checkbox', 'date', 'url'].includes(value);
}

/** Check whether a string is a valid custom field target. */
export function isCustomFieldTarget(value: string): value is CustomFieldTarget {
  return ['thread', 'post', 'profile'].includes(value);
}

/** Check whether a string is a valid forum theme preset key. */
export function isForumThemePresetKey(value: string): value is ForumThemePresetKey {
  return [
    'dark-elite',
    'cyberpunk',
    'classic-mybb',
    'forest',
    'ocean',
    'sunset',
    'neon',
    'monochrome',
    'custom',
  ].includes(value);
}
