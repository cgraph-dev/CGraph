/**
 * Organizations Panel
 *
 * Admin panel for managing enterprise organizations.
 * Lists organizations, view details, membership management.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { organizationsApi } from '../../api/enterprise-api';
import type { Organization } from '../../api/enterprise-types';

function OrgRow({
  org,
  onSelect,
}: {
  org: Organization;
  onSelect: (org: Organization) => void;
}): React.ReactElement {
  return (
    <button
      onClick={() => onSelect(org)}
      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        {org.logoUrl ? (
          <img src={org.logoUrl} alt={org.name} className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            {org.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-white">{org.name}</p>
          <p className="text-sm text-gray-400">/{org.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
          {org.subscriptionTier}
        </span>
        <span className="text-sm text-gray-400">Max {org.maxMembers} members</span>
      </div>
    </button>
  );
}

/** Admin panel for listing, creating, and managing enterprise organizations. */
export function OrganizationsPanel(): React.ReactElement {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await organizationsApi.listOrgs();
      setOrgs(result.data);
    } catch {
      // Error handled by API layer
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrgs();
  }, [fetchOrgs]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (selectedOrg) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6 p-6"
      >
        <button
          onClick={() => setSelectedOrg(null)}
          className="text-sm text-gray-400 hover:text-white"
        >
          &larr; Back to organizations
        </button>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold text-white">{selectedOrg.name}</h2>
          <p className="mt-1 text-sm text-gray-400">/{selectedOrg.slug}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Tier:</span>{' '}
              <span className="text-white">{selectedOrg.subscriptionTier}</span>
            </div>
            <div>
              <span className="text-gray-400">Max Members:</span>{' '}
              <span className="text-white">{selectedOrg.maxMembers}</span>
            </div>
            <div>
              <span className="text-gray-400">Created:</span>{' '}
              <span className="text-white">
                {new Date(selectedOrg.insertedAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Owner ID:</span>{' '}
              <span className="font-mono text-xs text-white">{selectedOrg.ownerId}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="organizations"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <span className="text-sm text-gray-400">
          {orgs.length} organization{orgs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-400">No organizations yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <OrgRow key={org.id} org={org} onSelect={setSelectedOrg} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
