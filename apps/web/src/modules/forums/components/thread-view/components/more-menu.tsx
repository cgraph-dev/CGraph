/**
 * More Options Menu Component
 * @module modules/forums/components/thread-view/components/more-menu
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilIcon,
  TrashIcon,
  FlagIcon,
  MapPinIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import type { Post } from '@/stores/forumStore';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  canEdit: boolean;
  canModerate: boolean;
  onEdit?: () => void;
  onPin?: () => Promise<void>;
  onLock?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onReport?: () => void;
}

export function MoreMenu({
  isOpen,
  onClose,
  post,
  canEdit,
  canModerate,
  onEdit,
  onPin,
  onLock,
  onDelete,
  onReport,
}: MoreMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
        >
          {canEdit && (
            <button
              onClick={() => {
                onEdit?.();
                onClose();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          )}
          {canModerate && (
            <>
              <button
                onClick={() => {
                  onPin?.();
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
              >
                <MapPinIcon className="h-4 w-4" />
                {post.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => {
                  onLock?.();
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
              >
                <LockClosedIcon className="h-4 w-4" />
                {post.isLocked ? 'Unlock' : 'Lock'}
              </button>
              <hr className="my-1 border-dark-600" />
              <button
                onClick={() => {
                  onDelete?.();
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-600"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => {
              onReport?.();
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-dark-600"
          >
            <FlagIcon className="h-4 w-4" />
            Report
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
