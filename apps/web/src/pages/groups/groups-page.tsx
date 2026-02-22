/**
 * Groups Page - Main component
 * @module pages/groups
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGroupStore } from '@/modules/groups/store';
import {
  ServerList,
  ChannelList,
  ContentArea,
  LoadingOverlay,
  AmbientParticles,
} from './components';

export default function Groups() {
  const { groupId, channelId } = useParams();
  const { groups, isLoadingGroups, fetchGroups, fetchGroup, setActiveGroup, setActiveChannel } =
    useGroupStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch full group data when selected
  useEffect(() => {
    if (groupId) {
      setActiveGroup(groupId);
      fetchGroup(groupId);
    }
    if (channelId) {
      setActiveChannel(channelId);
    }
  }, [groupId, channelId, setActiveGroup, fetchGroup, setActiveChannel]);

  const activeGroup = groups.find((g) => g.id === groupId);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Initialize all categories as expanded
  useEffect(() => {
    if (activeGroup?.categories) {
      setExpandedCategories(new Set(activeGroup.categories.map((c) => c.id)));
    }
  }, [activeGroup?.id, activeGroup?.categories]);

  return (
    <div className="relative flex flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Loading state */}
      {isLoadingGroups && groups.length === 0 && <LoadingOverlay />}

      {/* Ambient particles */}
      <AmbientParticles />

      {/* Server List */}
      <ServerList groups={groups} activeGroupId={groupId} />

      {/* Channel List */}
      <ChannelList
        activeGroup={activeGroup}
        channelId={channelId}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
      />

      {/* Channel Content */}
      <div className="relative z-10 flex flex-1 flex-col bg-transparent">
        <ContentArea activeGroup={activeGroup} groupId={groupId} channelId={channelId} />
      </div>
    </div>
  );
}
