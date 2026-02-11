import { useParams, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { springs } from '@/lib/animation-presets/presets';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  CreditCardIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// These components are available for extended settings functionality
import AppearanceSettingsEnhanced from '@/modules/settings/components/AppearanceSettingsEnhanced';
import ChatBubbleSettings from '@/modules/settings/components/ChatBubbleSettings';
import UICustomizationSettings from '@/modules/settings/components/UICustomizationSettings';
import AvatarSettings from '@/modules/settings/components/AvatarSettings';
import { AccountSettings } from '@/modules/settings/components/AccountSettings';
import { default as DeleteAccount } from '@/pages/settings/DeleteAccount';
import { default as DataExport } from '@/pages/settings/DataExport';
import {
  SecuritySettingsPanel,
  NotificationSettingsPanel,
  LanguageSettingsPanel,
  SessionsSettingsPanel,
  PrivacySettingsPanel,
  BillingSettingsPanel,
  RedirectToCustomize,
} from '@/modules/settings/components/panels';

// Reserved for extended settings - mark as used to prevent tree-shaking removal
const _extendedSettingsComponents = {
  AppearanceSettingsEnhanced,
  ChatBubbleSettings,
  UICustomizationSettings,
  AvatarSettings,
};
const _extendedIcons = {
  PaintBrushIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
};
void _extendedSettingsComponents;
void _extendedIcons;

// Settings simplified from 11 to 5 sections
// Moved to /customize: appearance, ui-customization, chat-bubbles, avatar
// Removed: language (use browser default), sessions (view in security)
const settingsSections = [
  { id: 'account', label: 'Account', icon: UserIcon, description: 'Email, username, password' },
  {
    id: 'security',
    label: 'Security',
    icon: ShieldCheckIcon,
    description: '2FA, sessions, API keys',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    description: 'Push, email, preferences',
  },
  { id: 'privacy', label: 'Privacy', icon: KeyIcon, description: 'Visibility, blocked users' },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCardIcon,
    description: 'Subscription, payment methods',
  },
  {
    id: 'data-export',
    label: 'Data Export',
    icon: ArrowDownTrayIcon,
    description: 'Download your data (GDPR)',
  },
  {
    id: 'delete-account',
    label: 'Delete Account',
    icon: TrashIcon,
    description: 'Permanently delete account',
  },
];

export default function Settings() {
  const { section = 'account' } = useParams();

  return (
    <div className="relative flex flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Sidebar */}
      <nav className="relative z-10 w-56 overflow-y-auto border-r border-primary-500/20 bg-dark-900/50 p-4 backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <h2 className="mb-4 flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-lg font-bold text-transparent">
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            Settings
          </h2>
          <div className="space-y-1">
            {settingsSections.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.bouncy, delay: 0.05 }}
              >
                <NavLink
                  to={`/settings/${item.id}`}
                  onClick={() => HapticFeedback.light()}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 ${
                      isActive || (item.id === 'account' && section === undefined)
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active/Hover background */}
                      {isActive ? (
                        <motion.div
                          layoutId="activeSettingsTab"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent"
                          transition={springs.stiff}
                        />
                      ) : (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/0 via-purple-500/0 to-transparent opacity-0 transition-all duration-300 group-hover:from-primary-500/10 group-hover:via-purple-500/10 group-hover:opacity-100" />
                      )}

                      {/* Icon with glow */}
                      <item.icon
                        className={`relative z-10 h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                          isActive ? 'text-primary-400' : 'group-hover:scale-110'
                        }`}
                        style={
                          isActive ? { filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' } : {}
                        }
                      />
                      <div className="relative z-10 flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-white/40 transition-colors group-hover:text-white/60">
                          {item.description}
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-500"
                          layoutId="settingsActiveIndicator"
                          initial={false}
                          transition={springs.stiff}
                          style={{
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {section === 'account' && <AccountSettings key="account" />}
            {section === 'security' && <SecuritySettingsPanel key="security" />}
            {section === 'notifications' && <NotificationSettingsPanel key="notifications" />}
            {section === 'privacy' && <PrivacySettingsPanel key="privacy" />}
            {section === 'billing' && <BillingSettingsPanel key="billing" />}
            {section === 'data-export' && <DataExport key="data-export" />}
            {section === 'delete-account' && <DeleteAccount key="delete-account" />}

            {/* Redirects for removed sections - now in /customize */}
            {section === 'appearance' && <RedirectToCustomize section="themes" />}
            {section === 'ui-customization' && <RedirectToCustomize section="effects" />}
            {section === 'chat-bubbles' && <RedirectToCustomize section="chat" />}
            {section === 'avatar' && <RedirectToCustomize section="identity" />}
            {section === 'language' && <LanguageSettingsPanel key="language" />}
            {section === 'sessions' && <SessionsSettingsPanel key="sessions" />}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
