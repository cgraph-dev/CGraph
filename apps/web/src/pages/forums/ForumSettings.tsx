import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  LockClosedIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function ForumSettings() {
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
  const [isSaving, setIsSaving] = useState(false);
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

  // Redirect if not owner
  useEffect(() => {
    if (forum && !isOwner) {
      navigate(`/forums/${forumSlug}`);
    }
  }, [forum, isOwner, navigate, forumSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forum) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateForum(forum.id, {
        name,
        description,
        isPublic,
        isNsfw,
      });
      setSuccess('Settings saved successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
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

  if (!forum) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={`/forums/${forumSlug}`}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-8 w-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Forum Settings</h1>
              <p className="text-sm text-gray-400">Manage c/{forum.name}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-8">
          {/* General Settings */}
          <section className="bg-dark-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">General</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Forum Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Describe what your forum is about..."
                />
              </div>
            </div>
          </section>

          {/* Privacy Settings */}
          <section className="bg-dark-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Privacy</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-white">Public</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Anyone can view, join, and participate in this forum.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <LockClosedIcon className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-white">Private</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Only members can view content. Users must request to join or be invited.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Content Settings */}
          <section className="bg-dark-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Content</h2>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isNsfw}
                onChange={(e) => setIsNsfw(e.target.checked)}
                className="w-5 h-5 rounded bg-dark-700 border-dark-600 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-white">NSFW Content</span>
                <p className="text-sm text-gray-400">
                  Mark this forum as containing adult content (18+)
                </p>
              </div>
            </label>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <section className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Danger Zone
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Delete Forum</h3>
              <p className="text-sm text-gray-400">
                Permanently delete this forum and all its content. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-dark-800 rounded-lg">
              <p className="text-sm text-gray-300 mb-3">
                Type <span className="font-mono text-red-400">{forum.name}</span> to confirm deletion:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white mb-3"
                placeholder={forum.name}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== forum.name}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
