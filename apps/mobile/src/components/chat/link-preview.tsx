import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../ui/glass-card';
import type { LinkMetadata } from './rich-media-embed.types';

// ============================================================================
// Link Preview Component
// ============================================================================

interface LinkPreviewProps {
  embed: LinkMetadata;
}

const LinkPreview = memo(function LinkPreview({
  embed,
}: LinkPreviewProps): React.ReactElement | null {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(embed.url);
  };

  return (
    <TouchableOpacity style={styles.linkContainer} onPress={handlePress} activeOpacity={0.8}>
      <GlassCard variant="crystal" intensity="medium" style={styles.linkCard} borderGradient>
        {embed.image && (
          <View style={styles.linkImageContainer}>
            <Image source={{ uri: embed.image }} style={styles.linkImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(17, 24, 39, 0.9)']}
              style={styles.linkImageGradient}
            />
          </View>
        )}

        <View style={styles.linkContent}>
          <View style={styles.linkHeader}>
            {embed.favicon && (
              <Image
                source={{ uri: embed.favicon }}
                style={styles.linkFavicon}
                resizeMode="contain"
              />
            )}
            <View style={styles.linkTextContainer}>
              {embed.title && (
                <Text style={styles.linkTitle} numberOfLines={2}>
                  {embed.title}
                </Text>
              )}
              {embed.description && (
                <Text style={styles.linkDescription} numberOfLines={2}>
                  {embed.description}
                </Text>
              )}
              <View style={styles.linkFooter}>
                {embed.siteName && <Text style={styles.linkSite}>{embed.siteName}</Text>}
                <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.5)" />
              </View>
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  linkContainer: {
    maxWidth: 320,
  },
  linkCard: {
    padding: 0,
    overflow: 'hidden',
  },
  linkImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  linkImage: {
    width: '100%',
    height: '100%',
  },
  linkImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  linkContent: {
    padding: 12,
  },
  linkHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  linkFavicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginTop: 2,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 16,
  },
  linkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkSite: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default LinkPreview;
