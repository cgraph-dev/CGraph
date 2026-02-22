/**
 * Recent Referrals
 *
 * List of recent referrals with status badges.
 */

import { Link } from 'react-router-dom';
import { UsersIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { RecentReferralsProps } from './types';

export function RecentReferrals({ referrals }: RecentReferralsProps) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b p-4">
        <h3 className="text-foreground font-semibold">Recent Referrals</h3>
        <Link
          to="/referrals/history"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          View All <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {referrals.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center">
          <UsersIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>No referrals yet</p>
          <p className="text-sm">Share your link to start earning rewards!</p>
        </div>
      ) : (
        <div className="divide-border divide-y">
          {referrals.map((referral) => (
            <div key={referral.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {referral.referredAvatarUrl ? (
                  <ThemedAvatar
                    src={referral.referredAvatarUrl}
                    alt={referral.referredUsername}
                    size="small"
                    className="h-10 w-10"
                  />
                ) : (
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <UsersIcon className="text-primary h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="text-foreground font-medium">{referral.referredUsername}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  referral.status === 'rewarded'
                    ? 'bg-green-500/10 text-green-500'
                    : referral.status === 'verified'
                      ? 'bg-blue-500/10 text-blue-500'
                      : referral.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-muted text-muted-foreground'
                }`}
              >
                {referral.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
