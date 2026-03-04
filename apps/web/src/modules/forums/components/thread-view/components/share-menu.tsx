/**
 * Share Menu Component
 * @module modules/forums/components/thread-view/components/share-menu
 */

import { motion, AnimatePresence } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
}

/**
 * unknown for the forums module.
 */
/**
 * Share Menu component.
 */
export function ShareMenu({ isOpen, onClose, postTitle }: ShareMenuProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    HapticFeedback.success();
    onClose();
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(postTitle)}`,
      '_blank'
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
        >
          <button
            onClick={copyLink}
            className="w-full px-4 py-2 text-left text-sm hover:bg-dark-600"
          >
            Copy link
          </button>
          <button
            onClick={shareOnTwitter}
            className="w-full px-4 py-2 text-left text-sm hover:bg-dark-600"
          >
            Share on Twitter
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
