/**
 * SSO Settings Panel
 *
 * Admin panel for managing SSO providers (SAML/OIDC)
 * for enterprise organizations.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ssoApi } from '../../api/enterprise-api';
import type { SSOProvider } from '../../api/enterprise-types';

function ProviderCard({
  provider,
  onToggle,
  onDelete,
}: {
  provider: SSOProvider;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
          {provider.type === 'saml' ? '🔐' : '🔑'}
        </div>
        <div>
          <p className="font-medium text-white">{provider.name}</p>
          <p className="text-sm text-gray-400">
            {provider.type.toUpperCase()} &bull; Created{' '}
            {new Date(provider.insertedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(provider.id, !provider.enabled)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            provider.enabled
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
        >
          {provider.enabled ? 'Enabled' : 'Disabled'}
        </button>
        <button
          onClick={() => onDelete(provider.id)}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Manages SSO provider configuration including SAML and OIDC setup. */
export function SSOSettingsPanel(): React.ReactElement {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // In a real implementation, org_id would come from route params or selected org
  const orgId = 'current';

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ssoApi.listProviders(orgId);
      setProviders(result);
    } catch {
      // Error handled by API layer
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchProviders();
  }, [fetchProviders]);

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      await ssoApi.updateProvider(id, { enabled });
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
    } catch {
      // Error handled by API layer
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await ssoApi.deleteProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Error handled by API layer
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      key="sso-settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SSO Settings</h1>
          <p className="mt-1 text-sm text-gray-400">Configure SAML and OIDC identity providers</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + Add Provider
        </button>
      </div>

      {showAddForm && (
        <AddProviderForm
          orgId={orgId}
          onCreated={(provider) => {
            setProviders((prev) => [...prev, provider]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {providers.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-lg text-gray-400">No SSO providers configured</p>
          <p className="mt-2 text-sm text-gray-500">
            Add a SAML or OIDC provider to enable single sign-on
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Add Provider Form
// ============================================================================

function AddProviderForm({
  orgId,
  onCreated,
  onCancel,
}: {
  orgId: string;
  onCreated: (provider: SSOProvider) => void;
  onCancel: () => void;
}): React.ReactElement {
  const [name, setName] = useState('');
  const [type, setType] = useState<'saml' | 'oidc'>('oidc');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      setSubmitting(true);
      try {
        const provider = await ssoApi.createProvider({
          name: name.trim(),
          type,
          org_id: orgId,
          config:
            type === 'oidc'
              ? { client_id: '', client_secret: '', discovery_url: '' }
              : { metadata_url: '' },
        });
        onCreated(provider);
      } catch {
        // Error handled by API layer
      } finally {
        setSubmitting(false);
      }
    },
    [name, type, orgId, onCreated]
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Add SSO Provider</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Okta, Azure AD"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Type</label>
          <select
            value={type}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'saml' || val === 'oidc') {
                setType(val);
              }
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="oidc">OIDC</option>
            <option value="saml">SAML</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Provider'}
        </button>
      </div>
    </form>
  );
}
