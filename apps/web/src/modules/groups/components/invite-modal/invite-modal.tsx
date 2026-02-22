import { motion, AnimatePresence } from 'framer-motion';
import { LinkIcon } from '@heroicons/react/24/outline';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { GlassCard } from '@/shared/components/ui';
import { useInviteManager } from './useInviteManager';
import { InviteCreateTab } from './invite-create-tab';
import { InviteManageTab } from './invite-manage-tab';

interface InviteModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export function InviteModal({ groupId, groupName, onClose }: InviteModalProps) {
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];
  const mgr = useInviteManager(groupId);

  return (
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
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="overflow-hidden p-0">
          {/* Header */}
          <div className="border-b border-gray-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: colors.primary + '20' }}>
                <LinkIcon className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite People</h2>
                <p className="text-sm text-gray-400">to {groupName}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-2">
              {[
                { id: 'create' as const, label: 'Create Invite' },
                { id: 'manage' as const, label: 'Manage Invites' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => mgr.setActiveTab(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    mgr.activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {mgr.activeTab === 'create' ? (
                <InviteCreateTab
                  expiration={mgr.expiration}
                  setExpiration={mgr.setExpiration}
                  maxUses={mgr.maxUses}
                  setMaxUses={mgr.setMaxUses}
                  isGenerating={mgr.isGenerating}
                  inviteLink={mgr.inviteLink}
                  copied={mgr.copied}
                  onGenerate={mgr.handleGenerateInvite}
                  onCopyLink={mgr.handleCopyLink}
                />
              ) : (
                <InviteManageTab
                  invites={mgr.invites}
                  onCopyLink={mgr.handleCopyLink}
                  onDeleteInvite={mgr.handleDeleteInvite}
                  formatExpiration={mgr.formatExpiration}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700/50 p-4">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-dark-700 py-2 text-gray-300 transition-colors hover:bg-dark-600"
            >
              Close
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default InviteModal;
