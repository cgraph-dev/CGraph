/**
 * Groups Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const groupsApi = {
  getGroups: () => `${API_URL}/api/v1/groups`,
  getGroup: (id: string) => `${API_URL}/api/v1/groups/${id}`,
  createGroup: () => `${API_URL}/api/v1/groups`,
  updateGroup: (id: string) => `${API_URL}/api/v1/groups/${id}`,
  getChannels: (groupId: string) => `${API_URL}/api/v1/groups/${groupId}/channels`,
  getChannel: (groupId: string, channelId: string) =>
    `${API_URL}/api/v1/groups/${groupId}/channels/${channelId}`,
  getMembers: (groupId: string) => `${API_URL}/api/v1/groups/${groupId}/members`,
  getRoles: (groupId: string) => `${API_URL}/api/v1/groups/${groupId}/roles`,
  createInvite: (groupId: string) => `${API_URL}/api/v1/groups/${groupId}/invites`,
  joinWithInvite: (inviteCode: string) => `${API_URL}/api/v1/invites/${inviteCode}/join`,
};
