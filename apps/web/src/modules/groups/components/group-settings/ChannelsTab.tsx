/**
 * ChannelsTab component - Full channel management UI
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  PlusIcon,
  HashtagIcon,
  SpeakerWaveIcon,
  MegaphoneIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';
import { entranceVariants } from '@/lib/animation-presets/presets';
import { ChannelPermissionsPanel } from './ChannelPermissionsPanel';
import { ChannelCategoriesPanel } from './ChannelCategoriesPanel';
import type { ChannelsTabProps } from './types';

interface ChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  topic: string | null;
  position: number;
  categoryId: string | null;
  nsfw: boolean;
  slowmodeSeconds: number;
}

const channelIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  announcement: MegaphoneIcon,
} as const;

export function ChannelsTab({ groupId }: ChannelsTabProps) {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [permissionsChannelId, setPermissionsChannelId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [newTopic, setNewTopic] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/channels`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setChannels(
        data
          .map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: (c.name ?? '') as string,
            type: (c.type ?? 'text') as 'text' | 'voice' | 'announcement',
            topic: (c.topic ?? null) as string | null,
            position: (c.position ?? 0) as number,
            categoryId: (c.category_id ?? c.categoryId ?? null) as string | null,
            nsfw: !!(c.nsfw),
            slowmodeSeconds: (c.slowmode_seconds ?? c.slowmodeSeconds ?? 0) as number,
          }))
          .sort((a: ChannelItem, b: ChannelItem) => a.position - b.position)
      );
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/channels`, {
        name: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        type: newType,
        topic: newTopic || undefined,
        position: channels.length,
      });
      setNewName('');
      setNewType('text');
      setNewTopic('');
      setShowCreate(false);
      fetchChannels();
    } catch {
      // Handle error
    }
  };

  const handleUpdate = async (channelId: string) => {
    try {
      await api.put(`/api/v1/groups/${groupId}/channels/${channelId}`, {
        name: editName.trim().toLowerCase().replace(/\s+/g, '-'),
        topic: editTopic || undefined,
      });
      setEditingId(null);
      fetchChannels();
    } catch {
      // Handle error
    }
  };

  const handleDelete = async (channelId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}/channels/${channelId}`);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setDeleteConfirmId(null);
    } catch {
      // Handle error
    }
  };

  const startEdit = (channel: ChannelItem) => {
    setEditingId(channel.id);
    setEditName(channel.name);
    setEditTopic(channel.topic || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-white">Channels</h2>
          <p className="text-gray-400">
            Create and manage channels. {channels.length} channel{channels.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Create Channel
        </motion.button>
      </div>

      {/* Create Channel Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <GlassCard variant="frosted" className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">New Channel</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-3">
                {(['text', 'voice', 'announcement'] as const).map((type) => {
                  const Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> = channelIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                        newType === type
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {type}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="channel-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Channel topic (optional)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Create
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel Categories */}
      <ChannelCategoriesPanel groupId={groupId} />

      {/* Channels List */}
      <GlassCard variant="frosted" className="divide-y divide-gray-700/50">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No channels yet. Create one to get started.</div>
        ) : (
          <Reorder.Group axis="y" values={channels} onReorder={setChannels} className="divide-y divide-gray-700/50">
            {channels.map((channel, index) => {
              const Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> = channelIcons[channel.type as keyof typeof channelIcons] ?? HashtagIcon;
              return (
                <Reorder.Item key={channel.id} value={channel}>
                  <motion.div
                    variants={entranceVariants.fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    {editingId === channel.id ? (
                      // Edit mode
                      <div className="flex flex-1 items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                        <div className="flex flex-1 gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="rounded border border-gray-700 bg-dark-800 px-2 py-1 text-sm text-white focus:border-primary-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editTopic}
                            onChange={(e) => setEditTopic(e.target.value)}
                            placeholder="Topic"
                            className="flex-1 rounded border border-gray-700 bg-dark-800 px-2 py-1 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdate(channel.id)}
                            className="rounded px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-dark-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-400" />
                          <div>
                            <span className="font-medium text-white">{channel.name}</span>
                            {channel.topic && (
                              <p className="text-xs text-gray-500">{channel.topic}</p>
                            )}
                          </div>
                          {channel.nsfw && (
                            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                              NSFW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPermissionsChannelId(channel.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-primary-400"
                            title="Permissions"
                          >
                            <ShieldCheckIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEdit(channel)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteConfirmId(channel.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-red-400"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">Delete Channel</h3>
              <p className="text-sm text-gray-400">
                This will permanently delete the channel and all its messages. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Permissions Panel Modal */}
      <AnimatePresence>
        {permissionsChannelId && (
          <ChannelPermissionsPanel
            groupId={groupId}
            channelId={permissionsChannelId}
            channelName={
              channels.find((c) => c.id === permissionsChannelId)?.name ?? 'channel'
            }
            onClose={() => setPermissionsChannelId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
