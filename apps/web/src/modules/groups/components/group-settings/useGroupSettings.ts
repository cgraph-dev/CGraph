/**
 * useGroupSettings hook
 * @module modules/groups/components/group-settings
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '@/modules/groups/store';
import { useAuthStore } from '@/modules/auth/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import type { TabId, OverviewFormData } from './types';

const logger = createLogger('GroupSettings');

export function useGroupSettings(groupId: string) {
  const navigate = useNavigate();
  const { groups, leaveGroup, updateGroup, deleteGroup } = useGroupStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const activeGroup = groups.find((g) => g.id === groupId);
  const isOwner = activeGroup?.ownerId === user?.id;

  const [formData, setFormData] = useState<OverviewFormData>({
    name: activeGroup?.name || '',
    description: activeGroup?.description || '',
    isPublic: activeGroup?.isPublic || false,
  });

  const handleFormChange = (data: OverviewFormData) => {
    setFormData(data);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGroup(groupId, {
        name: formData.name,
        description: formData.description || null,
        isPublic: formData.isPublic,
      });
      setHasChanges(false);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to save:', error);
      HapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: activeGroup?.name || '',
      description: activeGroup?.description || '',
      isPublic: activeGroup?.isPublic || false,
    });
    setHasChanges(false);
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(groupId);
      HapticFeedback.warning();
      navigate('/groups');
    } catch (error) {
      logger.error('Failed to leave group:', error);
      HapticFeedback.error();
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(groupId);
      HapticFeedback.warning();
      navigate('/groups');
    } catch (error) {
      logger.error('Failed to delete group:', error);
      HapticFeedback.error();
    }
  };

  return {
    activeGroup,
    activeTab,
    setActiveTab,
    isOwner,
    formData,
    handleFormChange,
    hasChanges,
    isSaving,
    handleSave,
    handleReset,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleLeave,
    handleDelete,
  };
}
