/**
 * CGraph Service Worker for Push Notifications
 * 
 * Handles:
 * - Web push notification reception
 * - Notification click handling
 * - Background sync
 * 
 * @version 0.9.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* global self, caches, clients, console */

const CACHE_NAME = 'cgraph-v1';
const NOTIFICATION_ICON = '/icon-192x192.png';

// Install event - cache essential assets
self.addEventListener('install', (_event) => {
  console.log('[SW] Installing service worker...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (_e) {
    // Try as text if JSON parse fails
    data = {
      title: 'CGraph',
      body: event.data.text(),
    };
  }
  
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || NOTIFICATION_ICON,
    badge: '/badge-72x72.png',
    tag: data.tag || `notification-${Date.now()}`,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type,
      id: data.id,
      ...data.data,
    },
    actions: data.actions || getDefaultActions(data.type),
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CGraph', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = data.url || '/';
  
  // Handle specific actions
  if (event.action === 'reply') {
    // Handle inline reply if supported
    url = getReplyUrl(data);
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else if (event.action === 'view') {
    url = getViewUrl(data);
  }
  
  // Open the appropriate page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin)) {
            // Navigate existing window
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(url);
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (_event) => {
  console.log('[SW] Notification closed');
  // Could track analytics here
});

// Get default actions based on notification type
function getDefaultActions(type) {
  switch (type) {
    case 'message':
    case 'direct_message':
      return [
        { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
      ];
    case 'friend_request':
      return [
        { action: 'view', title: 'View', icon: '/icons/view.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
      ];
    case 'forum_reply':
    case 'mention':
      return [
        { action: 'view', title: 'View', icon: '/icons/view.png' },
      ];
    default:
      return [];
  }
}

// Get reply URL based on notification data
function getReplyUrl(data) {
  if (data.type === 'message' || data.type === 'direct_message') {
    return `/messages/${data.conversation_id || data.id}`;
  }
  return '/messages';
}

// Get view URL based on notification data
function getViewUrl(data) {
  switch (data.type) {
    case 'friend_request':
      return '/friends/requests';
    case 'group_invite':
      return `/groups/${data.group_id || data.id}`;
    case 'forum_reply':
      return `/forums/post/${data.post_id || data.id}`;
    case 'mention':
      if (data.forum_id) {
        return `/forums/post/${data.post_id || data.id}`;
      }
      if (data.group_id) {
        return `/groups/${data.group_id}/channels/${data.channel_id}`;
      }
      return '/';
    default:
      return data.url || '/notifications';
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service worker loaded');
