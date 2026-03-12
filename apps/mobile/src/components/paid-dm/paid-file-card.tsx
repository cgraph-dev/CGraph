/**
 * PaidFileCard Component
 *
 * Displays a paid file attachment with blur overlay for locked content,
 * price badge, and unlock button.
 *
 * @module components/paid-dm/paid-file-card
 * @since v1.0.0
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores';

interface PaidFileCardProps {
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document';
  price: number;
  status: 'locked' | 'unlocked' | 'pending';
  onUnlock: () => void;
}

const FILE_ICONS: Record<string, string> = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  document: '📄',
};

export default function PaidFileCard({
  fileUrl,
  fileName,
  fileType,
  price,
  status,
  onUnlock,
}: PaidFileCardProps): React.ReactElement {
  const { colors } = useThemeStore();
  const isLocked = status !== 'unlocked';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Preview area */}
      <View style={styles.previewWrap}>
        {fileType === 'image' && fileUrl ? (
          <Image
            source={{ uri: fileUrl }}
            style={styles.preview}
            blurRadius={isLocked ? 20 : 0}
          />
        ) : (
          <View style={[styles.iconPreview, { backgroundColor: colors.background }]}>
            <Text style={styles.iconEmoji}>{FILE_ICONS[fileType] ?? '📎'}</Text>
          </View>
        )}

        {/* Price badge */}
        {isLocked && (
          <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.priceText}>{price} nodes</Text>
          </View>
        )}
      </View>

      {/* File info */}
      <View style={styles.info}>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
          {fileName}
        </Text>
        <Text style={[styles.fileType, { color: colors.textSecondary }]}>
          {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
        </Text>
      </View>

      {/* Unlock button */}
      {isLocked && (
        <Pressable
          style={[styles.unlockButton, { backgroundColor: colors.primary }]}
          onPress={onUnlock}
        >
          <Text style={styles.unlockText}>
            {status === 'pending' ? 'Pending…' : 'Unlock'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewWrap: {
    height: 160,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: { fontSize: 48 },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    padding: 12,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
  },
  fileType: {
    fontSize: 13,
    marginTop: 2,
  },
  unlockButton: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  unlockText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
