/**
 * Create Group Modal
 *
 * Modal dialog for creating a new group.
 * Uses React 19 useActionState for form state management.
 */

import { useState, useActionState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import type { CreateGroupModalProps } from './types';

const logger = createLogger('CreateGroupModal');

interface CreateGroupState {
  error: string | null;
}

export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const { createGroup } = useGroupStore();
  const [isPublic, setIsPublic] = useState(true);
  const navigate = useNavigate();

  function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  }

  const [state, formAction, isPending] = useActionState(
    async (_prev: CreateGroupState, formData: FormData): Promise<CreateGroupState> => {
      const name = getFormString(formData, 'name').trim();
      const description = getFormString(formData, 'description').trim();

      if (!name) return { error: 'Group name is required' };

      try {
        if (onSubmit) {
          await onSubmit({ name, description, isPublic });
        } else {
          const group = await createGroup({
            name,
            description: description || undefined,
            isPublic,
          });
          navigate(`/groups/${group.id}`);
        }
        HapticFeedback.success();
        onClose();
        return { error: null };
      } catch (error) {
        logger.error('Failed to create group:', error);
        HapticFeedback.error();
        return { error: 'Failed to create group. Please try again.' };
      }
    },
    { error: null }
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard variant="crystal" glow className="p-6">
              <div className="mb-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4 inline-block"
                >
                  <SparklesIcon className="h-12 w-12 text-primary-400" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">Create a Group</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Build your community with friends and like-minded people
                </p>
              </div>

              <form action={formAction}>
                {state.error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {state.error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Group Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="My Awesome Group"
                      required
                      className="w-full rounded-xl border border-gray-700 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Description (optional)
                    </label>
                    <textarea
                      name="description"
                      placeholder="What's your group about?"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-700 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-dark-800 p-4">
                    <div>
                      <span className="font-medium text-white">Public Group</span>
                      <p className="text-xs text-gray-400">Anyone can discover and join</p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsPublic(!isPublic)}
                      className={`h-6 w-12 rounded-full transition-colors ${
                        isPublic ? 'bg-primary-600' : 'bg-dark-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: isPublic ? 24 : 0 }}
                        className="h-6 w-6 rounded-full bg-white shadow-lg"
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl bg-dark-700 py-3 text-gray-300 transition-colors hover:bg-dark-600"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-primary-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? 'Creating...' : 'Create Group'}
                  </motion.button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
