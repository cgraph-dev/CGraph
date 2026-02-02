/**
 * Store Facades Test Suite
 *
 * Tests the facade pattern implementation that consolidates
 * 29 Zustand stores into 7 domain facades.
 *
 * @module stores/facades/__tests__/facades.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Import facades
import {
  useAuthFacade,
  useChatFacade,
  useCommunityFacade,
  useGamificationFacade,
  useSettingsFacade,
  useMarketplaceFacade,
  useUIFacade,
} from '../index';

// Mock all the underlying stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-1', username: 'testuser' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    updateUser: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: vi.fn(() => ({
    myProfile: { id: 'user-1', username: 'testuser', displayName: 'Test User' },
    isLoadingProfile: false,
    profileError: null,
    mySignature: null,
    fetchProfile: vi.fn(),
    fetchMyProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    uploadBanner: vi.fn(),
  })),
}));

vi.mock('@/stores/friendStore', () => ({
  useFriendStore: vi.fn(() => ({
    friends: [{ id: 'friend-1', username: 'friend1' }],
    pendingRequests: [],
    sentRequests: [],
    isLoading: false,
    fetchFriends: vi.fn(),
    fetchPendingRequests: vi.fn(),
    sendRequest: vi.fn(),
    acceptRequest: vi.fn(),
    declineRequest: vi.fn(),
    removeFriend: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  })),
}));

vi.mock('@/stores/chatStore', () => ({
  useChatStore: vi.fn(() => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    typingUsers: {},
    fetchConversations: vi.fn(),
    fetchMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    setActiveConversation: vi.fn(),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
  })),
}));

vi.mock('@/stores/chatEffectsStore', () => ({
  useChatEffectsStore: vi.fn(() => ({
    activeMessageEffect: null,
    activeBubbleStyle: null,
    activeTypingIndicator: 'dots',
    soundsEnabled: true,
    setMessageEffect: vi.fn(),
    setBubbleStyle: vi.fn(),
    activateEffect: vi.fn(),
    toggleSounds: vi.fn(),
    playSound: vi.fn(),
  })),
}));

vi.mock('@/stores/chatBubbleStore', () => ({
  useChatBubbleStore: vi.fn(() => ({
    style: { ownMessageBg: '#10b981' },
    updateStyle: vi.fn(),
    resetStyle: vi.fn(),
    applyPreset: vi.fn(),
  })),
}));

// Module path mocks - facades now import from module locations
vi.mock('@/modules/chat/store', () => ({
  useChatStore: vi.fn(() => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    typingUsers: {},
    typingUsersInfo: {},
    isLoadingMessages: false,
    isLoadingConversations: false,
    hasMoreMessages: false,
    scheduledMessages: [],
    setActiveConversation: vi.fn(),
    sendMessage: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    fetchMessages: vi.fn(),
    fetchConversations: vi.fn(),
    markAsRead: vi.fn(),
    createConversation: vi.fn(),
    addReaction: vi.fn(),
    removeReaction: vi.fn(),
    scheduleMessage: vi.fn(),
    cancelScheduledMessage: vi.fn(),
    rescheduleMessage: vi.fn(),
  })),
  useChatEffectsStore: vi.fn(() => ({
    effects: {},
    bubbleStyles: {},
    activeMessageEffect: null,
    activeBubbleStyle: null,
    activeTypingIndicator: null,
    soundsEnabled: true,
    setMessageEffect: vi.fn(),
    setBubbleStyle: vi.fn(),
    activateEffect: vi.fn(),
    toggleSounds: vi.fn(),
    playSound: vi.fn(),
    clearEffects: vi.fn(),
  })),
  useChatBubbleStore: vi.fn(() => ({
    style: { ownMessageBg: '#10b981' },
    updateStyle: vi.fn(),
    resetStyle: vi.fn(),
    applyPreset: vi.fn(),
  })),
}));

vi.mock('@/stores/incomingCallStore', () => ({
  useIncomingCallStore: vi.fn(() => ({
    incomingCall: null,
    setIncomingCall: vi.fn(),
    acceptCall: vi.fn(),
    declineCall: vi.fn(),
  })),
}));

vi.mock('@/stores/forumStore', () => ({
  useForumStore: vi.fn(() => ({
    forums: [],
    currentForum: null,
    posts: [],
    currentPost: null,
    isLoadingForums: false,
    isLoadingPosts: false,
    fetchForums: vi.fn(),
    fetchForum: vi.fn(),
    fetchPosts: vi.fn(),
    fetchPost: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
    createComment: vi.fn(),
    vote: vi.fn(),
    voteForum: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
}));

// Module path mocks for forums, groups, moderation
vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn(() => ({
    forums: [],
    currentForum: null,
    posts: [],
    currentPost: null,
    isLoadingForums: false,
    isLoadingPosts: false,
    fetchForums: vi.fn(),
    fetchForum: vi.fn(),
    fetchPosts: vi.fn(),
    fetchPost: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
    createComment: vi.fn(),
    vote: vi.fn(),
    voteForum: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  useForumHostingStore: vi.fn(() => ({
    boards: [],
    threads: [],
    fetchBoards: vi.fn(),
    fetchThreads: vi.fn(),
  })),
  useAnnouncementStore: vi.fn(() => ({
    announcements: [],
    getUnreadCount: vi.fn(() => 0),
    fetchAnnouncements: vi.fn(),
    markAsRead: vi.fn(),
  })),
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn(() => ({
    groups: [],
    activeGroupId: null,
    isLoadingGroups: false,
    fetchGroups: vi.fn(),
    fetchGroup: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    leaveGroup: vi.fn(),
  })),
}));

vi.mock('@/modules/moderation/store', () => ({
  useModerationStore: vi.fn(() => ({
    queue: [],
    queueCounts: { pending: 0, approved: 0, rejected: 0 },
    bans: [],
    isLoadingBans: false,
    banUser: vi.fn(),
    liftBan: vi.fn(),
    fetchBans: vi.fn(),
    issueWarning: vi.fn(),
  })),
}));

vi.mock('@/stores/groupStore', () => ({
  useGroupStore: vi.fn(() => ({
    groups: [],
    activeGroupId: null,
    isLoadingGroups: false,
    fetchGroups: vi.fn(),
    fetchGroup: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    leaveGroup: vi.fn(),
  })),
}));

vi.mock('@/stores/moderationStore', () => ({
  useModerationStore: vi.fn(() => ({
    queue: [],
    queueCounts: { pending: 0, flagged: 0, reported: 0 },
    bans: [],
    isLoadingBans: false,
    banUser: vi.fn(),
    liftBan: vi.fn(),
    fetchBans: vi.fn(),
    issueWarning: vi.fn(),
  })),
}));

vi.mock('@/stores/forumHostingStore', () => ({
  useForumHostingStore: vi.fn(() => ({
    boards: [],
    threads: [],
    fetchBoards: vi.fn(),
    fetchThreads: vi.fn(),
  })),
}));

vi.mock('@/stores/announcementStore', () => ({
  useAnnouncementStore: vi.fn(() => ({
    announcements: [],
    getUnreadCount: vi.fn(() => 0),
    fetchAnnouncements: vi.fn(),
    markAsRead: vi.fn(),
  })),
}));

vi.mock('@/stores/gamificationStore', () => ({
  useGamificationStore: vi.fn(() => ({
    level: 5,
    xp: 1500,
    xpToNextLevel: 2000,
    achievements: [],
    quests: [],
    streak: 7,
    isLoading: false,
    fetchGamificationData: vi.fn(),
    claimReward: vi.fn(),
    completeQuest: vi.fn(),
    updateStreak: vi.fn(),
  })),
}));

vi.mock('@/stores/gamification/prestigeSlice', () => ({
  usePrestigeStore: vi.fn(() => ({
    prestige: { level: 0, totalXp: 0 },
    requirements: {},
    canPrestige: false,
    leaderboard: [],
    isPrestiging: false,
    fetchPrestige: vi.fn(),
    performPrestige: vi.fn(),
    getProgressPercent: vi.fn(() => 50),
    getXpWithBonus: vi.fn((xp: number) => xp),
  })),
}));

vi.mock('@/stores/seasonalEventStore', () => ({
  useSeasonalEventStore: vi.fn(() => ({
    activeEvents: [],
    featuredEvent: null,
    currentEvent: null,
    currentProgress: null,
    leaderboard: [],
    isLoading: false,
    fetchEvents: vi.fn(),
    fetchEventDetails: vi.fn(),
    joinEvent: vi.fn(),
    claimReward: vi.fn(),
  })),
}));

vi.mock('@/stores/referralStore', () => ({
  useReferralStore: vi.fn(() => ({
    referralCode: { code: 'ABC123', url: 'https://example.com/ref/ABC123' },
    stats: { totalReferrals: 5, pendingRewards: 2 },
    referrals: [],
    fetchReferralCode: vi.fn(),
    regenerateCode: vi.fn(),
    claimReward: vi.fn(),
  })),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: { theme: 'dark', notifications: true },
    isLoading: false,
    fetchSettings: vi.fn(),
    updateNotificationSettings: vi.fn(),
    updatePrivacySettings: vi.fn(),
    updateAppearanceSettings: vi.fn(),
    updateLocaleSettings: vi.fn(),
    updateKeyboardSettings: vi.fn(),
    updateAllSettings: vi.fn(),
    resetToDefaults: vi.fn(),
    getTheme: vi.fn(() => 'dark'),
    getShouldReduceMotion: vi.fn(() => false),
  })),
}));

// Module path mocks for gamification and settings
vi.mock('@/modules/gamification/store', () => ({
  useGamificationStore: vi.fn(() => ({
    level: 5,
    xp: 1500,
    xpToNextLevel: 2000,
    achievements: [],
    quests: [],
    streak: 7,
    isLoading: false,
    fetchGamificationData: vi.fn(),
    claimReward: vi.fn(),
    completeQuest: vi.fn(),
    updateStreak: vi.fn(),
  })),
  usePrestigeStore: vi.fn(() => ({
    prestige: { level: 0, totalXp: 0 },
    requirements: {},
    canPrestige: false,
    leaderboard: [],
    isPrestiging: false,
    fetchPrestige: vi.fn(),
    performPrestige: vi.fn(),
    getProgressPercent: vi.fn(() => 50),
    getXpWithBonus: vi.fn((xp: number) => xp),
  })),
  useSeasonalEventStore: vi.fn(() => ({
    activeEvents: [],
    featuredEvent: null,
    currentEvent: null,
    currentProgress: null,
    leaderboard: [],
    isLoading: false,
    fetchEvents: vi.fn(),
    fetchEventDetails: vi.fn(),
    joinEvent: vi.fn(),
    claimReward: vi.fn(),
  })),
  useReferralStore: vi.fn(() => ({
    referralCode: { code: 'ABC123', url: 'https://example.com/ref/ABC123' },
    stats: { totalReferrals: 5, pendingRewards: 2 },
    referrals: [],
    fetchReferralCode: vi.fn(),
    regenerateCode: vi.fn(),
    claimReward: vi.fn(),
  })),
  useMarketplaceStore: vi.fn(() => ({
    listings: [],
    selectedListing: null,
    myListings: [],
    transactionHistory: [],
    stats: {},
    userTotals: {},
    filters: {},
    hasMore: false,
    isLoading: false,
    isCreating: false,
    isPurchasing: false,
    fetchListings: vi.fn(),
    fetchListing: vi.fn(),
    fetchMyListings: vi.fn(),
    fetchHistory: vi.fn(),
    createListing: vi.fn(),
    updateListing: vi.fn(),
    cancelListing: vi.fn(),
    purchaseListing: vi.fn(),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    getPriceRecommendation: vi.fn(),
  })),
}));

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: { theme: 'dark', notifications: true },
    isLoading: false,
    fetchSettings: vi.fn(),
    updateNotificationSettings: vi.fn(),
    updatePrivacySettings: vi.fn(),
    updateAppearanceSettings: vi.fn(),
    updateLocaleSettings: vi.fn(),
    updateKeyboardSettings: vi.fn(),
    updateAllSettings: vi.fn(),
    resetToDefaults: vi.fn(),
    getTheme: vi.fn(() => 'dark'),
    getShouldReduceMotion: vi.fn(() => false),
  })),
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn(() => ({
    colorPreset: 'emerald',
    profileThemeId: null,
    chatBubble: { ownMessageBg: '#10b981' },
    effectPreset: 'glassmorphism',
    animationSpeed: 'normal',
    particlesEnabled: true,
    glowEnabled: true,
    setColorPreset: vi.fn(),
    getColors: vi.fn(() => ({ primary: '#10b981' })),
    setProfileTheme: vi.fn(),
    setProfileCardLayout: vi.fn(),
    updateChatBubble: vi.fn(),
    applyChatBubblePreset: vi.fn(),
    resetChatBubble: vi.fn(),
    setEffectPreset: vi.fn(),
    setAnimationSpeed: vi.fn(),
    toggleParticles: vi.fn(),
    toggleGlow: vi.fn(),
    syncWithBackend: vi.fn(),
    resetTheme: vi.fn(),
  })),
}));

vi.mock('@/stores/customizationStore', () => ({
  useCustomizationStore: vi.fn(() => ({
    themePreset: 'emerald',
    effectPreset: 'glassmorphism',
    chatBubbleStyle: 'rounded',
    isLoading: false,
    isDirty: false,
    fetchCustomizations: vi.fn(),
    saveCustomizations: vi.fn(),
    updateSettings: vi.fn(),
    resetToDefaults: vi.fn(),
  })),
}));

vi.mock('@/stores/marketplaceStore', () => ({
  useMarketplaceStore: vi.fn(() => ({
    listings: [],
    selectedListing: null,
    myListings: [],
    filters: {},
    isLoading: false,
    fetchListings: vi.fn(),
    fetchListing: vi.fn(),
    purchaseListing: vi.fn(),
    createListing: vi.fn(),
  })),
}));

vi.mock('@/stores/avatarBorderStore', () => ({
  useAvatarBorderStore: vi.fn(() => ({
    allBorders: [],
    unlockedBorders: [],
    preferences: {},
    getEquippedBorder: vi.fn(() => null),
    equipBorder: vi.fn(),
    purchaseBorder: vi.fn(),
    fetchBorders: vi.fn(),
  })),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    notifications: [],
    unreadCount: 3,
    isLoading: false,
    hasMore: false,
    fetchNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    addNotification: vi.fn(),
    clearAll: vi.fn(),
  })),
}));

// Also mock the module path since uiFacade now imports from modules
vi.mock('@/modules/social/store', () => ({
  useNotificationStore: vi.fn(() => ({
    notifications: [],
    unreadCount: 3,
    isLoading: false,
    hasMore: false,
    fetchNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    addNotification: vi.fn(),
    clearAll: vi.fn(),
  })),
  useFriendStore: vi.fn(() => ({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    isLoading: false,
    fetchFriends: vi.fn(),
    fetchPendingRequests: vi.fn(),
    sendRequest: vi.fn(),
    acceptRequest: vi.fn(),
    declineRequest: vi.fn(),
    removeFriend: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  })),
}));

vi.mock('@/stores/searchStore', () => ({
  useSearchStore: vi.fn(() => ({
    query: '',
    category: 'all',
    users: [],
    groups: [],
    forums: [],
    posts: [],
    messages: [],
    isLoading: false,
    hasSearched: false,
    error: null,
    search: vi.fn(),
    searchById: vi.fn(),
    setQuery: vi.fn(),
    setCategory: vi.fn(),
    clearResults: vi.fn(),
    clearError: vi.fn(),
  })),
}));

// Also mock the module path since uiFacade now imports from modules
vi.mock('@/modules/search/store', () => ({
  useSearchStore: vi.fn(() => ({
    query: '',
    category: 'all',
    users: [],
    groups: [],
    forums: [],
    posts: [],
    messages: [],
    isLoading: false,
    hasSearched: false,
    error: null,
    search: vi.fn(),
    searchById: vi.fn(),
    setQuery: vi.fn(),
    setCategory: vi.fn(),
    clearResults: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock('@/stores/pluginStore', () => ({
  usePluginStore: vi.fn(() => ({
    marketplacePlugins: [],
    marketplaceCategories: [],
    installedPlugins: [],
    isLoadingMarketplace: false,
    isLoadingInstalled: false,
    fetchMarketplace: vi.fn(),
    getMarketplacePlugin: vi.fn(),
    fetchInstalledPlugins: vi.fn(),
    installPlugin: vi.fn(),
    uninstallPlugin: vi.fn(),
    togglePlugin: vi.fn(),
    updatePluginSettings: vi.fn(),
  })),
}));

vi.mock('@/stores/calendarStore', () => ({
  useCalendarStore: vi.fn(() => ({
    events: [],
    currentEvent: null,
    categories: [],
    viewMode: 'month',
    currentYear: 2026,
    currentMonth: 1,
    isLoading: false,
    fetchEvents: vi.fn(),
    fetchEvent: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    setViewMode: vi.fn(),
    goToMonth: vi.fn(),
    goToPreviousMonth: vi.fn(),
    goToNextMonth: vi.fn(),
    goToToday: vi.fn(),
    getEventsForDate: vi.fn(() => []),
    getUpcomingEvents: vi.fn(() => []),
    rsvp: vi.fn(),
    cancelRsvp: vi.fn(),
  })),
}));

describe('Store Facades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuthFacade', () => {
    it('should provide authentication state and actions', () => {
      const { result } = renderHook(() => useAuthFacade());

      expect(result.current.user).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.login).toBeDefined();
      expect(result.current.logout).toBeDefined();
    });

    it('should include profile state', () => {
      const { result } = renderHook(() => useAuthFacade());

      expect(result.current.myProfile).toBeDefined();
      expect(result.current.fetchMyProfile).toBeDefined();
    });

    it('should include friends state', () => {
      const { result } = renderHook(() => useAuthFacade());

      expect(result.current.friends).toBeDefined();
      expect(result.current.fetchFriends).toBeDefined();
    });

    it('should provide direct store access via _stores', () => {
      const { result } = renderHook(() => useAuthFacade());

      expect(result.current._stores).toBeDefined();
      expect(result.current._stores.auth).toBeDefined();
      expect(result.current._stores.profile).toBeDefined();
      expect(result.current._stores.friends).toBeDefined();
    });
  });

  describe('useChatFacade', () => {
    it('should provide chat state and actions', () => {
      const { result } = renderHook(() => useChatFacade());

      expect(result.current.conversations).toBeDefined();
      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.fetchMessages).toBeDefined();
    });

    it('should include chat effects', () => {
      const { result } = renderHook(() => useChatFacade());

      expect(result.current.activeMessageEffect).toBeDefined();
      expect(result.current.setMessageEffect).toBeDefined();
    });

    it('should include incoming call handling', () => {
      const { result } = renderHook(() => useChatFacade());

      expect(result.current.incomingCall).toBeDefined();
      expect(result.current.acceptCall).toBeDefined();
      expect(result.current.declineCall).toBeDefined();
    });
  });

  describe('useCommunityFacade', () => {
    it('should provide forum state and actions', () => {
      const { result } = renderHook(() => useCommunityFacade());

      expect(result.current.forums).toBeDefined();
      expect(result.current.fetchForums).toBeDefined();
      expect(result.current.createPost).toBeDefined();
    });

    it('should include groups state', () => {
      const { result } = renderHook(() => useCommunityFacade());

      expect(result.current.groups).toBeDefined();
      expect(result.current.fetchGroups).toBeDefined();
    });

    it('should include moderation state', () => {
      const { result } = renderHook(() => useCommunityFacade());

      expect(result.current.moderationQueue).toBeDefined();
      expect(result.current.banUser).toBeDefined();
    });
  });

  describe('useGamificationFacade', () => {
    it('should provide gamification state', () => {
      const { result } = renderHook(() => useGamificationFacade());

      expect(result.current.level).toBeDefined();
      expect(result.current.achievements).toBeDefined();
    });

    it('should include prestige state', () => {
      const { result } = renderHook(() => useGamificationFacade());

      expect(result.current.prestigeData).toBeDefined();
      expect(result.current.canPrestige).toBeDefined();
    });

    it('should include seasonal events', () => {
      const { result } = renderHook(() => useGamificationFacade());

      expect(result.current.activeEvents).toBeDefined();
      expect(result.current.fetchEvents).toBeDefined();
    });

    it('should include referrals', () => {
      const { result } = renderHook(() => useGamificationFacade());

      expect(result.current.referralCode).toBeDefined();
    });
  });

  describe('useSettingsFacade', () => {
    it('should provide settings state', () => {
      const { result } = renderHook(() => useSettingsFacade());

      expect(result.current.settings).toBeDefined();
      expect(result.current.fetchSettings).toBeDefined();
    });

    it('should include theme state', () => {
      const { result } = renderHook(() => useSettingsFacade());

      expect(result.current.colorPreset).toBe('emerald');
      expect(result.current.setColorPreset).toBeDefined();
    });

    it('should include customization state', () => {
      const { result } = renderHook(() => useSettingsFacade());

      expect(result.current.customizationIsLoading).toBeDefined();
      expect(result.current.fetchCustomizations).toBeDefined();
    });
  });

  describe('useMarketplaceFacade', () => {
    it('should provide marketplace state', () => {
      const { result } = renderHook(() => useMarketplaceFacade());

      expect(result.current.listings).toBeDefined();
      expect(result.current.fetchListings).toBeDefined();
    });

    it('should include avatar border state', () => {
      const { result } = renderHook(() => useMarketplaceFacade());

      expect(result.current.allBorders).toBeDefined();
      expect(result.current.equipBorder).toBeDefined();
    });
  });

  describe('useUIFacade', () => {
    it('should provide notification state', () => {
      const { result } = renderHook(() => useUIFacade());

      expect(result.current.notifications).toBeDefined();
      expect(result.current.unreadCount).toBe(3);
      expect(result.current.markAsRead).toBeDefined();
    });

    it('should include search state', () => {
      const { result } = renderHook(() => useUIFacade());

      expect(result.current.searchQuery).toBeDefined();
      expect(result.current.search).toBeDefined();
    });

    it('should include plugin state', () => {
      const { result } = renderHook(() => useUIFacade());

      expect(result.current.marketplacePlugins).toBeDefined();
      expect(result.current.installPlugin).toBeDefined();
    });

    it('should include calendar state', () => {
      const { result } = renderHook(() => useUIFacade());

      expect(result.current.calendarEvents).toBeDefined();
      expect(result.current.createEvent).toBeDefined();
    });
  });
});

describe('Facade Integration', () => {
  it('should allow multiple facades to be used together', () => {
    const authHook = renderHook(() => useAuthFacade());
    const chatHook = renderHook(() => useChatFacade());

    expect(authHook.result.current.user).toBeDefined();
    expect(chatHook.result.current.conversations).toBeDefined();
  });

  it('should maintain type safety across facades', () => {
    const { result } = renderHook(() => useAuthFacade());

    // TypeScript should catch if these don't exist
    const _user = result.current.user;
    const _login = result.current.login;
    const _friends = result.current.friends;

    expect(_user).toBeDefined();
    expect(typeof _login).toBe('function');
    expect(Array.isArray(_friends)).toBe(true);
  });
});
