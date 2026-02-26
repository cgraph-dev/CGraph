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
 * | `/messages` | ConversationList | `cgraph://messages` |
 * | `/conversation/:id` | Conversation | `cgraph://conversation/abc123` |
 * | `/group/:id` | Group | `cgraph://group/xyz789` |
 * | `/user/:id` | UserProfile | `cgraph://user/user123` |
 * | `/settings` | Settings | `cgraph://settings` |
 * | `/forum/:id` | Forum | `cgraph://forum/forum456` |
 * | `/forum/:id/post/:id` | Post | `cgraph://forum/dev/post/42` |
 * | `/login` | Login | `cgraph://login` |
 * | `/register` | Register | `cgraph://register` |
 * | `/premium` | Premium | `cgraph://premium` |
 * | `/gamification` | GamificationHub | `cgraph://gamification` |
 * | `/admin` | AdminDashboard | `cgraph://admin` |
 * | `/legal/privacy` | PrivacyPolicy | `cgraph://legal/privacy` |
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
import type { LinkingOptions } from '@react-navigation/native';

// Root navigation param list type (must mirror RootStackParamList from ../types)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
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
 *
 * Maps deep link URLs to the actual navigator tree:
 * Root → Auth | Main (tabs) → nested stacks
 */
export const linkingConfig: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    // ── Auth Flow (unauthenticated) ───────────────────
    Auth: {
      screens: {
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
      },
    },

    // ── Main App (authenticated) ──────────────────────
    Main: {
      screens: {
        // Messages tab
        MessagesTab: {
          screens: {
            ConversationList: 'messages',
            Conversation: 'conversation/:conversationId',
            NewConversation: 'conversation/new',
            SavedMessages: 'messages/saved',
          },
        },

        // Friends tab
        FriendsTab: {
          screens: {
            FriendList: 'friends',
            AddFriend: 'friends/add',
            FriendRequests: 'friends/requests',
            UserProfile: 'user/:userId',
            Leaderboard: 'friends/leaderboard',
          },
        },

        // Notifications tab
        NotificationsTab: {
          screens: {
            NotificationsInbox: 'notifications',
          },
        },

        // Search tab
        SearchTab: {
          screens: {
            SearchMain: 'search',
          },
        },

        // Groups tab
        GroupsTab: {
          screens: {
            GroupList: 'groups',
            Group: 'group/:groupId',
            Channel: 'group/:groupId/channel/:channelId',
            GroupSettings: 'group/:groupId/settings',
            GroupRoles: 'group/:groupId/roles',
            GroupMembers: 'group/:groupId/members',
            GroupChannels: 'group/:groupId/channels',
            GroupInvites: 'group/:groupId/invites',
            GroupModeration: 'group/:groupId/moderation',
          },
        },

        // Forums tab
        ForumsTab: {
          screens: {
            ForumList: 'forums',
            Forum: 'forum/:forumId',
            Post: 'forum/:forumId/post/:postId',
            CreatePost: 'forum/:forumId/post/new',
            CreateForum: 'forums/new',
            ForumBoard: 'forum/:forumId/board',
            ForumSettings: 'forum/:forumId/settings',
            ForumAdmin: 'forum/:forumId/admin',
            ForumLeaderboard: 'forums/leaderboard',
            PluginMarketplace: 'forums/plugins',
          },
        },

        // Settings tab
        SettingsTab: {
          screens: {
            Settings: 'settings',
            Profile: 'settings/profile',
            Account: 'settings/account',
            Appearance: 'settings/appearance',
            UICustomization: 'settings/ui-customization',
            ChatBubbles: 'settings/chat-bubbles',
            AvatarSettings: 'settings/avatar',
            Notifications: 'settings/notifications',
            EmailNotifications: 'settings/email-notifications',
            Privacy: 'settings/privacy',
            ProfileVisibility: 'settings/profile-visibility',
            Premium: 'premium',
            CoinShop: 'shop',
            Calendar: 'calendar',
            Referrals: 'referrals',
            GamificationHub: 'gamification',
            Achievements: 'gamification/achievements',
            Quests: 'gamification/quests',
            Leaderboard: 'leaderboard',
            Titles: 'gamification/titles',
            BadgeSelection: 'gamification/badges',
            TitleSelection: 'gamification/title-select',
            Customize: 'settings/customize',
            IdentityCustomization: 'settings/customize/identity',
            EffectsCustomization: 'settings/customize/effects',
            ProgressionCustomization: 'settings/customize/progression',
            HolographicDemo: 'settings/holographic-demo',
            RSSFeeds: 'settings/rss-feeds',
            CustomEmoji: 'settings/custom-emoji',
            MemberList: 'settings/members',
            WhosOnline: 'settings/online',
            E2EEVerification: 'settings/e2ee-verification',
            KeyVerification: 'settings/key-verification',
            AdminDashboard: 'admin',
            ForumReorder: 'admin/forum-reorder',
            ExportContent: 'settings/export',
            Sessions: 'settings/sessions',
            PrivacyPolicy: 'legal/privacy',
            TermsOfService: 'legal/terms',
            CookiePolicy: 'legal/cookies',
            GDPR: 'legal/gdpr',
          },
        },
      },
    },

    // Special routes
    // invite/:code is handled manually in handleDeepLink()
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

    // eslint-disable-next-line no-console
    if (__DEV__) console.log('[DeepLink] Handling:', { url, path, params });

    // Handle special cases that need custom logic
    if (path.startsWith('invite/')) {
      const code = path.replace('invite/', '');
      // Group invites navigate into the Groups tab's invite acceptance flow
      // TODO: Add a dedicated GroupInviteAccept screen when invite flow is built
       
      navigation.navigate('Main', {
        screen: 'GroupsTab',
        params: { screen: 'GroupInvites', params: { code } },
      } as object);
      return true;
    }

    // Let React Navigation handle the rest via linkingConfig
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
    return await Linking.getInitialURL();
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
