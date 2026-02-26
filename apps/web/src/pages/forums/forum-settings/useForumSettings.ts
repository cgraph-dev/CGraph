/**
 * Hook for forum settings state management.
 * @module
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing forum settings.
 */
export function useForumSettings() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { forums, fetchForum, updateForum, deleteForum } = useForumStore();

  const forum = forums.find((f) => f.slug === forumSlug);
  const isOwner = forum?.ownerId === user?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isNsfw, setIsNsfw] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

  useEffect(() => {
    if (forum) {
      setName(forum.name);
      setDescription(forum.description || '');
      setIsPublic(forum.isPublic ?? true);
      setIsNsfw(forum.isNsfw ?? false);
    }
  }, [forum]);

  useEffect(() => {
    if (forum && !isOwner) {
      navigate(`/forums/${forumSlug}`);
    }
  }, [forum, isOwner, navigate, forumSlug]);

  const handleSave = async () => {
    if (!forum) return;

    setError(null);
    setSuccess(null);

    try {
      await updateForum(forum.id, { name, description, isPublic, isNsfw });
      setSuccess('Settings saved successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!forum || deleteConfirmText !== forum.name) return;

    try {
      await deleteForum(forum.id);
      navigate('/forums');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete forum';
      setError(errorMessage);
    }
  };

  return {
    forumSlug,
    forum,
    isOwner,
    name,
    setName,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    isNsfw,
    setIsNsfw,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmText,
    setDeleteConfirmText,
    error,
    success,
    handleSave,
    handleDelete,
  };
}
