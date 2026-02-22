/**
 * Users Management Panel
 * Search, filter, and manage user accounts
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

import { userManagementApi } from '../../api/userManagementApi';
import type { AdminUser } from '../../api/types';

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userManagementApi.listUsers({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        sort: sortBy || undefined,
        page: 1,
        perPage: 20,
      });
      setUsers(result.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Users Management</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
          <button onClick={fetchUsers} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search users by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500"
        />
        <button
          onClick={handleSearch}
          className="rounded-lg bg-white/10 px-6 py-3 transition-colors hover:bg-white/20"
        >
          Search
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
        >
          <option value="">All Users</option>
          <option value="active">Active</option>
          <option value="premium">Premium</option>
          <option value="banned">Banned</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
        >
          <option value="">Sort by: Recent</option>
          <option value="level">Sort by: Level</option>
          <option value="balance">Sort by: Balance</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            Loading users...
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr className="text-left text-sm text-gray-500">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-sm ${user.isPremium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}
                      >
                        {user.isPremium ? 'Premium' : 'Member'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : user.status === 'banned'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(user.insertedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
