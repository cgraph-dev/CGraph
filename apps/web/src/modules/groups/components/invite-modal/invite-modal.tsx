/**
 * Group invite modal dialog component.
 * @module
 */
import { AnimatePresence, motion } from 'framer-motion';
import { LinkIcon } from '@heroicons/react/24/outline';
import { LGModal, LGButton, springPreset } from '@/components/liquid-glass';
import { useInviteManager } from './useInviteManager';
import { InviteCreateTab } from './invite-create-tab';
import { InviteManageTab } from './invite-manage-tab';

interface InviteModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

/**
 * Invite Modal dialog component — liquid glass variant.
 */
export function InviteModal({ groupId, groupName, onClose }: InviteModalProps) {
  const mgr = useInviteManager(groupId);

  return (
    <LGModal
      open
      onClose={onClose}
      size="lg"
      title="Invite People"
      description={`to ${groupName}`}
      footer={
        <LGButton variant="ghost" onClick={onClose} className="w-full">
          Close
        </LGButton>
      }
    >
      {/* Header icon + Tabs */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
          <LinkIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'create' as const, label: 'Create Invite' },
            { id: 'manage' as const, label: 'Manage Invites' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              transition={springPreset}
              onClick={() => mgr.setActiveTab(tab.id)}
              className={`cursor-pointer rounded-[var(--lg-radius-xs)] px-4 py-2 text-sm font-medium transition-colors ${
                mgr.activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(147,197,253,0.3)]'
                  : 'bg-white/[0.06] text-slate-500 hover:bg-white/[0.12] hover:text-slate-800 dark:bg-white/[0.06] dark:text-gray-400 dark:hover:bg-white/[0.10] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
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
    </LGModal>
  );
}

export default InviteModal;
