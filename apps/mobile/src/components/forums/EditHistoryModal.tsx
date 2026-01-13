/**
 * EditHistoryModal Component (React Native)
 * Bottom sheet modal for viewing post edit history with timeline
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { PostEditHistory } from '@/types';

interface EditHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  onFetchHistory?: (postId: string) => Promise<PostEditHistory[]>;
}

export default function EditHistoryModal({
  visible,
  onClose,
  postId,
  onFetchHistory,
}: EditHistoryModalProps) {
  const [history, setHistory] = useState<PostEditHistory[]>([]);
  const [selectedEdit, setSelectedEdit] = useState<PostEditHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && postId && onFetchHistory) {
      loadHistory();
    }
  }, [visible, postId]);

  const loadHistory = async () => {
    if (!onFetchHistory) return;

    setIsLoading(true);
    try {
      const data = await onFetchHistory(postId);
      setHistory(data);
      if (data.length > 0) {
        setSelectedEdit(data[0] || null);
      }
    } catch (error) {
      console.error('Failed to load edit history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEdit(null);
    onClose();
  };

  const handleSelectEdit = (edit: PostEditHistory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEdit(edit);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Edit History</Text>
              <Text style={styles.headerSubtitle}>
                {history.length} {history.length === 1 ? 'edit' : 'edits'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : history.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🕐</Text>
                <Text style={styles.emptyText}>No edit history available</Text>
              </View>
            ) : (
              <View style={styles.splitView}>
                {/* Timeline Sidebar */}
                <ScrollView
                  style={styles.timeline}
                  showsVerticalScrollIndicator={false}
                >
                  {history.map((edit, index) => (
                    <TouchableOpacity
                      key={edit.id}
                      onPress={() => handleSelectEdit(edit)}
                      style={[
                        styles.timelineItem,
                        selectedEdit?.id === edit.id && styles.timelineItemSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.timelineItemHeader}>
                        <Text style={styles.timelineItemTitle}>
                          Edit #{history.length - index}
                        </Text>
                      </View>
                      <Text style={styles.timelineItemUser}>
                        👤 {edit.edited_by_username}
                      </Text>
                      <Text style={styles.timelineItemTime}>
                        {formatTimeAgo(edit.edited_at)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Details Panel */}
                <ScrollView
                  style={styles.details}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedEdit && (
                    <View style={styles.detailsContent}>
                      {/* Edit Info */}
                      <View style={styles.detailsHeader}>
                        <Text style={styles.detailsTitle}>
                          Edit #{history.findIndex((h) => h.id === selectedEdit.id) + 1}
                        </Text>
                        <Text style={styles.detailsSubtitle}>
                          By {selectedEdit.edited_by_username} • {formatTimeAgo(selectedEdit.edited_at)}
                        </Text>
                      </View>

                      {/* Edit Reason */}
                      {selectedEdit.reason && (
                        <View style={styles.reasonContainer}>
                          <Text style={styles.reasonLabel}>Edit Reason</Text>
                          <Text style={styles.reasonText}>{selectedEdit.reason}</Text>
                        </View>
                      )}

                      {/* Previous Content */}
                      <View style={styles.contentContainer}>
                        <Text style={styles.contentLabel}>Previous Content</Text>
                        <View style={styles.contentBox}>
                          <Text style={styles.contentText}>
                            {selectedEdit.previous_content}
                          </Text>
                        </View>
                      </View>

                      {/* Tip */}
                      <View style={styles.tipContainer}>
                        <Text style={styles.tipText}>
                          💡 Compare this with the current version to see what changed.
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1f2937', // dark-800
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // dark-700
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151', // dark-700
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#9ca3af', // gray-400
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af', // gray-400
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  timeline: {
    width: 140,
    borderRightWidth: 1,
    borderRightColor: '#374151', // dark-700
    padding: 12,
  },
  timelineItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#374151', // dark-700
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timelineItemSelected: {
    backgroundColor: '#064e3b', // dark-green
    borderColor: '#10b981', // primary-500
  },
  timelineItemHeader: {
    marginBottom: 6,
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  timelineItemUser: {
    fontSize: 11,
    color: '#9ca3af', // gray-400
    marginBottom: 4,
  },
  timelineItemTime: {
    fontSize: 10,
    color: '#6b7280', // gray-500
  },
  details: {
    flex: 1,
    padding: 16,
  },
  detailsContent: {
    gap: 16,
  },
  detailsHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // dark-700
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  detailsSubtitle: {
    fontSize: 13,
    color: '#9ca3af', // gray-400
  },
  reasonContainer: {
    padding: 12,
    backgroundColor: '#374151', // dark-700
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563', // dark-600
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db', // gray-300
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 13,
    color: '#9ca3af', // gray-400
    lineHeight: 18,
  },
  contentContainer: {
    gap: 8,
  },
  contentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db', // gray-300
  },
  contentBox: {
    padding: 12,
    backgroundColor: '#374151', // dark-700
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563', // dark-600
  },
  contentText: {
    fontSize: 14,
    color: '#d1d5db', // gray-300
    lineHeight: 20,
  },
  tipContainer: {
    padding: 12,
    backgroundColor: '#10b98120', // primary-500/10
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b98150', // primary-500/30
  },
  tipText: {
    fontSize: 12,
    color: '#10b981', // primary-400
    lineHeight: 18,
  },
});
