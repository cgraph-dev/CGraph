/**
 * DeleteAccount - Self-service account deletion with confirmation
 * @module pages/settings
 *
 * GDPR-compliant account deletion:
 * - Password confirmation required
 * - "Type DELETE to confirm" safeguard
 * - 30-day grace period (soft delete → hard delete via Oban job)
 * - User can cancel by logging in within grace period
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { entranceVariants } from '@/lib/animation-presets';
import { api } from '@/lib/api';
import { useAuthStore } from '@/modules/auth/store';

/**
 * unknown for the settings module.
 */
/**
 * Delete Account component.
 */
export function DeleteAccount() {
  const { t } = useTranslation('settings');
  const { logout } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = password.length > 0 && confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setError('');

    try {
      await api.delete('/api/v1/me', {
        data: { password },
      });
      logout();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Failed to delete account. Please check your password.';
      setError(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div {...entranceVariants.fadeUp} className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('delete_account.title')}</h1>

      <GlassCard className="border border-red-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-red-500/10 p-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-400">{t('delete_account.danger_zone')}</h2>
            <p className="mt-1 text-sm text-gray-400">
              {t('delete_account.permanent_warning')}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-red-400">•</span> {t('delete_account.consequence1')}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">•</span> {t('delete_account.consequence2')}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">•</span> {t('delete_account.consequence3')}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-400">•</span> {t('delete_account.grace_period')}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          {!showConfirm ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConfirm(true)}
              className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
            >
              {t('delete_account.want_to_delete')}
            </motion.button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    {t('delete_account.confirm_password')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('delete_account.enter_password')}
                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 outline-none ring-0 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Type DELETE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Type <span className="font-mono text-red-400">DELETE</span> {t('delete_account.to_confirm')}
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 font-mono text-white placeholder-gray-500 outline-none ring-0 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      setPassword('');
                      setConfirmText('');
                      setError('');
                    }}
                    className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-700"
                  >
                    {t('common:cancel')}
                  </button>
                  <motion.button
                    whileHover={canDelete ? { scale: 1.02 } : {}}
                    whileTap={canDelete ? { scale: 0.98 } : {}}
                    onClick={handleDelete}
                    disabled={!canDelete || isDeleting}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {isDeleting ? t('delete_account.deleting') : t('delete_account.delete_my_account')}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default DeleteAccount;
