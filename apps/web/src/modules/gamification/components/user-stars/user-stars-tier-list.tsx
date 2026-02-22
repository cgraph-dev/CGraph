/**
 * UserStarsTierList Component
 *
 * Displays all available tiers for documentation/help pages.
 */

import { USER_TIERS } from './constants';
import { UserStars } from './user-stars';

export function UserStarsTierList() {
  return (
    <div className="space-y-2">
      {USER_TIERS.map((tier) => (
        <div
          key={tier.name}
          className="flex items-center justify-between rounded-lg border border-dark-600 bg-dark-800/50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <UserStars postCount={tier.minPosts} size="md" compact animated={false} />
            <div>
              <span className="font-medium" style={{ color: tier.color }}>
                {tier.name}
              </span>
              <p className="text-sm text-gray-500">{tier.description}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            {tier.maxPosts
              ? `${tier.minPosts.toLocaleString()} - ${tier.maxPosts.toLocaleString()}`
              : `${tier.minPosts.toLocaleString()}+`}
            <span className="ml-1 text-gray-600">posts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
