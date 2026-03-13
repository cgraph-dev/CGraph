/**
 * Board Permissions Page
 *
 * Route: /forums/:forumId/boards/:boardId/permissions
 *
 * @module pages/forums/board-permissions
 */

import { useParams } from 'react-router-dom';
import { BoardPermissionsPanel } from '@/modules/forums/components/forum-permissions/board-permissions-panel';

/** Board Permissions Page component. */
export default function BoardPermissionsPage() {
  const { forumId, boardId } = useParams<{ forumId: string; boardId: string }>();

  if (!forumId || !boardId) {
    return <div className="p-8 text-center text-gray-400">Board not found</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BoardPermissionsPanel forumId={forumId} boardId={boardId} />
    </div>
  );
}
