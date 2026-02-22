/**
 * MembersSidebar Component
 *
 * Displays online and offline members in a sidebar.
 */

import { MemberItem } from './member-item';
import type { MembersSidebarProps } from './types';

export function MembersSidebar({ onlineMembers, offlineMembers }: MembersSidebarProps) {
  return (
    <div className="w-60 overflow-y-auto border-l border-dark-700 bg-dark-800">
      {/* Online members */}
      {onlineMembers.length > 0 && (
        <div className="p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
            Online — {onlineMembers.length}
          </h3>
          <div className="space-y-0.5">
            {onlineMembers.map((member) => (
              <MemberItem key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Offline members */}
      {offlineMembers.length > 0 && (
        <div className="p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
            Offline — {offlineMembers.length}
          </h3>
          <div className="space-y-0.5">
            {offlineMembers.map((member) => (
              <MemberItem key={member.id} member={member} isOffline />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
