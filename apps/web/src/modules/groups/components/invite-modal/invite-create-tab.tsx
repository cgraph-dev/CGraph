/**
 * Invite link creation tab component.
 * @module
 */
import { motion, AnimatePresence } from 'motion/react';
import {
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { EXPIRATION_OPTIONS, MAX_USES_OPTIONS } from './useInviteManager';

interface InviteCreateTabProps {
  expiration: number | null;
  setExpiration: (val: number | null) => void;
  maxUses: number | null;
  setMaxUses: (val: number | null) => void;
  isGenerating: boolean;
  inviteLink: string;
  copied: boolean;
  onGenerate: () => void;
  onCopyLink: (link: string) => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Invite Create Tab component.
 */
export function InviteCreateTab({
  expiration,
  setExpiration,
  maxUses,
  setMaxUses,
  isGenerating,
  inviteLink,
  copied,
  onGenerate,
  onCopyLink,
}: InviteCreateTabProps) {
  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Settings */}
      <div className="mb-6 space-y-4">
        {/* Expiration */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
            <ClockIcon className="h-4 w-4" />
            Expire after
          </label>
          <select
            value={expiration ?? ''}
            onChange={(e) => setExpiration(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          >
            {EXPIRATION_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Uses */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
            <UserGroupIcon className="h-4 w-4" />
            Max number of uses
          </label>
          <select
            value={maxUses ?? ''}
            onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          >
            {MAX_USES_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white disabled:opacity-50"
      >
        <PlusIcon className="h-5 w-5" />
        {isGenerating ? 'Generating...' : 'Generate New Link'}
      </motion.button>

      {/* Generated Link */}
      <AnimatePresence>
        {inviteLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 rounded-xl border border-gray-700 bg-dark-800 px-4 py-3 text-sm text-white"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCopyLink(inviteLink)}
                className="rounded-xl bg-primary-600 p-3 text-white"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
