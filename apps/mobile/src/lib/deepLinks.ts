/**
 * Deep Link Handler for CGraph Mobile
 *
 * Handles incoming deep links and universal links, routing them
 * to the appropriate screens in the app.
 *
 * ## Supported Link Patterns
 *
 * | Pattern | Screen | Example |
 * |---------|--------|---------|
 * | `/` | Home | `cgraph://` |
 * | `/conversation/:id` | Conversation | `cgraph://conversation/abc123` |
 * | `/group/:id` | Group | `cgraph://group/xyz789` |
 * | `/user/:id` | User Profile | `cgraph://user/user123` |
 * | `/settings` | Settings | `cgraph://settings` |
 * | `/thread/:id` | Forum Thread | `cgraph://thread/thread456` |
 * | `/invite/:code` | Group Invite | `cgraph://invite/ABC123` |
 * | `/auth/verify` | Email Verify | `cgraph://auth/verify?token=...` |
 * | `/auth/reset` | Password Reset | `cgraph://auth/reset?token=...` |
 *
 * ## Universal Links
 *
 * All paths also work with universal links:
 * - `https://cgraph.app/conversation/abc123`
 * - `https://www.cgraph.app/group/xyz789`
 *
 * @module DeepLinkHandler
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';

// Root navigation param list type
export type RootStackParamList = {
  // Auth Screens
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerify: { token: string };
  PasswordReset: { token: string };

  // Main App Screens
  Main: undefined;
  Home: undefined;
  Conversations: undefined;
  ConversationDetail: { conversationId: string };
  NewConversation: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  GroupSettings: { groupId: string };
  GroupInvite: { code: string };
  Profile: undefined;
  UserProfile: { userId: string };
  Settings: undefined;
  EditProfile: undefined;
  Notifications: undefined;

  // Forum Screens
  Forum: undefined;
  ForumCategory: { categoryId: string };
  ForumThread: { threadId: string };
  NewThread: { categoryId?: string };

  // Other Screens
  Search: { query?: string };
  MediaViewer: { mediaId: string };
  NotFound: undefined;
};

/**
 * Deep link prefixes for the app
 */
export const DEEP_LINK_PREFIXES = [
  // Custom scheme
  Linking.createURL('/'),
  // Universal links
  'https://cgraph.app',
  'https://www.cgraph.app',
  'https://staging.cgraph.app',
];

/**
 * Linking configuration for React Navigation
 */
export const linkingConfig: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    // Auth Flow
    Welcome: '',
    Login: 'login',
    Register: 'register',
    ForgotPassword: 'forgot-password',
    EmailVerify: 'auth/verify',
    PasswordReset: 'auth/reset',

    // Main App
    Main: {
      screens: {
        Home: 'home',
        Conversations: 'conversations',
        ConversationDetail: 'conversation/:conversationId',
        Groups: 'groups',
        GroupDetail: 'group/:groupId',
        Profile: 'profile',
        Settings: 'settings',
      },
    },

    // Direct routes
    ConversationDetail: 'conversation/:conversationId',
    NewConversation: 'conversation/new',
    GroupDetail: 'group/:groupId',
    GroupSettings: 'group/:groupId/settings',
    GroupInvite: 'invite/:code',
    UserProfile: 'user/:userId',
    EditProfile: 'profile/edit',
    Notifications: 'notifications',

    // Forum
    Forum: 'forum',
    ForumCategory: 'forum/category/:categoryId',
    ForumThread: 'thread/:threadId',
    NewThread: 'forum/new',

    // Search
    Search: 'search',

    // Media
    MediaViewer: 'media/:mediaId',

    // Fallback
    NotFound: '*',
  },
};

/**
 * Parse URL parameters from a deep link
 */
export function parseDeepLinkParams(url: string): Record<string, string | undefined> {
  try {
    const parsed = Linking.parse(url);
    const params: Record<string, string | undefined> = {};

    if (parsed.queryParams) {
      for (const [key, value] of Object.entries(parsed.queryParams)) {
        // Handle array values by taking first element
        params[key] = Array.isArray(value) ? value[0] : value;
      }
    }

    return params;
  } catch {
    return {};
  }
}

/**
 * Get the path from a deep link URL
 */
export function getDeepLinkPath(url: string): string {
  try {
    const parsed = Linking.parse(url);
    return parsed.path || '';
  } catch {
    return '';
  }
}

/**
 * Handle incoming deep link
 *
 * This can be used for custom handling before React Navigation
 * processes the link (e.g., analytics, validation)
 */
export async function handleDeepLink(
  url: string,
  navigation: { navigate: (screen: string, params?: object) => void }
): Promise<boolean> {
  try {
    const path = getDeepLinkPath(url);
    const params = parseDeepLinkParams(url);

    if (__DEV__) console.log('[DeepLink] Handling:', { url, path, params });

    // Handle special cases that need custom logic
    if (path.startsWith('invite/')) {
      const code = path.replace('invite/', '');
      // Could validate invite code before navigating
      navigation.navigate('GroupInvite', { code });
      return true;
    }

    if (path === 'auth/verify' && params.token) {
      navigation.navigate('EmailVerify', { token: params.token });
      return true;
    }

    if (path === 'auth/reset' && params.token) {
      navigation.navigate('PasswordReset', { token: params.token });
      return true;
    }

    // Let React Navigation handle the rest
    return false;
  } catch (error) {
    console.error('[DeepLink] Error handling link:', error);
    return false;
  }
}

/**
 * Create a shareable deep link for an entity
 */
export function createShareLink(
  type: 'conversation' | 'group' | 'user' | 'thread' | 'invite',
  id: string
): string {
  const baseUrl = 'https://cgraph.app';

  switch (type) {
    case 'conversation':
      return `${baseUrl}/conversation/${id}`;
    case 'group':
      return `${baseUrl}/group/${id}`;
    case 'user':
      return `${baseUrl}/user/${id}`;
    case 'thread':
      return `${baseUrl}/thread/${id}`;
    case 'invite':
      return `${baseUrl}/invite/${id}`;
    default:
      return baseUrl;
  }
}

/**
 * Open a deep link (for internal navigation)
 */
export async function openDeepLink(path: string): Promise<void> {
  const url = Linking.createURL(path);
  const canOpen = await Linking.canOpenURL(url);

  if (canOpen) {
    await Linking.openURL(url);
  } else {
    console.warn('[DeepLink] Cannot open URL:', url);
  }
}

/**
 * Get the initial URL that opened the app
 */
export async function getInitialDeepLink(): Promise<string | null> {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch {
    return null;
  }
}

/**
 * Subscribe to incoming deep links
 */
export function subscribeToDeepLinks(callback: (url: string) => void): () => void {
  const subscription = Linking.addEventListener('url', (event) => {
    callback(event.url);
  });

  return () => subscription.remove();
}

export default {
  prefixes: DEEP_LINK_PREFIXES,
  config: linkingConfig,
  parseParams: parseDeepLinkParams,
  getPath: getDeepLinkPath,
  handle: handleDeepLink,
  createShareLink,
  open: openDeepLink,
  getInitial: getInitialDeepLink,
  subscribe: subscribeToDeepLinks,
};
