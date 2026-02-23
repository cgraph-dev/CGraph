/**
 * Animated message wrapper type definitions.
 * @module
 */
import { ReactNode } from 'react';

export interface AnimatedMessageWrapperProps {
  children: ReactNode;
  isOwnMessage: boolean;
  index: number;
  isNew?: boolean;
  isEditing?: boolean;
  isDeleting?: boolean;
  messageId?: string;
  onSwipeReply?: () => void;
  onLongPress?: () => void;
  enableGestures?: boolean;
}

/** Maps animation speed to stagger delay multiplier */
export const SPEED_MULTIPLIERS = { slow: 2, normal: 1, fast: 0.5 } as const;
