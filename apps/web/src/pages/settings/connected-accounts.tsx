/**
 * ConnectedAccounts - View/manage OAuth connected accounts
 * Show linked providers, link new, unlink existing
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { entranceVariants, springs, staggerConfigs } from '@/lib/animation-presets';
import { LinkIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface ConnectedAccount {
  id: string;
  provider: string;
  provider_name: string;
  email?: string;
  linked_at: string;
}

const PROVIDERS = [
  { id: 'google', name: 'Google', icon: '🔵', color: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'apple', name: 'Apple', icon: '🍎', color: 'bg-gray-500/10 border-gray-500/20' },
  { id: 'facebook', name: 'Facebook', icon: '🔷', color: 'bg-indigo-500/10 border-indigo-500/20' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-pink-500/10 border-pink-500/20' },
];

/**
 * Connected Accounts component.
 */
export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [_loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/me/connected-accounts');
      setAccounts(data.data || []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleLink = (provider: string) => {
    // Redirect to OAuth flow
    window.location.href = `/api/v1/auth/${provider}?link=true`;
  };

  const handleUnlink = async (accountId: string) => {
    if (accounts.length <= 1) {
      alert('You must keep at least one authentication method.');
      return;
    }
    try {
      await api.delete(`/api/v1/me/connected-accounts/${accountId}`);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {
      // noop
    }
  };

  const isLinked = (provider: string) => accounts.find((a) => a.provider === provider);

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <LinkIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
        </div>
        <p className="text-sm text-white/40">
          Manage external accounts linked to your CGraph profile
        </p>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: staggerConfigs.fast.staggerChildren } },
        }}
        className="space-y-3"
      >
        {PROVIDERS.map((provider) => {
          const linked = isLinked(provider.id);
          return (
            <motion.div
              key={provider.id}
              variants={entranceVariants.fadeUp}
              className={`flex items-center justify-between rounded-xl border p-4 ${provider.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <span className="font-medium text-white">{provider.name}</span>
                  {linked && (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Connected{linked.email ? ` · ${linked.email}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {linked ? (
                <button
                  onClick={() => handleUnlink(linked.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => handleLink(provider.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  <LinkIcon className="h-4 w-4" />
                  Connect
                </button>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
