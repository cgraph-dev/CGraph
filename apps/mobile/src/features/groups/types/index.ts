/**
 * Groups Types (Mobile)
 */

export type {
  Group,
  Channel,
  Role,
  Member,
} from '@cgraph/shared-types';

export interface GroupWithDetails {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  memberCount: number;
  channelCount: number;
  isPublic: boolean;
  createdAt: Date;
}

export type ChannelType = 'text' | 'voice' | 'announcement' | 'forum';

export interface ChannelWithDetails {
  id: string;
  groupId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  position: number;
  isPrivate: boolean;
  lastMessageAt?: Date;
}
