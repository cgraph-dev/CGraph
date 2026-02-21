/**
 * ChannelsTab component - Full channel management UI
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';
import { CreateChannelForm } from './CreateChannelForm';
import { ChannelListItem } from './ChannelListItem';
import type { ChannelItem } from './ChannelListItem';
import { DeleteChannelModal } from './DeleteChannelModal';
import { ChannelPermissionsPanel } from './ChannelPermissionsPanel';
import { ChannelCategoriesPanel } from './ChannelCategoriesPanel';
import type { ChannelsTabProps } from './types';

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
      <CreateChannelForm
        show={showCreate}
        newName={newName}
        newType={newType}
        newTopic={newTopic}
        onNameChange={setNewName}
        onTypeChange={setNewType}
        onTopicChange={setNewTopic}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />

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
            {channels.map((channel, index) => (
              <Reorder.Item key={channel.id} value={channel}>
                <ChannelListItem
                  channel={channel}
                  index={index}
                  editingId={editingId}
                  editName={editName}
                  editTopic={editTopic}
                  onEditNameChange={setEditName}
                  onEditTopicChange={setEditTopic}
                  onSave={handleUpdate}
                  onCancelEdit={() => setEditingId(null)}
                  onStartEdit={startEdit}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onPermissions={(id) => setPermissionsChannelId(id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <DeleteChannelModal
        deleteConfirmId={deleteConfirmId}
        onDelete={handleDelete}
        onClose={() => setDeleteConfirmId(null)}
      />

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
