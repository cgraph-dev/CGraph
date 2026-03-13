/**
 * Permission Matrix — Cross-Board View
 *
 * 3D matrix: boards × groups × permissions.
 * Color-coded cells (green/red/gray), hover shows inheritance chain.
 * Export CSV, search/filter.
 *
 * @module modules/forums/components/forum-permissions/permission-matrix
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  TableCellsIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { usePermissionsStore, type PermLevel } from '../../store/forumStore.permissions';
import { useUserGroupsStore } from '../../store/forumStore.userGroups';
import { BOARD_PERMISSIONS } from '../forum-permissions/types';

interface PermissionMatrixProps {
  forumId: string;
  boards: { id: string; name: string }[];
}

type BoardPerms = Record<string, Record<string, Record<string, PermLevel>>>;

const LEVEL_COLORS: Record<PermLevel, string> = {
  allow: 'bg-green-600/40 text-green-400',
  deny: 'bg-red-600/40 text-red-400',
  inherit: 'bg-white/[0.06]/40 text-gray-500',
};

const LEVEL_LABELS: Record<PermLevel, string> = {
  allow: '✓',
  deny: '✗',
  inherit: '—',
};

/** Description. */
/** Permission Matrix component. */
export function PermissionMatrix({ forumId, boards }: PermissionMatrixProps) {
  const { groups, fetchGroups } = useUserGroupsStore();
  const { fetchBoardPermissions, boardPermissions } = usePermissionsStore();

  const [selectedBoardId, setSelectedBoardId] = useState<string>(boards[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [boardPermsCache, setBoardPermsCache] = useState<BoardPerms>({});
  const [hoveredCell, setHoveredCell] = useState<{
    board: string;
    group: string;
    perm: string;
  } | null>(null);

  useEffect(() => {
    if (groups.length === 0) fetchGroups(forumId);
  }, [forumId, groups.length, fetchGroups]);

  // Fetch permissions for all boards
  useEffect(() => {
    const fetchAll = async () => {
      for (const board of boards) {
        await fetchBoardPermissions(board.id);
      }
    };
    fetchAll();
  }, [boards, fetchBoardPermissions]);

  // Cache board permissions
  useEffect(() => {
    const cache: BoardPerms = {};
    for (const board of boards) {
      cache[board.id] = {};
      for (const group of groups) {
        cache[board.id]![group.id] = {};
        const perm = boardPermissions.find((p) => p.boardId === board.id && p.groupId === group.id);
        for (const def of BOARD_PERMISSIONS) {
          cache[board.id]![group.id]![def.key] = perm?.permissions?.[def.key] || 'inherit';
        }
      }
    }
    setBoardPermsCache(cache);
  }, [boards, groups, boardPermissions]);

  const filteredPerms = useMemo(() => {
    if (!searchQuery) return BOARD_PERMISSIONS;
    const q = searchQuery.toLowerCase();
    return BOARD_PERMISSIONS.filter(
      (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredGroups = useMemo(() => {
    if (selectedGroupId) return groups.filter((g) => g.id === selectedGroupId);
    return groups;
  }, [groups, selectedGroupId]);

  const exportCsv = useCallback(() => {
    const rows: string[] = [];
    const header = ['Board', 'Group', ...BOARD_PERMISSIONS.map((p) => p.label)];
    rows.push(header.join(','));

    for (const board of boards) {
      for (const group of groups) {
        const values = BOARD_PERMISSIONS.map(
          (p) => boardPermsCache[board.id]?.[group.id]?.[p.key] || 'inherit'
        );
        rows.push([board.name, group.name, ...values].join(','));
      }
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-matrix-${forumId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [boards, groups, boardPermsCache, forumId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TableCellsIcon className="h-6 w-6 text-cyan-500" />
          <h2 className="text-xl font-bold">Permission Matrix</h2>
          <span className="text-sm text-gray-400">
            {boards.length} boards × {groups.length} groups × {BOARD_PERMISSIONS.length} permissions
          </span>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-gray-300 transition-colors hover:bg-white/[0.06]"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions..."
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white"
          >
            <option value="">All Boards</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-green-600/40 text-xs text-green-400">
            ✓
          </span>{' '}
          Allow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-red-600/40 text-xs text-red-400">
            ✗
          </span>{' '}
          Deny
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-white/[0.06]/40 inline-flex h-4 w-4 items-center justify-center rounded text-xs text-gray-500">
            —
          </span>{' '}
          Inherit
        </span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        {(selectedBoardId ? boards.filter((b) => b.id === selectedBoardId) : boards).map(
          (board) => (
            <div key={board.id} className="mb-6">
              <h3 className="mb-2 px-1 text-sm font-semibold text-gray-300">{board.name}</h3>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="sticky left-0 z-10 min-w-[120px] bg-[rgb(30,32,40)] px-2 py-2 text-left font-medium text-gray-400">
                      Group
                    </th>
                    {filteredPerms.map((p) => (
                      <th
                        key={p.key}
                        className="min-w-[50px] px-1 py-2 text-center font-medium text-gray-400"
                        title={p.key}
                      >
                        <span className="block text-[10px] leading-tight">{p.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr key={group.id} className="border-b border-gray-800">
                      <td className="sticky left-0 z-10 bg-[rgb(30,32,40)] px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: group.color || '#6b7280' }}
                          />
                          <span className="text-white">{group.name}</span>
                        </div>
                      </td>
                      {filteredPerms.map((perm) => {
                        const level =
                          boardPermsCache[board.id]?.[group.id]?.[perm.key] || 'inherit';
                        const isHovered =
                          hoveredCell?.board === board.id &&
                          hoveredCell?.group === group.id &&
                          hoveredCell?.perm === perm.key;
                        return (
                          <td
                            key={perm.key}
                            className="relative px-1 py-1.5 text-center"
                            onMouseEnter={() =>
                              setHoveredCell({ board: board.id, group: group.id, perm: perm.key })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${LEVEL_COLORS[level]}`}
                            >
                              {LEVEL_LABELS[level]}
                            </span>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-white/[0.08] bg-[rgb(30,32,40)] px-2 py-1 text-[10px] text-gray-300 shadow-lg"
                              >
                                <div>
                                  <strong>{perm.label}</strong>
                                </div>
                                <div>Level: {level}</div>
                                <div>
                                  Source: {level === 'inherit' ? 'Forum default' : 'Board override'}
                                </div>
                              </motion.div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {boards.length === 0 && (
        <div className="py-8 text-center text-gray-400">
          No boards available. Create boards first to view the permission matrix.
        </div>
      )}
    </div>
  );
}

export default PermissionMatrix;
