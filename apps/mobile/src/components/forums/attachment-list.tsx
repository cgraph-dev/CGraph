/**
 * AttachmentList Component (React Native)
 * Displays file attachments with thumbnails and download functionality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { PostAttachment } from '@/types';

interface AttachmentListProps {
  attachments: PostAttachment[];
  onDownload?: (attachment: PostAttachment) => void;
}

/**
 *
 */
export default function AttachmentList({
  attachments,
  onDownload,
}: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  const handleDownload = async (attachment: PostAttachment) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (onDownload) {
      onDownload(attachment);
    } else {
      // Fallback: Open in browser
      try {
        const supported = await Linking.canOpenURL(attachment.download_url);
        if (supported) {
          await Linking.openURL(attachment.download_url);
        } else {
          Alert.alert('Error', 'Cannot open this file');
        }
      } catch (_error) {
        Alert.alert('Error', 'Failed to open file');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Attachments ({attachments.length})
      </Text>
      <View style={styles.list}>
        {attachments.map((attachment) => (
          <TouchableOpacity
            key={attachment.id}
            onPress={() => handleDownload(attachment)}
            style={styles.item}
            activeOpacity={0.7}
          >
            {/* Thumbnail or Icon */}
            {isImage(attachment.file_type) && attachment.thumbnail_url ? (
              <Image
                source={{ uri: attachment.thumbnail_url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>
                  {getFileExtension(attachment.filename).slice(0, 4)}
                </Text>
              </View>
            )}

            {/* File Info */}
            <View style={styles.info}>
              <Text style={styles.filename} numberOfLines={1}>
                {attachment.original_filename}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  {formatFileSize(attachment.file_size)}
                </Text>
                {attachment.downloads > 0 && (
                  <>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.metaText}>
                      {attachment.downloads} download{attachment.downloads !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Download Icon */}
            <View style={styles.downloadButton}>
              <Text style={styles.downloadIcon}>⬇</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af', // gray-400
    marginBottom: 8,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151', // dark-700
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563', // dark-600
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#4b5563', // dark-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af', // gray-400
  },
  info: {
    flex: 1,
    gap: 4,
  },
  filename: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#9ca3af', // gray-400
  },
  separator: {
    fontSize: 11,
    color: '#6b7280', // gray-500
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#10b981', // primary-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
});
