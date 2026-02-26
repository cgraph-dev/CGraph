/**
 * Forum settings sections UI components.
 * @module
 */
import {
  GlobeAltIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/* ── General Settings ──────────────────────────────────────────────── */

interface GeneralSectionProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * General Section section component.
 */
export function GeneralSection({
  name,
  setName,
  description,
  setDescription,
}: GeneralSectionProps) {
  return (
    <section className="rounded-xl bg-dark-800 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">General</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Forum Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe what your forum is about..."
          />
        </div>
      </div>
    </section>
  );
}

/* ── Privacy Settings ──────────────────────────────────────────────── */

interface PrivacySectionProps {
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Privacy Section section component.
 */
export function PrivacySection({ isPublic, setIsPublic }: PrivacySectionProps) {
  return (
    <section className="rounded-xl bg-dark-800 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Privacy</h2>
      <div className="space-y-4">
        <label className="flex cursor-pointer items-start gap-4 rounded-lg bg-dark-700 p-4 transition-colors hover:bg-dark-600">
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
            <p className="mt-1 text-sm text-gray-400">
              Anyone can view, join, and participate in this forum.
            </p>
          </div>
        </label>
        <label className="flex cursor-pointer items-start gap-4 rounded-lg bg-dark-700 p-4 transition-colors hover:bg-dark-600">
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
            <p className="mt-1 text-sm text-gray-400">
              Only members can view content. Users must request to join or be invited.
            </p>
          </div>
        </label>
      </div>
    </section>
  );
}

/* ── Content Settings ──────────────────────────────────────────────── */

interface ContentSectionProps {
  isNsfw: boolean;
  setIsNsfw: (v: boolean) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Content Section section component.
 */
export function ContentSection({ isNsfw, setIsNsfw }: ContentSectionProps) {
  return (
    <section className="rounded-xl bg-dark-800 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Content</h2>
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isNsfw}
          onChange={(e) => setIsNsfw(e.target.checked)}
          className="h-5 w-5 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
        />
        <div>
          <span className="font-medium text-white">NSFW Content</span>
          <p className="text-sm text-gray-400">Mark this forum as containing adult content (18+)</p>
        </div>
      </label>
    </section>
  );
}

/* ── Danger Zone ───────────────────────────────────────────────────── */

interface DangerZoneProps {
  forumName: string;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  onDelete: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Danger Zone component.
 */
export function DangerZone({
  forumName,
  showDeleteConfirm,
  setShowDeleteConfirm,
  deleteConfirmText,
  setDeleteConfirmText,
  onDelete,
}: DangerZoneProps) {
  return (
    <section className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-400">
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
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="mt-4 rounded-lg bg-dark-800 p-4">
          <p className="mb-3 text-sm text-gray-300">
            Type <span className="font-mono text-red-400">{forumName}</span> to confirm deletion:
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="mb-3 w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white"
            placeholder={forumName}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}
              className="rounded-lg bg-dark-600 px-4 py-2 text-white transition-colors hover:bg-dark-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteConfirmText !== forumName}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-600/50"
            >
              Delete Forever
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
