/**
 * AppealsQueue - Review moderation appeals from users
 * Shows pending appeals with approve/deny actions
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { entranceVariants, staggerConfigs } from '@/lib/animation-presets/presets';
import { ShieldExclamationIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface Appeal {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  restriction_type: string;
  restriction_reason: string;
  appeal_message: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  reviewed_at?: string;
  reviewer_name?: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'denied';

/**
 *
 */
export function AppealsQueue({ groupId }: { groupId: string }) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const { data } = await api.get(`/api/v1/groups/${groupId}/appeals?${params}`);
      setAppeals(data.data || []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [groupId, filter]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleReview = async (appealId: string, decision: 'approved' | 'denied') => {
    try {
      await api.put(`/api/v1/groups/${groupId}/appeals/${appealId}/review`, {
        decision,
        reason: reviewReason,
      });
      setAppeals((prev) =>
        prev.map((a) =>
          a.id === appealId ? { ...a, status: decision, reviewed_at: new Date().toISOString() } : a
        )
      );
      setReviewingId(null);
      setReviewReason('');
    } catch {
      // noop
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-500/10',
    approved: 'text-green-400 bg-green-500/10',
    denied: 'text-red-400 bg-red-500/10',
  };

  const restrictionLabels: Record<string, string> = {
    ban: 'Banned',
    mute: 'Muted',
    kick: 'Kicked',
    timeout: 'Timed Out',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldExclamationIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Appeals Queue</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">
            {appeals.filter((a) => a.status === 'pending').length} pending
          </span>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 rounded-lg bg-dark-700 p-1">
          {(['all', 'pending', 'approved', 'denied'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Appeals list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : appeals.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <ShieldExclamationIcon className="mb-3 h-12 w-12 text-white/10" />
          <p className="text-sm text-white/40">No {filter !== 'all' ? filter : ''} appeals</p>
        </div>
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            animate: { transition: { staggerChildren: staggerConfigs.fast.staggerChildren } },
          }}
          className="space-y-3"
        >
          {appeals.map((appeal) => (
            <motion.div
              key={appeal.id}
              variants={entranceVariants.fadeUp}
              className="rounded-xl border border-white/5 bg-dark-700/50 p-4"
            >
              {/* Appeal header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                    {appeal.user_avatar ? (
                      <img
                        src={appeal.user_avatar}
                        alt={appeal.user_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-white">
                        {appeal.user_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{appeal.user_name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[appeal.status]}`}
                      >
                        {appeal.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span>
                        {restrictionLabels[appeal.restriction_type] || appeal.restriction_type}
                      </span>
                      <span>·</span>
                      <span>{formatDate(appeal.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restriction reason */}
              <div className="mt-3 rounded-lg bg-red-500/5 px-3 py-2">
                <p className="text-xs font-medium text-red-300/60">Original Restriction</p>
                <p className="mt-0.5 text-sm text-white/60">{appeal.restriction_reason}</p>
              </div>

              {/* Appeal message */}
              <div className="mt-2 rounded-lg bg-white/5 px-3 py-2">
                <p className="text-xs font-medium text-white/40">Appeal Message</p>
                <p className="mt-0.5 text-sm text-white/70">{appeal.appeal_message}</p>
              </div>

              {/* Actions (only for pending) */}
              {appeal.status === 'pending' && (
                <div className="mt-3">
                  {reviewingId === appeal.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                        placeholder="Add a note (optional)..."
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(appeal.id, 'approved')}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve & Lift
                        </button>
                        <button
                          onClick={() => handleReview(appeal.id, 'denied')}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Deny
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setReviewReason('');
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs text-white/40 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(appeal.id)}
                      className="text-sm text-primary-400 hover:text-primary-300"
                    >
                      Review Appeal →
                    </button>
                  )}
                </div>
              )}

              {/* Reviewed info */}
              {appeal.reviewed_at && (
                <p className="mt-2 text-xs text-white/20">
                  Reviewed by {appeal.reviewer_name} on {formatDate(appeal.reviewed_at)}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
