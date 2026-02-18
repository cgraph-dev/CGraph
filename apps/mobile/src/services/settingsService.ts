/**
 * Settings Service
 *
 * Backend API integration for settings-related screens:
 * - Account settings
 * - Notification preferences
 * - Avatar/Profile customization
 * - UI Customization
 * - RSS Feeds
 * - Custom Emoji management
 *
 * @module services/settingsService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== FORM DATA FILE TYPE ====================

/**
 * File object for FormData uploads in React Native.
 * This is the format expected by React Native's FormData.append().
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

// ==================== TYPES ====================

export interface AccountInfo {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
  subscriptionTier: 'free' | 'plus' | 'pro' | 'business' | 'enterprise';
  subscriptionExpiresAt: string | null;
}

export interface UpdateAccountRequest {
  email?: string;
  username?: string;
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AvatarSettings {
  url: string | null;
  borderStyle: string;
  borderColor: string | null;
  animationEnabled: boolean;
  frameId: string | null;
  badgeId: string | null;
}

export interface AvatarFrame {
  id: string;
  name: string;
  imageUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';
  unlocked: boolean;
  requiredLevel?: number;
  requiredAchievement?: string;
}

export interface AvatarBadge {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  unlocked: boolean;
}

export interface ChatBubbleSettings {
  style: 'default' | 'rounded' | 'sharp' | 'bubble' | 'minimal';
  color: string | null;
  gradient: [string, string] | null;
  opacity: number;
  showTimestamp: boolean;
  compactMode: boolean;
}

export interface CustomEmoji {
  id: string;
  shortcode: string;
  imageUrl: string;
  animated: boolean;
  category: string;
  createdAt: string;
  usageCount: number;
}

export interface EmojiPack {
  id: string;
  name: string;
  description: string;
  emojis: CustomEmoji[];
  createdBy: string;
  isPublic: boolean;
  subscriberCount: number;
  subscribed: boolean;
}

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  lastFetchedAt: string | null;
  itemCount: number;
  enabled: boolean;
  notifyOnNew: boolean;
}

export interface RssFeedItem {
  id: string;
  feedId: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  read: boolean;
  saved: boolean;
}

export interface UICustomization {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  glassIntensity: number;
  particleEffects: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
  hapticFeedback: boolean;
  soundEffects: boolean;
}

export interface NotificationPreference {
  channel: string;
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  platform: string;
  lastActiveAt: string;
  ipAddress: string;
  location: string | null;
  isCurrent: boolean;
}

// ==================== ACCOUNT API ====================

/**
 * Get current user's account info
 */
export async function getAccountInfo(): Promise<AccountInfo> {
  const response = await api.get('/api/v1/users/me/account');
  return transformAccountInfo(response.data.data || response.data);
}

/**
 * Update account information
 */
export async function updateAccount(data: UpdateAccountRequest): Promise<AccountInfo> {
  const response = await api.patch('/api/v1/users/me/account', {
    email: data.email,
    username: data.username,
    display_name: data.displayName,
    current_password: data.currentPassword,
    new_password: data.newPassword,
  });
  return transformAccountInfo(response.data.data || response.data);
}

/**
 * Get active device sessions
 */
export async function getDeviceSessions(): Promise<DeviceSession[]> {
  const response = await api.get('/api/v1/users/me/sessions');
  return (response.data.data || response.data.sessions || []).map(transformDeviceSession);
}

/**
 * Revoke a device session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete(`/api/v1/users/me/sessions/${sessionId}`);
}

/**
 * Revoke all other sessions
 */
export async function revokeAllOtherSessions(): Promise<void> {
  await api.post('/api/v1/users/me/sessions/revoke-all');
}

/**
 * Request account deletion
 */
export async function requestAccountDeletion(password: string): Promise<void> {
  await api.post('/api/v1/users/me/delete-request', { password });
}

/**
 * Export user data (GDPR)
 */
export async function exportUserData(): Promise<{ downloadUrl: string; expiresAt: string }> {
  const response = await api.post('/api/v1/users/me/export');
  return response.data.data || response.data;
}

// ==================== AVATAR API ====================

/**
 * Get avatar settings
 */
export async function getAvatarSettings(): Promise<AvatarSettings> {
  const response = await api.get('/api/v1/users/me/avatar');
  return transformAvatarSettings(response.data.data || response.data);
}

/**
 * Update avatar settings
 */
export async function updateAvatarSettings(
  settings: Partial<AvatarSettings>
): Promise<AvatarSettings> {
  const response = await api.patch('/api/v1/users/me/avatar', {
    border_style: settings.borderStyle,
    border_color: settings.borderColor,
    animation_enabled: settings.animationEnabled,
    frame_id: settings.frameId,
    badge_id: settings.badgeId,
  });
  return transformAvatarSettings(response.data.data || response.data);
}

/**
 * Upload new avatar image
 */
export async function uploadAvatar(file: {
  uri: string;
  type: string;
  name: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file as unknown as Blob);

  const response = await api.post('/api/v1/users/me/avatar/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data?.url || response.data.url;
}

/**
 * Get available avatar frames
 */
export async function getAvatarFrames(): Promise<AvatarFrame[]> {
  const response = await api.get('/api/v1/users/me/avatar/frames');
  return (response.data.data || response.data.frames || []).map(transformAvatarFrame);
}

/**
 * Get available avatar badges
 */
export async function getAvatarBadges(): Promise<AvatarBadge[]> {
  const response = await api.get('/api/v1/users/me/avatar/badges');
  return (response.data.data || response.data.badges || []).map(transformAvatarBadge);
}

// ==================== CHAT BUBBLE API ====================

/**
 * Get chat bubble settings
 */
export async function getChatBubbleSettings(): Promise<ChatBubbleSettings> {
  const response = await api.get('/api/v1/users/me/chat-bubble');
  return transformChatBubbleSettings(response.data.data || response.data);
}

/**
 * Update chat bubble settings
 */
export async function updateChatBubbleSettings(
  settings: Partial<ChatBubbleSettings>
): Promise<ChatBubbleSettings> {
  const response = await api.patch('/api/v1/users/me/chat-bubble', {
    style: settings.style,
    color: settings.color,
    gradient: settings.gradient,
    opacity: settings.opacity,
    show_timestamp: settings.showTimestamp,
    compact_mode: settings.compactMode,
  });
  return transformChatBubbleSettings(response.data.data || response.data);
}

// ==================== CUSTOM EMOJI API ====================

/**
 * Get user's custom emojis
 */
export async function getCustomEmojis(): Promise<CustomEmoji[]> {
  const response = await api.get('/api/v1/users/me/emojis');
  return (response.data.data || response.data.emojis || []).map(transformCustomEmoji);
}

/**
 * Upload custom emoji
 */
export async function uploadCustomEmoji(
  file: { uri: string; type: string; name: string },
  shortcode: string,
  category: string
): Promise<CustomEmoji> {
  const formData = new FormData();
  formData.append('image', file as unknown as Blob);
  formData.append('shortcode', shortcode);
  formData.append('category', category);

  const response = await api.post('/api/v1/users/me/emojis', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return transformCustomEmoji(response.data.data || response.data);
}

/**
 * Delete custom emoji
 */
export async function deleteCustomEmoji(emojiId: string): Promise<void> {
  await api.delete(`/api/v1/users/me/emojis/${emojiId}`);
}

/**
 * Get available emoji packs
 */
export async function getEmojiPacks(): Promise<EmojiPack[]> {
  const response = await api.get('/api/v1/emoji-packs');
  return (response.data.data || response.data.packs || []).map(transformEmojiPack);
}

/**
 * Subscribe to emoji pack
 */
export async function subscribeToEmojiPack(packId: string): Promise<void> {
  await api.post(`/api/v1/emoji-packs/${packId}/subscribe`);
}

/**
 * Unsubscribe from emoji pack
 */
export async function unsubscribeFromEmojiPack(packId: string): Promise<void> {
  await api.delete(`/api/v1/emoji-packs/${packId}/subscribe`);
}

// ==================== RSS FEEDS API ====================

/**
 * Get user's RSS feeds
 */
export async function getRssFeeds(): Promise<RssFeed[]> {
  const response = await api.get('/api/v1/users/me/rss-feeds');
  return (response.data.data || response.data.feeds || []).map(transformRssFeed);
}

/**
 * Add RSS feed
 */
export async function addRssFeed(url: string): Promise<RssFeed> {
  const response = await api.post('/api/v1/users/me/rss-feeds', { url });
  return transformRssFeed(response.data.data || response.data);
}

/**
 * Update RSS feed settings
 */
export async function updateRssFeed(feedId: string, settings: Partial<RssFeed>): Promise<RssFeed> {
  const response = await api.patch(`/api/v1/users/me/rss-feeds/${feedId}`, {
    enabled: settings.enabled,
    notify_on_new: settings.notifyOnNew,
  });
  return transformRssFeed(response.data.data || response.data);
}

/**
 * Remove RSS feed
 */
export async function removeRssFeed(feedId: string): Promise<void> {
  await api.delete(`/api/v1/users/me/rss-feeds/${feedId}`);
}

/**
 * Get RSS feed items
 */
export async function getRssFeedItems(
  feedId: string,
  options?: { limit?: number; offset?: number }
): Promise<RssFeedItem[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  };
  const response = await api.get(`/api/v1/users/me/rss-feeds/${feedId}/items`, { params });
  return (response.data.data || response.data.items || []).map(transformRssFeedItem);
}

/**
 * Get all RSS feed items (aggregated)
 */
export async function getAllRssFeedItems(options?: {
  limit?: number;
  offset?: number;
}): Promise<RssFeedItem[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  };
  const response = await api.get('/api/v1/users/me/rss-feeds/items', { params });
  return (response.data.data || response.data.items || []).map(transformRssFeedItem);
}

/**
 * Mark RSS item as read
 */
export async function markRssItemRead(itemId: string): Promise<void> {
  await api.post(`/api/v1/rss-items/${itemId}/read`);
}

/**
 * Toggle RSS item saved status
 */
export async function toggleRssItemSaved(itemId: string): Promise<boolean> {
  const response = await api.post(`/api/v1/rss-items/${itemId}/save`);
  return response.data.data?.saved ?? response.data.saved;
}

// ==================== UI CUSTOMIZATION API ====================

/**
 * Get UI customization settings
 */
export async function getUICustomization(): Promise<UICustomization> {
  const response = await api.get('/api/v1/users/me/ui-customization');
  return transformUICustomization(response.data.data || response.data);
}

/**
 * Update UI customization settings
 */
export async function updateUICustomization(
  settings: Partial<UICustomization>
): Promise<UICustomization> {
  const response = await api.patch('/api/v1/users/me/ui-customization', {
    primary_color: settings.primaryColor,
    accent_color: settings.accentColor,
    font_family: settings.fontFamily,
    border_radius: settings.borderRadius,
    glass_intensity: settings.glassIntensity,
    particle_effects: settings.particleEffects,
    animation_speed: settings.animationSpeed,
    haptic_feedback: settings.hapticFeedback,
    sound_effects: settings.soundEffects,
  });
  return transformUICustomization(response.data.data || response.data);
}

// ==================== NOTIFICATION PREFERENCES API ====================

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const response = await api.get('/api/v1/users/me/notification-preferences');
  return (response.data.data || response.data.preferences || []).map(
    transformNotificationPreference
  );
}

/**
 * Update notification preference
 */
export async function updateNotificationPreference(
  channel: string,
  settings: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  const response = await api.patch(`/api/v1/users/me/notification-preferences/${channel}`, {
    enabled: settings.enabled,
    sound: settings.sound,
    vibrate: settings.vibrate,
    priority: settings.priority,
  });
  return transformNotificationPreference(response.data.data || response.data);
}

// ==================== TRANSFORMERS ====================

/** API response type for transform functions */
/** API response data 2014 typed as any at the boundary, return types enforce safety */
type ApiData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function transformAccountInfo(data: ApiData): AccountInfo {
  return {
    id: data.id,
    email: data.email,
    username: data.username,
    displayName: data.display_name || data.displayName || null,
    emailVerified: data.email_verified ?? data.emailVerified ?? false,
    twoFactorEnabled: data.two_factor_enabled ?? data.twoFactorEnabled ?? false,
    createdAt: data.created_at || data.createdAt,
    lastLoginAt: data.last_login_at || data.lastLoginAt,
    subscriptionTier: data.subscription_tier || data.subscriptionTier || 'free',
    subscriptionExpiresAt: data.subscription_expires_at || data.subscriptionExpiresAt || null,
  };
}

function transformDeviceSession(data: ApiData): DeviceSession {
  return {
    id: data.id,
    deviceName: data.device_name || data.deviceName || 'Unknown Device',
    deviceType: data.device_type || data.deviceType || 'unknown',
    platform: data.platform || 'unknown',
    lastActiveAt: data.last_active_at || data.lastActiveAt,
    ipAddress: data.ip_address || data.ipAddress || '',
    location: data.location || null,
    isCurrent: data.is_current ?? data.isCurrent ?? false,
  };
}

function transformAvatarSettings(data: ApiData): AvatarSettings {
  return {
    url: data.url || data.avatar_url || null,
    borderStyle: data.border_style || data.borderStyle || 'default',
    borderColor: data.border_color || data.borderColor || null,
    animationEnabled: data.animation_enabled ?? data.animationEnabled ?? true,
    frameId: data.frame_id || data.frameId || null,
    badgeId: data.badge_id || data.badgeId || null,
  };
}

function transformAvatarFrame(data: ApiData): AvatarFrame {
  return {
    id: data.id,
    name: data.name,
    imageUrl: data.image_url || data.imageUrl,
    rarity: data.rarity || 'common',
    unlocked: data.unlocked ?? true,
    requiredLevel: data.required_level || data.requiredLevel,
    requiredAchievement: data.required_achievement || data.requiredAchievement,
  };
}

function transformAvatarBadge(data: ApiData): AvatarBadge {
  return {
    id: data.id,
    name: data.name,
    imageUrl: data.image_url || data.imageUrl,
    description: data.description || '',
    unlocked: data.unlocked ?? true,
  };
}

function transformChatBubbleSettings(data: ApiData): ChatBubbleSettings {
  return {
    style: data.style || 'default',
    color: data.color || null,
    gradient: data.gradient || null,
    opacity: data.opacity ?? 1,
    showTimestamp: data.show_timestamp ?? data.showTimestamp ?? true,
    compactMode: data.compact_mode ?? data.compactMode ?? false,
  };
}

function transformCustomEmoji(data: ApiData): CustomEmoji {
  return {
    id: data.id,
    shortcode: data.shortcode,
    imageUrl: data.image_url || data.imageUrl,
    animated: data.animated ?? false,
    category: data.category || 'custom',
    createdAt: data.created_at || data.createdAt,
    usageCount: data.usage_count ?? data.usageCount ?? 0,
  };
}

function transformEmojiPack(data: ApiData): EmojiPack {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    emojis: (data.emojis || []).map(transformCustomEmoji),
    createdBy: data.created_by || data.createdBy,
    isPublic: data.is_public ?? data.isPublic ?? true,
    subscriberCount: data.subscriber_count ?? data.subscriberCount ?? 0,
    subscribed: data.subscribed ?? false,
  };
}

function transformRssFeed(data: ApiData): RssFeed {
  return {
    id: data.id,
    title: data.title || 'Untitled Feed',
    url: data.url,
    description: data.description || null,
    iconUrl: data.icon_url || data.iconUrl || null,
    lastFetchedAt: data.last_fetched_at || data.lastFetchedAt || null,
    itemCount: data.item_count ?? data.itemCount ?? 0,
    enabled: data.enabled ?? true,
    notifyOnNew: data.notify_on_new ?? data.notifyOnNew ?? true,
  };
}

function transformRssFeedItem(data: ApiData): RssFeedItem {
  return {
    id: data.id,
    feedId: data.feed_id || data.feedId,
    title: data.title,
    description: data.description || null,
    url: data.url,
    imageUrl: data.image_url || data.imageUrl || null,
    publishedAt: data.published_at || data.publishedAt,
    read: data.read ?? false,
    saved: data.saved ?? false,
  };
}

function transformUICustomization(data: ApiData): UICustomization {
  return {
    primaryColor: data.primary_color || data.primaryColor || '#6366f1',
    accentColor: data.accent_color || data.accentColor || '#8b5cf6',
    fontFamily: data.font_family || data.fontFamily || 'System',
    borderRadius: data.border_radius || data.borderRadius || 'medium',
    glassIntensity: data.glass_intensity ?? data.glassIntensity ?? 0.5,
    particleEffects: data.particle_effects ?? data.particleEffects ?? true,
    animationSpeed: data.animation_speed || data.animationSpeed || 'normal',
    hapticFeedback: data.haptic_feedback ?? data.hapticFeedback ?? true,
    soundEffects: data.sound_effects ?? data.soundEffects ?? true,
  };
}

function transformNotificationPreference(data: ApiData): NotificationPreference {
  return {
    channel: data.channel,
    enabled: data.enabled ?? true,
    sound: data.sound ?? true,
    vibrate: data.vibrate ?? true,
    priority: data.priority || 'normal',
  };
}
