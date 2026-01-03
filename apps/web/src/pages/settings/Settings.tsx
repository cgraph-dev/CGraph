import { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const settingsSections = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
  { id: 'language', label: 'Language', icon: GlobeAltIcon },
  { id: 'sessions', label: 'Sessions', icon: DevicePhoneMobileIcon },
  { id: 'privacy', label: 'Privacy', icon: KeyIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
];

export default function Settings() {
  const { section = 'account' } = useParams();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <nav className="w-56 bg-dark-800 border-r border-dark-700 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">Settings</h2>
        <div className="space-y-1">
          {settingsSections.map((item, index) => (
            <NavLink
              key={item.id}
              to={`/settings/${item.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 transform hover:translate-x-1 ${
                  isActive || (item.id === 'account' && section === undefined)
                    ? 'bg-dark-700 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                }`
              }
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl animate-fadeIn">
          {section === 'account' && <AccountSettings />}
          {section === 'security' && <SecuritySettings />}
          {section === 'notifications' && <NotificationSettings />}
          {section === 'appearance' && <AppearanceSettings />}
          {section === 'language' && <LanguageSettings />}
          {section === 'sessions' && <SessionsSettings />}
          {section === 'privacy' && <PrivacySettings />}
          {section === 'billing' && <BillingSettings />}
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const canChangeUsername = user?.canChangeUsername ?? true;
  const nextChangeDate = user?.usernameNextChangeAt 
    ? new Date(user.usernameNextChangeAt).toLocaleDateString()
    : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/api/v1/me', {
        display_name: displayName,
      });
      updateUser({ displayName: response.data.data.display_name || response.data.data.displayName });
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!username.trim() || username === user?.username) return;
    
    setIsChangingUsername(true);
    try {
      const response = await api.put('/api/v1/me/username', { username });
      updateUser({ 
        username: response.data.data.username,
        canChangeUsername: false,
        usernameNextChangeAt: response.data.data.username_next_change_at,
      });
      toast.success('Username changed successfully');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to change username';
      toast.error(errorMessage);
    } finally {
      setIsChangingUsername(false);
    }
  };

  return (
    <div className="animate-[fadeIn_300ms_ease-out]">
      <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
      
      {/* User ID Badge */}
      <div className="mb-8 p-4 bg-gradient-to-r from-primary-900/30 to-dark-800 rounded-xl border border-primary-800/30">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center ring-4 ring-primary-500/20">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                {user?.displayName || user?.username || 'Anonymous User'}
              </span>
              {user?.isVerified && (
                <span className="text-blue-400">✓</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-mono px-2 py-1 rounded bg-dark-700 text-primary-400 border border-primary-800/50">
                {user?.userIdDisplay || '#0000'}
              </span>
              {user?.username && (
                <span className="text-gray-400">@{user.username}</span>
              )}
              {user?.karma !== undefined && user.karma > 0 && (
                <span className="text-amber-400 text-sm">⚡ {user.karma.toLocaleString()} karma</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-3">Profile Picture</label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-dark-700 overflow-hidden ring-2 ring-dark-600 transition-all hover:ring-primary-500">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-95">
              Upload Image
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Username with 14-day cooldown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Username
          {!canChangeUsername && nextChangeDate && (
            <span className="ml-2 text-xs text-amber-400">
              (Can change after {nextChangeDate})
            </span>
          )}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            disabled={!canChangeUsername}
            placeholder={user?.username || 'Choose a username'}
            className={`flex-1 px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              canChangeUsername ? 'border-dark-600' : 'border-dark-600/50 text-gray-500 cursor-not-allowed'
            }`}
          />
          {canChangeUsername && username !== user?.username && username.length >= 3 && (
            <button
              onClick={handleChangeUsername}
              disabled={isChangingUsername}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/20"
            >
              {isChangingUsername ? 'Saving...' : 'Change'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {canChangeUsername 
            ? 'Username can be changed every 14 days. Letters, numbers, and underscores only.'
            : `You changed your username recently. Next change available on ${nextChangeDate}.`
          }
        </p>
      </div>

      {/* Display Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we call you?"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
      </div>

      {/* Wallet */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">Connected Wallet</label>
        {user?.walletAddress ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={user.walletAddress}
              disabled
              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-400 font-mono text-sm"
            />
            <button className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-all hover:scale-105 active:scale-95">
              Disconnect
            </button>
          </div>
        ) : (
          <button className="px-4 py-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white text-sm font-medium rounded-lg transition-all hover:border-primary-500">
            Connect Wallet
          </button>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function SecuritySettings() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Security</h1>

      {/* Password */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Password</h3>
            <p className="text-sm text-gray-400 mt-1">Change your password</p>
          </div>
          <button className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors">
            Change
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400 mt-1">
              {user?.twoFactorEnabled
                ? 'Two-factor authentication is enabled'
                : 'Add an extra layer of security'}
            </p>
          </div>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              user?.twoFactorEnabled
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
            }`}
          >
            {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Email Verification */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Email Verification</h3>
            <p className="text-sm text-gray-400 mt-1">
              {user?.emailVerifiedAt ? 'Your email is verified' : 'Verify your email address'}
            </p>
          </div>
          {!user?.emailVerifiedAt && (
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
              Verify
            </button>
          )}
          {user?.emailVerifiedAt && (
            <span className="text-green-400 text-sm">✓ Verified</span>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    messages: true,
    mentions: true,
    replies: true,
    forums: false,
    groups: true,
    email: false,
    push: true,
  });

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        value ? 'bg-primary-600' : 'bg-dark-600'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>

      <div className="space-y-4">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Direct Messages</h3>
            <p className="text-sm text-gray-400">Notify when you receive a message</p>
          </div>
          <Toggle value={settings.messages} onChange={(v) => setSettings({ ...settings, messages: v })} />
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Mentions</h3>
            <p className="text-sm text-gray-400">Notify when someone mentions you</p>
          </div>
          <Toggle value={settings.mentions} onChange={(v) => setSettings({ ...settings, mentions: v })} />
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Comment Replies</h3>
            <p className="text-sm text-gray-400">Notify when someone replies to your comment</p>
          </div>
          <Toggle value={settings.replies} onChange={(v) => setSettings({ ...settings, replies: v })} />
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Email Notifications</h3>
            <p className="text-sm text-gray-400">Receive notifications via email</p>
          </div>
          <Toggle value={settings.email} onChange={(v) => setSettings({ ...settings, email: v })} />
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Push Notifications</h3>
            <p className="text-sm text-gray-400">Receive push notifications on your devices</p>
          </div>
          <Toggle value={settings.push} onChange={(v) => setSettings({ ...settings, push: v })} />
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Appearance</h1>

      {/* Theme */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
        <div className="grid grid-cols-3 gap-4">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                theme === t
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <div
                className={`h-16 rounded-lg mb-2 ${
                  t === 'dark'
                    ? 'bg-dark-900'
                    : t === 'light'
                    ? 'bg-gray-100'
                    : 'bg-gradient-to-r from-dark-900 to-gray-100'
                }`}
              />
              <span className="text-sm font-medium text-white capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Display */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-3">Message Display</label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-800 cursor-pointer">
            <input type="radio" name="messageDisplay" defaultChecked className="text-primary-600" />
            <span className="text-white">Cozy - Modern chat experience</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-800 cursor-pointer">
            <input type="radio" name="messageDisplay" className="text-primary-600" />
            <span className="text-white">Compact - More messages on screen</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function LanguageSettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Language</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Interface Language</label>
        <select className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
        </select>
      </div>
    </div>
  );
}

function SessionsSettings() {
  const sessions = [
    { id: '1', device: 'Chrome on Windows', location: 'New York, US', lastActive: 'Now', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'New York, US', lastActive: '2 hours ago', current: false },
    { id: '3', device: 'Firefox on Mac', location: 'Los Angeles, US', lastActive: '3 days ago', current: false },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Active Sessions</h1>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-dark-800 rounded-lg border border-dark-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DevicePhoneMobileIcon className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-medium text-white">
                  {session.device}
                  {session.current && (
                    <span className="ml-2 text-xs text-green-400">(Current)</span>
                  )}
                </h3>
                <p className="text-sm text-gray-400">
                  {session.location} • {session.lastActive}
                </p>
              </div>
            </div>
            {!session.current && (
              <button className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors">
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="mt-6 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors">
        Revoke All Other Sessions
      </button>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Privacy</h1>

      <div className="space-y-4">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <h3 className="font-medium text-white mb-2">Who can send you direct messages</h3>
          <select className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
            <option>Everyone</option>
            <option>Friends Only</option>
            <option>No One</option>
          </select>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <h3 className="font-medium text-white mb-2">Who can see your online status</h3>
          <select className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
            <option>Everyone</option>
            <option>Friends Only</option>
            <option>No One</option>
          </select>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <h3 className="font-medium text-white mb-2">Who can add you to groups</h3>
          <select className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
            <option>Everyone</option>
            <option>Friends Only</option>
            <option>No One</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Billing</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-6">
        <h3 className="font-medium text-white mb-2">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">Free</p>
            <p className="text-gray-400">Basic features included</p>
          </div>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <h3 className="font-medium text-white mb-4">Pro Benefits</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Custom profile themes
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Animated avatars
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Extended file upload limits
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Priority support
          </li>
        </ul>
      </div>
    </div>
  );
}
