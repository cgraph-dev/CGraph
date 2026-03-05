/**
 * Loading States (Mobile) — Skeleton compositions for major content areas
 *
 * Pre-built skeleton layouts matching actual content structure.
 * Uses Reanimated shimmer animation.
 *
 * @module components/ui/loading-states
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// ── Skeleton Primitive ─────────────────────────────────────────────────

function Sk({ style }: { style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 6,
        },
        style,
      ]}
    />
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Variants ───────────────────────────────────────────────────────────

/** 8 rows: avatar + 2 text lines */
export function ConversationListLoading() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Sk style={styles.avatarCircle} />
          <View style={styles.textCol}>
            <Sk style={{ height: 14, width: '60%', borderRadius: 4 }} />
            <Sk style={{ height: 12, width: '80%', borderRadius: 4, marginTop: 6 }} />
          </View>
          <Sk style={{ height: 12, width: 32, borderRadius: 4 }} />
        </View>
      ))}
    </Animated.View>
  );
}

/** 5 message groups: avatar + text blocks */
export function MessageListLoading() {
  const widths = [0.75, 0.5, 0.65, 0.8, 0.4];
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {widths.map((w, i) => (
        <View key={i} style={[styles.row, { alignItems: 'flex-start', marginBottom: 20 }]}>
          <Sk style={styles.avatarCircle} />
          <View style={styles.textCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sk style={{ height: 14, width: 80, borderRadius: 4 }} />
              <Sk style={{ height: 10, width: 40, borderRadius: 4 }} />
            </View>
            <Sk style={{ height: 16, width: SCREEN_WIDTH * w * 0.7, borderRadius: 4, marginTop: 8 }} />
            {i % 2 === 0 && (
              <Sk style={{ height: 16, width: SCREEN_WIDTH * 0.35, borderRadius: 4, marginTop: 4 }} />
            )}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

/** 3 categories with 4 channel items each */
export function ChannelListLoading() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {[0, 1, 2].map((cat) => (
        <View key={cat} style={{ marginBottom: 16 }}>
          <Sk style={{ height: 12, width: 80, borderRadius: 4, marginLeft: 8, marginBottom: 8 }} />
          {[0, 1, 2, 3].map((ch) => (
            <View key={ch} style={[styles.row, { paddingVertical: 6 }]}>
              <Sk style={{ height: 16, width: 16, borderRadius: 4 }} />
              <Sk style={{ height: 14, width: 110, borderRadius: 4 }} />
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

/** Banner + avatar + stats + tabs */
export function ProfileLoading() {
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <Sk style={{ height: 150, width: '100%', borderRadius: 0 }} />
      <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
        <View style={[styles.avatarCircle, { width: 80, height: 80, borderWidth: 3, borderColor: '#111214' }]} />
        <View style={{ marginTop: 12, gap: 8 }}>
          <Sk style={{ height: 20, width: 160, borderRadius: 4 }} />
          <Sk style={{ height: 14, width: 100, borderRadius: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <Sk style={{ height: 20, width: 40, borderRadius: 4 }} />
              <Sk style={{ height: 12, width: 56, borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

/** 4 thread cards */
export function ForumListLoading() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.container, { gap: 12 }]}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.forumCard}>
          <View style={[styles.row, { marginBottom: 8 }]}>
            <Sk style={{ height: 24, width: 24, borderRadius: 12 }} />
            <Sk style={{ height: 12, width: 64, borderRadius: 4 }} />
          </View>
          <Sk style={{ height: 16, width: '85%', borderRadius: 4 }} />
          <Sk style={{ height: 12, width: '65%', borderRadius: 4, marginTop: 6 }} />
          <View style={[styles.row, { marginTop: 10 }]}>
            <Sk style={{ height: 12, width: 40, borderRadius: 4 }} />
            <Sk style={{ height: 12, width: 40, borderRadius: 4 }} />
            <Sk style={{ height: 12, width: 40, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

// ── Unified Variant Component ──────────────────────────────────────────

type LoadingVariant =
  | 'conversation-list'
  | 'message-list'
  | 'channel-list'
  | 'profile'
  | 'forum-list';

const variantMap: Record<LoadingVariant, React.FC> = {
  'conversation-list': ConversationListLoading,
  'message-list': MessageListLoading,
  'channel-list': ChannelListLoading,
  profile: ProfileLoading,
  'forum-list': ForumListLoading,
};

export function LoadingState({ variant }: { variant: LoadingVariant }) {
  const Component = variantMap[variant];
  return <Component />;
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  textCol: {
    flex: 1,
  },
  forumCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
  },
});

export default LoadingState;
