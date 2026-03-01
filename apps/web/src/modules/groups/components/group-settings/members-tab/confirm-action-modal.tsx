/**
 * ConfirmActionModal - Confirmation dialog for kick/ban/mute actions
 * @module modules/groups/components/group-settings/members-tab
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { MemberAction } from './types';

interface ConfirmActionModalProps {
  action: MemberAction;
  memberId: string;
  banDuration: string;
  reason: string;
  onBanDurationChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onConfirm: (memberId: string, action: MemberAction) => void;
  onClose: () => void;
}

const ACTION_TITLES: Record<MemberAction, string> = {
  none: '',
  kick: 'Kick Member',
  ban: 'Ban Member',
  mute: 'Mute Member',
};

const ACTION_DESCRIPTIONS: Record<MemberAction, string> = {
  none: '',
  kick: 'This member will be removed from the group. They can rejoin via invite.',
  ban: 'This member will be banned. They cannot rejoin until unbanned.',
  mute: 'This member will be muted for 10 minutes.',
};

const ACTION_BUTTON_COLORS: Record<MemberAction, string> = {
  none: '',
  kick: 'bg-yellow-600 hover:bg-yellow-700',
  ban: 'bg-red-600 hover:bg-red-700',
  mute: 'bg-orange-600 hover:bg-orange-700',
};

const ACTION_LABELS: Record<MemberAction, string> = {
  none: '',
  kick: 'Kick',
  ban: 'Ban',
  mute: 'Mute',
};

/**
 * unknown for the groups module.
 */
/**
 * Confirm Action Modal dialog component.
 */
export function ConfirmActionModal({
  action,
  memberId,
  banDuration,
  reason,
  onBanDurationChange,
  onReasonChange,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  return (
    <AnimatePresence>
      {action !== 'none' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">
              {ACTION_TITLES[action]}
            </h3>
            <p className="text-sm text-gray-400">
              {ACTION_DESCRIPTIONS[action]}
            </p>

            {action === 'ban' && (
              <select
                value={banDuration}
                onChange={(e) => onBanDurationChange(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white"
              >
                <option value="permanent">Permanent</option>
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            )}

            {(action === 'kick' || action === 'ban') && (
              <textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Reason (optional)"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirm(memberId, action)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${ACTION_BUTTON_COLORS[action]}`}
              >
                Confirm {ACTION_LABELS[action]}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
