/**
 * Notification Service
 * 
 * Platform-agnostic notification logic and templates.
 */

export type NotificationType = 
  | 'message'
  | 'mention'
  | 'friend_request'
  | 'friend_accepted'
  | 'group_invite'
  | 'achievement'
  | 'level_up'
  | 'quest_complete'
  | 'forum_reply'
  | 'forum_mention'
  | 'moderation';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  badge?: number;
  sound?: string;
  imageUrl?: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export class NotificationService {
  /**
   * Create notification payload for a new message
   */
  static createMessageNotification(
    senderName: string,
    content: string,
    conversationId: string,
    isGroup: boolean = false,
    groupName?: string
  ): NotificationPayload {
    const title = isGroup ? `${senderName} in ${groupName}` : senderName;
    const body = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    return {
      type: 'message',
      title,
      body,
      data: { conversationId, senderId: senderName },
      actions: [
        { id: 'reply', title: 'Reply' },
        { id: 'mark_read', title: 'Mark as Read' },
      ],
    };
  }
  
  /**
   * Create notification for a mention
   */
  static createMentionNotification(
    senderName: string,
    context: string,
    location: { type: 'message' | 'forum'; id: string }
  ): NotificationPayload {
    return {
      type: 'mention',
      title: `${senderName} mentioned you`,
      body: context.length > 100 ? context.substring(0, 100) + '...' : context,
      data: { location },
    };
  }
  
  /**
   * Create friend request notification
   */
  static createFriendRequestNotification(
    senderName: string,
    senderAvatar?: string
  ): NotificationPayload {
    return {
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${senderName} wants to be your friend`,
      imageUrl: senderAvatar,
      actions: [
        { id: 'accept', title: 'Accept' },
        { id: 'decline', title: 'Decline' },
      ],
    };
  }
  
  /**
   * Create achievement unlocked notification
   */
  static createAchievementNotification(
    achievementName: string,
    description: string,
    xpReward: number,
    coinReward: number
  ): NotificationPayload {
    return {
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      body: `${achievementName}: ${description}`,
      data: { xpReward, coinReward },
      sound: 'achievement',
    };
  }
  
  /**
   * Create level up notification
   */
  static createLevelUpNotification(
    newLevel: number,
    rewards: { coins: number; title?: string }
  ): NotificationPayload {
    let body = `You've reached level ${newLevel}! +${rewards.coins} coins`;
    if (rewards.title) {
      body += ` and unlocked the "${rewards.title}" title`;
    }
    
    return {
      type: 'level_up',
      title: '⬆️ Level Up!',
      body,
      data: { newLevel, ...rewards },
      sound: 'level_up',
    };
  }
  
  /**
   * Create quest complete notification
   */
  static createQuestCompleteNotification(
    questTitle: string,
    xpReward: number,
    coinReward: number
  ): NotificationPayload {
    return {
      type: 'quest_complete',
      title: '✅ Quest Complete!',
      body: `${questTitle} - +${xpReward} XP, +${coinReward} coins`,
      data: { xpReward, coinReward },
      actions: [
        { id: 'claim', title: 'Claim Rewards' },
      ],
    };
  }
  
  /**
   * Create forum reply notification
   */
  static createForumReplyNotification(
    authorName: string,
    threadTitle: string,
    threadId: string
  ): NotificationPayload {
    return {
      type: 'forum_reply',
      title: `Reply to: ${threadTitle}`,
      body: `${authorName} replied to your thread`,
      data: { threadId },
    };
  }
  
  /**
   * Create group invite notification
   */
  static createGroupInviteNotification(
    inviterName: string,
    groupName: string,
    inviteCode: string
  ): NotificationPayload {
    return {
      type: 'group_invite',
      title: 'Group Invitation',
      body: `${inviterName} invited you to join ${groupName}`,
      data: { inviteCode, groupName },
      actions: [
        { id: 'join', title: 'Join' },
        { id: 'decline', title: 'Decline' },
      ],
    };
  }
  
  /**
   * Create moderation notification
   */
  static createModerationNotification(
    action: 'warn' | 'mute' | 'kick' | 'ban',
    groupName: string,
    reason?: string
  ): NotificationPayload {
    const actionText = {
      warn: 'received a warning',
      mute: 'have been muted',
      kick: 'have been kicked',
      ban: 'have been banned',
    }[action];
    
    return {
      type: 'moderation',
      title: 'Moderation Action',
      body: `You ${actionText} in ${groupName}${reason ? `: ${reason}` : ''}`,
      data: { action, groupName, reason },
    };
  }
}
