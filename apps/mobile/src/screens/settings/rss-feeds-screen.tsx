/**
 * RSS feeds settings screen for managing feed subscriptions.
 * @module screens/settings/rss-feeds-screen
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp, type ParamListBase } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { HapticFeedback } from '@/lib/animations/animation-engine';

// ============================================================================
// Types
// ============================================================================

interface RSSFeed {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

type RouteParams = {
  RSSFeeds: {
    forumId?: string;
    forumName?: string;
  };
};

// ============================================================================
// RSS FEED DATA
// ============================================================================

const BASE_URL = 'https://cgraph-backend.fly.dev'; // Production API base URL

function generateFeeds(forumId?: string, forumName?: string): RSSFeed[] {
  const feeds: RSSFeed[] = [
    {
      id: 'all-posts',
      name: 'All Posts',
      description: 'Subscribe to all new posts across the forum',
      url: `${BASE_URL}/rss/posts`,
      icon: 'document-text',
      color: '#10b981',
    },
    {
      id: 'all-threads',
      name: 'All Threads',
      description: 'Subscribe to all new thread topics',
      url: `${BASE_URL}/rss/threads`,
      icon: 'chatbubbles',
      color: '#6366f1',
    },
    {
      id: 'announcements',
      name: 'Announcements',
      description: 'Important announcements and news',
      url: `${BASE_URL}/rss/announcements`,
      icon: 'megaphone',
      color: '#f59e0b',
    },
  ];

  // Add forum-specific feed if forumId provided
  if (forumId && forumName) {
    feeds.unshift({
      id: `forum-${forumId}`,
      name: forumName,
      description: `Posts from ${forumName} forum`,
      url: `${BASE_URL}/rss/forum/${forumId}`,
      icon: 'folder',
      color: '#8b5cf6',
    });
  }

  return feeds;
}

// ============================================================================
// RSS FEED ITEM COMPONENT
// ============================================================================

interface FeedItemProps {
  feed: RSSFeed;
  onCopy: (url: string) => void;
  onShare: (feed: RSSFeed) => void;
  onOpen: (url: string) => void;
}

function FeedItem({ feed, onCopy, onShare, onOpen }: FeedItemProps) {
  return (
    <BlurView intensity={40} tint="dark" style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={[styles.feedIcon, { backgroundColor: feed.color + '20' }]}>
          <Ionicons name={feed.icon} size={24} color={feed.color} />
        </View>
        <View style={styles.feedInfo}>
          <Text style={styles.feedName}>{feed.name}</Text>
          <Text style={styles.feedDescription}>{feed.description}</Text>
        </View>
      </View>

      <View style={styles.feedUrl}>
        <Ionicons name="link" size={14} color="#6b7280" />
        <Text style={styles.feedUrlText} numberOfLines={1}>
          {feed.url}
        </Text>
      </View>

      <View style={styles.feedActions}>
        <TouchableOpacity
          style={styles.feedAction}
          onPress={() => {
            HapticFeedback.light();
            onCopy(feed.url);
          }}
        >
          <Ionicons name="copy-outline" size={18} color="#9ca3af" />
          <Text style={styles.feedActionText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.feedAction}
          onPress={() => {
            HapticFeedback.light();
            onShare(feed);
          }}
        >
          <Ionicons name="share-outline" size={18} color="#9ca3af" />
          <Text style={styles.feedActionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.feedAction}
          onPress={() => {
            HapticFeedback.light();
            onOpen(feed.url);
          }}
        >
          <Ionicons name="open-outline" size={18} color="#9ca3af" />
          <Text style={styles.feedActionText}>Open</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RSSFeedsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const route = useRoute<RouteProp<RouteParams, 'RSSFeeds'>>();

  const { forumId, forumName } = route.params || {};
  const feeds = generateFeeds(forumId, forumName);

  // Copy URL to clipboard
  const handleCopy = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied!', 'RSS feed URL copied to clipboard');
  };

  // Share feed
  const handleShare = async (feed: RSSFeed) => {
    try {
      await Share.share({
        message: `Subscribe to ${feed.name}: ${feed.url}`,
        title: `RSS Feed - ${feed.name}`,
        url: feed.url,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Open feed URL
  const handleOpen = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Open URL error:', error);
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>RSS Feeds</Text>
          <Text style={styles.headerSubtitle}>Subscribe to forum content</Text>
        </View>
        <View style={styles.rssIcon}>
          <Ionicons name="logo-rss" size={24} color="#f59e0b" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What is RSS?</Text>
            <Text style={styles.infoText}>
              RSS (Really Simple Syndication) lets you subscribe to forum updates using your
              favorite RSS reader app. Get notified of new posts without visiting the site!
            </Text>
          </View>
        </View>

        {/* Recommended Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended RSS Apps</Text>
          <View style={styles.appsRow}>
            <View style={styles.appBadge}>
              <Text style={styles.appBadgeText}>Feedly</Text>
            </View>
            <View style={styles.appBadge}>
              <Text style={styles.appBadgeText}>Inoreader</Text>
            </View>
            <View style={styles.appBadge}>
              <Text style={styles.appBadgeText}>NetNewsWire</Text>
            </View>
          </View>
        </View>

        {/* Feed List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Feeds</Text>
          {feeds.map((feed) => (
            <FeedItem
              key={feed.id}
              feed={feed}
              onCopy={handleCopy}
              onShare={handleShare}
              onOpen={handleOpen}
            />
          ))}
        </View>

        {/* Help Card */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={20} color="#10b981" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>How to subscribe</Text>
            <Text style={styles.helpText}>
              1. Copy the feed URL above{'\n'}
              2. Open your RSS reader app{'\n'}
              3. Add a new subscription{'\n'}
              4. Paste the copied URL
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  rssIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 19,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  appsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  appBadgeText: {
    fontSize: 13,
    color: '#d1d5db',
  },
  feedCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  feedIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedInfo: {
    flex: 1,
  },
  feedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  feedDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  feedUrl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  feedUrlText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  feedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedActionText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },
});
