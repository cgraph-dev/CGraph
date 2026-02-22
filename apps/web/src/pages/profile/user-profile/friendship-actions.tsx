/**
 * FriendshipActions - Action buttons based on friendship status
 */

import { motion } from 'framer-motion';
import {
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
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
  onRemoveFriend: () => void;
  onMessage: () => void;
}

export function FriendshipActions({
  friendshipStatus,
  isActioning,
  onSendRequest,
  onAcceptRequest,
  onRemoveFriend,
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
        </Dropdown>
      </>
    );
  }

  if (friendshipStatus === 'none') {
    return (
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
    );
  }

  if (friendshipStatus === 'pending_sent') {
    return (
      <Button variant="secondary" disabled>
        Request Sent
      </Button>
    );
  }

  if (friendshipStatus === 'pending_received') {
    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          leftIcon={<UserPlusIcon className="h-5 w-5" />}
          onClick={() => {
            onAcceptRequest();
            HapticFeedback.success();
          }}
          isLoading={isActioning}
        >
          Accept Request
        </Button>
      </motion.div>
    );
  }

  return null;
}
