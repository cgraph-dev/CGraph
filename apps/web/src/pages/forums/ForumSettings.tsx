import { Link } from 'react-router-dom';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useForumSettings } from '@/pages/forums/forum-settings/useForumSettings';
import {
  GeneralSection,
  PrivacySection,
  ContentSection,
  DangerZone,
} from '@/pages/forums/forum-settings/SettingsSections';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function ForumSettings() {
  const {
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
  } = useForumSettings();

  if (!forum) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to={`/forums/${forumSlug}`}
            className="rounded-lg p-2 transition-colors hover:bg-dark-700"
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
          <div className="mb-6 rounded-lg border border-red-500 bg-red-500/20 p-4 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-500 bg-green-500/20 p-4 text-green-400">
            {success}
          </div>
        )}

        {/* Settings Form */}
        <form action={handleSave} className="space-y-8">
          <GeneralSection
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
          />
          <PrivacySection isPublic={isPublic} setIsPublic={setIsPublic} />
          <ContentSection isNsfw={isNsfw} setIsNsfw={setIsNsfw} />

          {/* Save Button */}
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving...">
              Save Changes
            </SubmitButton>
          </div>
        </form>

        <DangerZone
          forumName={forum.name}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          deleteConfirmText={deleteConfirmText}
          setDeleteConfirmText={setDeleteConfirmText}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
