/**
 * FriendshipActions - Action buttons based on friendship status
 */

import { motion } from 'motion/react';
import {
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  NoSymbolIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components';
import Dropdown, { DropdownItem } from '@/components/navigation/dropdown';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { FriendshipStatus } from '@/types/profile.types';

interface FriendshipActionsProps {
  friendshipStatus: FriendshipStatus;
  isActioning: boolean;
  onSendRequest: () => void;
  onAcceptRequest: () => void;
  onDeclineRequest: () => void;
  onCancelRequest: () => void;
  onRemoveFriend: () => void;
  onBlockUser: () => void;
  onMessage: () => void;
}

/**
 * Friendship Actions component.
 */
export function FriendshipActions({
  friendshipStatus,
  isActioning,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
  onBlockUser,
  onMessage,
}: FriendshipActionsProps) {
  if (friendshipStatus === 'friends') {
    return (
      <>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            leftIcon={<ChatBubbleLeftIcon className="h-5 w-5" />}
            onClick={() => {
              onMessage();
              HapticFeedback.medium();
            }}
          >
            Message
          </Button>
        </motion.div>
        <Dropdown
          trigger={
            <Button variant="ghost">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </Button>
          }
          align="right"
        >
          <DropdownItem
            onClick={() => {
              onRemoveFriend();
              HapticFeedback.medium();
            }}
            icon={<UserMinusIcon className="h-4 w-4" />}
            danger
          >
            Remove Friend
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              onBlockUser();
              HapticFeedback.medium();
            }}
            icon={<NoSymbolIcon className="h-4 w-4" />}
            danger
          >
            Block User
          </DropdownItem>
        </Dropdown>
      </>
    );
  }

  if (friendshipStatus === 'none') {
    return (
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            leftIcon={<UserPlusIcon className="h-5 w-5" />}
            onClick={() => {
              onSendRequest();
              HapticFeedback.success();
            }}
            isLoading={isActioning}
          >
            Add Friend
          </Button>
        </motion.div>
        <Dropdown
          trigger={
            <Button variant="ghost">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </Button>
          }
          align="right"
        >
          <DropdownItem
            onClick={() => {
              onBlockUser();
              HapticFeedback.medium();
            }}
            icon={<NoSymbolIcon className="h-4 w-4" />}
            danger
          >
            Block User
          </DropdownItem>
        </Dropdown>
      </div>
    );
  }

  if (friendshipStatus === 'pending_sent') {
    return (
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            leftIcon={<XMarkIcon className="h-5 w-5" />}
            onClick={() => {
              onCancelRequest();
              HapticFeedback.medium();
            }}
            isLoading={isActioning}
          >
            Cancel Request
          </Button>
        </motion.div>
        <Dropdown
          trigger={
            <Button variant="ghost">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </Button>
          }
          align="right"
        >
          <DropdownItem
            onClick={() => {
              onBlockUser();
              HapticFeedback.medium();
            }}
            icon={<NoSymbolIcon className="h-4 w-4" />}
            danger
          >
            Block User
          </DropdownItem>
        </Dropdown>
      </div>
    );
  }

  if (friendshipStatus === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            leftIcon={<UserPlusIcon className="h-5 w-5" />}
            onClick={() => {
              onAcceptRequest();
              HapticFeedback.success();
            }}
            isLoading={isActioning}
          >
            Accept
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={() => {
              onDeclineRequest();
              HapticFeedback.medium();
            }}
          >
            Decline
          </Button>
        </motion.div>
        <Dropdown
          trigger={
            <Button variant="ghost">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </Button>
          }
          align="right"
        >
          <DropdownItem
            onClick={() => {
              onBlockUser();
              HapticFeedback.medium();
            }}
            icon={<NoSymbolIcon className="h-4 w-4" />}
            danger
          >
            Block User
          </DropdownItem>
        </Dropdown>
      </div>
    );
  }

  if (friendshipStatus === 'blocked') {
    return (
      <Button variant="secondary" disabled>
        Blocked
      </Button>
    );
  }

  return null;
}
