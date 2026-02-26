/**
 * PostPreview - Post preview card with glassmorphism effect
 */

import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';

import { PostType } from '../types';
import { styles } from '../styles';
import { POST_TYPES } from '../constants';

interface PostPreviewProps {
  title: string;
  content: string;
  postType: PostType;
}

/**
 *
 */
export function PostPreview({ title, content, postType }: PostPreviewProps) {
  if (!title.trim()) {
    return null;
  }

  return (
    <Animated.View style={styles.previewHint}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Ionicons name="eye-outline" size={16} color="#8B5CF6" />
          <Text style={styles.previewLabel}>Preview</Text>
        </View>
        <Text style={styles.previewTitle} numberOfLines={2}>
          {title.trim()}
        </Text>
        {content.trim() && (
          <Text style={styles.previewContent} numberOfLines={3}>
            {content.trim()}
          </Text>
        )}
        <View style={styles.previewMeta}>
          <View style={styles.previewBadge}>
            <Ionicons
              name={POST_TYPES.find((t) => t.type === postType)?.icon || 'document-text'}
              size={12}
              color="#8B5CF6"
            />
            <Text style={styles.previewBadgeText}>{postType}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}
