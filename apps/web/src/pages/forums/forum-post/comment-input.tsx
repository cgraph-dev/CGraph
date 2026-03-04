/**
 * Comment input section with textarea and submit button.
 * @module pages/forums/forum-post/comment-input
 */
/**
 * Comment Input Section
 *
 * Renders either a locked-post notice or the comment textarea
 * with submit button. Used at the bottom of the ForumPost page.
 *
 * @module pages/forums/forum-post/CommentInput
 */

import { LockClosedIcon } from '@heroicons/react/24/outline';

/** Props for CommentInput */
export interface CommentInputProps {
  /** Whether the post is locked (disables commenting) */
  isLocked: boolean;
  /** Current user's display name */
  username?: string;
  /** Current comment text */
  value: string;
  /** Update comment text */
  onChange: (value: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Whether submission is in progress */
  isSubmitting: boolean;
}

/** Comment input area or locked notice */
export function CommentInput({
  isLocked,
  username,
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: CommentInputProps) {
  if (isLocked) {
    return (
      <div className="mt-4 rounded-lg border border-yellow-600/50 bg-white/[0.04] p-4">
        <div className="flex items-center gap-3 text-yellow-400">
          <LockClosedIcon className="h-5 w-5" />
          <p className="text-sm">This post is locked. New comments are disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <p className="mb-2 text-sm text-gray-400">
        Comment as <span className="text-primary-400">{username}</span>
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What are your thoughts?"
        rows={4}
        className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-white placeholder-white/30 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          className="rounded-full bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Comment'}
        </button>
      </div>
    </div>
  );
}
