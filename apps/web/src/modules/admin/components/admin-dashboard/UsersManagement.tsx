/**
 * Users Management Panel
 * Search, filter, and manage user accounts
 */

import { motion } from 'framer-motion';

export function UsersManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Users Management</h1>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search users by name, email, or ID..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500"
        />
        <button className="rounded-lg bg-white/10 px-6 py-3 transition-colors hover:bg-white/20">
          Search
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <select className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white">
          <option>All Users</option>
          <option>Premium</option>
          <option>Banned</option>
          <option>Flagged</option>
        </select>
        <select className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white">
          <option>Sort by: Recent</option>
          <option>Sort by: XP</option>
          <option>Sort by: Spending</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr className="text-left text-sm text-gray-500">
              <th className="p-4">User</th>
              <th className="p-4">Level</th>
              <th className="p-4">Balance</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div>
                      <p className="font-medium">User Name {i}</p>
                      <p className="text-xs text-gray-500">@username{i}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="rounded bg-purple-500/20 px-2 py-1 text-sm text-purple-400">
                    Level {Math.floor(Math.random() * 50) + 1}
                  </span>
                </td>
                <td className="p-4 text-yellow-400">
                  {Math.floor(Math.random() * 100000).toLocaleString()} 🪙
                </td>
                <td className="p-4">
                  <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400">
                    Active
                  </span>
                </td>
                <td className="p-4">
                  <button className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
