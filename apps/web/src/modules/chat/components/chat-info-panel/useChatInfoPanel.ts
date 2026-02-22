/**
 * useChatInfoPanel hook - state and handlers for chat info panel
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useFriendStore } from '@/modules/social/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { api } from '@/lib/api';

const logger = createLogger('ChatInfoPanel');

interface UseChatInfoPanelParams {
  userId: string;
  conversationId?: string;
  onMuteToggle?: (isMuted: boolean) => void;
  onBlock?: () => void;
  onReport?: () => void;
  onClose: () => void;
}

export function useChatInfoPanel({
  userId,
  conversationId,
  onMuteToggle,
  onBlock,
  onReport,
  onClose,
}: UseChatInfoPanelParams) {
  const navigate = useNavigate();
  const { blockUser, isLoading: isBlockLoading } = useFriendStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [messageTTL, setMessageTTL] = useState<number | null>(null);

  // Fetch conversation TTL on mount
  useEffect(() => {
    if (!conversationId) return;
    api.get(`/api/v1/conversations/${conversationId}`)
      .then((res) => {
        const data = (res as { data?: { data?: { message_ttl?: number | null } } })?.data?.data;
        if (data?.message_ttl !== undefined) {
          setMessageTTL(data.message_ttl);
        }
      })
      .catch(() => {
        // Silently fail — TTL will default to null (off)
      });
  }, [conversationId]);

  // Handle disappearing messages TTL update
  const handleUpdateTTL = useCallback(async (ttl: number | null) => {
    if (!conversationId) return;
    const previousTTL = messageTTL;
    setMessageTTL(ttl);

    try {
      await api.put(`/api/v1/conversations/${conversationId}/ttl`, { ttl });
      HapticFeedback.light();
    } catch (error) {
      setMessageTTL(previousTTL);
      logger.error('Failed to update message TTL:', error);
    }
  }, [conversationId, messageTTL]);

  // Handle mute toggle with API call
  const handleMuteToggle = useCallback(async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    HapticFeedback.light();

    onMuteToggle?.(newMutedState);

    if (conversationId) {
      try {
        await api.patch(`/api/v1/conversations/${conversationId}/mute`, {
          muted: newMutedState,
        });
      } catch (error) {
        setIsMuted(!newMutedState);
        logger.error('Failed to toggle mute:', error);
      }
    }
  }, [isMuted, conversationId, onMuteToggle]);

  // Handle block user
  const handleBlock = useCallback(async () => {
    if (isBlocking) return;
    setIsBlocking(true);
    HapticFeedback.warning();

    try {
      await blockUser(userId);
      onBlock?.();
      onClose();
    } catch (error) {
      logger.error('Failed to block user:', error);
    } finally {
      setIsBlocking(false);
      setShowBlockConfirm(false);
    }
  }, [userId, blockUser, onBlock, onClose, isBlocking]);

  // Handle report user
  const handleReport = useCallback(async () => {
    if (isReporting || !reportReason.trim()) return;
    setIsReporting(true);
    HapticFeedback.medium();

    try {
      await api.post('/api/v1/reports', {
        reported_user_id: userId,
        reason: reportReason.trim(),
        context: conversationId ? { conversation_id: conversationId } : undefined,
      });
      onReport?.();
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      logger.error('Failed to report user:', error);
    } finally {
      setIsReporting(false);
    }
  }, [userId, conversationId, reportReason, onReport, isReporting]);

  // Navigation handlers
  const handleViewProfile = useCallback(() => {
    if (!userId || userId === 'undefined' || userId === 'null') {
      logger.warn('ChatInfoPanel: Cannot view profile - invalid userId');
      return;
    }
    navigate(`/user/${userId}`);
  }, [userId, navigate]);

  const handleCustomizeChat = useCallback(() => {
    try {
      navigate('/customize/chat');
    } catch (error) {
      logger.error('Navigation to customize/chat failed:', error);
    }
  }, [navigate]);

  const handleNavigateToUser = useCallback(
    (friendId: string) => {
      navigate(`/user/${friendId}`);
    },
    [navigate]
  );

  const handleNavigateToForum = useCallback(
    (forumId: string) => {
      navigate(`/forums/${forumId}`);
    },
    [navigate]
  );

  return {
    // State
    isMuted,
    isBlocking,
    isBlockLoading,
    isReporting,
    showBlockConfirm,
    setShowBlockConfirm,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason,
    messageTTL,
    // Handlers
    handleMuteToggle,
    handleBlock,
    handleReport,
    handleViewProfile,
    handleCustomizeChat,
    handleNavigateToUser,
    handleNavigateToForum,
    handleUpdateTTL,
  };
}
