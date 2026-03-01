/**
 * Forum User Groups Page
 *
 * Route: /forums/:forumId/admin/user-groups
 * Wraps UserGroupManager with page layout.
 *
 * @module pages/forums/forum-user-groups
 */

import { useParams } from 'react-router-dom';
import { UserGroupManager } from '@/modules/forums/components/user-groups/user-group-manager';

export default function ForumUserGroupsPage() {
  const { forumId } = useParams<{ forumId: string }>();

  if (!forumId) {
    return <div className="p-8 text-center text-gray-400">Forum not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <UserGroupManager forumId={forumId} />
    </div>
  );
}
