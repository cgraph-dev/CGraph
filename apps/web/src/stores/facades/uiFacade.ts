/**
 * UI Facade
 *
 * Unified interface for UI-related utilities.
 * Aggregates: notificationStore, searchStore, pluginStore, calendarStore
 *
 * @module stores/facades/uiFacade
 */

import { useNotificationStore } from '../notificationStore';
import { useSearchStore } from '../searchStore';
import { usePluginStore } from '../pluginStore';
import { useCalendarStore } from '../calendarStore';

/**
 * Unified UI utilities facade
 * Provides a single hook for all UI-related state and actions
 */
export function useUIFacade() {
  const notifications = useNotificationStore();
  const search = useSearchStore();
  const plugins = usePluginStore();
  const calendar = useCalendarStore();

  return {
    // === Notifications State ===
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,
    notificationsLoading: notifications.isLoading,
    notificationsHasMore: notifications.hasMore,

    // === Notifications Actions ===
    fetchNotifications: notifications.fetchNotifications,
    markAsRead: notifications.markAsRead,
    markAllAsRead: notifications.markAllAsRead,
    deleteNotification: notifications.deleteNotification,
    addNotification: notifications.addNotification,
    clearAllNotifications: notifications.clearAll,

    // === Search State ===
    searchQuery: search.query,
    searchCategory: search.category,
    searchUsers: search.users,
    searchGroups: search.groups,
    searchForums: search.forums,
    searchPosts: search.posts,
    searchMessages: search.messages,
    isSearching: search.isLoading,
    hasSearched: search.hasSearched,
    searchError: search.error,

    // === Search Actions ===
    search: search.search,
    searchById: search.searchById,
    setSearchQuery: search.setQuery,
    setSearchCategory: search.setCategory,
    clearSearchResults: search.clearResults,
    clearSearchError: search.clearError,

    // === Plugins State ===
    marketplacePlugins: plugins.marketplacePlugins,
    marketplaceCategories: plugins.marketplaceCategories,
    installedPlugins: plugins.installedPlugins,
    isLoadingMarketplace: plugins.isLoadingMarketplace,
    isLoadingPlugins: plugins.isLoadingInstalled,

    // === Plugins Actions ===
    fetchMarketplace: plugins.fetchMarketplace,
    getMarketplacePlugin: plugins.getMarketplacePlugin,
    fetchInstalledPlugins: plugins.fetchInstalledPlugins,
    installPlugin: plugins.installPlugin,
    uninstallPlugin: plugins.uninstallPlugin,
    togglePlugin: plugins.togglePlugin,
    updatePluginSettings: plugins.updatePluginSettings,

    // === Calendar State ===
    calendarEvents: calendar.events,
    currentEvent: calendar.currentEvent,
    calendarCategories: calendar.categories,
    calendarViewMode: calendar.viewMode,
    currentYear: calendar.currentYear,
    currentMonth: calendar.currentMonth,
    isLoadingCalendar: calendar.isLoading,

    // === Calendar Actions ===
    fetchEvents: calendar.fetchEvents,
    fetchEvent: calendar.fetchEvent,
    createEvent: calendar.createEvent,
    updateEvent: calendar.updateEvent,
    deleteEvent: calendar.deleteEvent,
    setViewMode: calendar.setViewMode,
    goToMonth: calendar.goToMonth,
    goToPreviousMonth: calendar.goToPreviousMonth,
    goToNextMonth: calendar.goToNextMonth,
    goToToday: calendar.goToToday,
    getEventsForDate: calendar.getEventsForDate,
    getUpcomingEvents: calendar.getUpcomingEvents,
    rsvp: calendar.rsvp,
    cancelRsvp: calendar.cancelRsvp,

    // === Direct Store Access (for edge cases) ===
    _stores: { notifications, search, plugins, calendar },
  };
}

export type UIFacade = ReturnType<typeof useUIFacade>;
