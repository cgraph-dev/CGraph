/**
 * Comment Form Component
 * @module modules/forums/components/thread-view/components/comment-form
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentFormProps {
  isOpen: boolean;
  content: string;
  setContent: (content: string) => void;
  isSubmitting: boolean;
  primaryColor: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CommentForm({
  isOpen,
  content,
  setContent,
  isSubmitting,
  primaryColor,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 overflow-hidden"
          id="comment-form"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="focus:border-primary w-full resize-none rounded-lg border border-dark-600 bg-dark-700 p-3 focus:outline-none"
            rows={4}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties} // safe downcast – CSS custom properties
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSubmit}
              disabled={!content.trim() || isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: primaryColor,
                color: 'white',
              }}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
