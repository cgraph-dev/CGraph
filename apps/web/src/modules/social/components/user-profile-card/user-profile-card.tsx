/**
 * User Profile Card Component
 *
 * Profile popup with hover and click triggers:
 * - Mini variant: Compact card shown on hover (300px)
 * - Full variant: Detailed modal shown on click (600px)
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { GlassCard } from '@/shared/components/ui';
import { MiniProfileCard } from './mini-profile-card';
import { FullProfileCard } from './full-profile-card';
import { useProfileCardNavigation } from './hooks';
import { HOVER_DELAY_MS, DEFAULT_PLACEHOLDER_USER } from './constants';
import type { UserProfileCardProps, MutualFriend, CardPosition, ProfileCardUser } from './types';
import { springs } from '@/lib/animation-presets';

/**
 * User Profile Card display component.
 */
export default function UserProfileCard({
  userId,
  user,
  variant = 'mini',
  trigger = 'click',
  onClose,
  children,
  className = '',
}: UserProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cardVariant, setCardVariant] = useState<'mini' | 'full'>(variant);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CardPosition>({ top: 0, left: 0 });

  const { handleViewProfile, handleMessage } = useProfileCardNavigation(userId);

  // Note: mutualFriends would need to be fetched per-user in a real implementation
  const mutualFriends: MutualFriend[] = [];

  // Calculate card position relative to trigger element
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if ((trigger === 'hover' || trigger === 'both') && variant === 'mini') {
      hoverTimeout.current = setTimeout(() => {
        setCardVariant('mini');
        setIsOpen(true);
      }, HOVER_DELAY_MS);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    // Close mini card on mouse leave for both 'hover' and 'both' triggers
    if (cardVariant === 'mini' && (trigger === 'hover' || trigger === 'both')) {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' || trigger === 'both') {
      setCardVariant('full');
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // If no user data provided, use a placeholder
  const profileUser: ProfileCardUser = user || {
    ...DEFAULT_PLACEHOLDER_USER,
    id: userId,
  };

  return (
    <>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* Card Portal */}
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop for full variant */}
            {cardVariant === 'full' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            )}

            {/* Card */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={springs.stiff}
                className={`fixed z-50 ${
                  cardVariant === 'mini'
                    ? 'pointer-events-auto'
                    : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                }`}
                style={
                  cardVariant === 'mini'
                    ? {
                        top: position.top,
                        left: position.left,
                        transform: 'translateX(-50%)',
                      }
                    : undefined
                }
                onMouseEnter={cardVariant === 'mini' ? handleMouseEnter : undefined}
                onMouseLeave={cardVariant === 'mini' ? handleMouseLeave : undefined}
              >
                <GlassCard variant="holographic" glow glowColor="rgba(139, 92, 246, 0.3)">
                  {cardVariant === 'mini' ? (
                    <MiniProfileCard
                      user={profileUser}
                      onViewProfile={handleViewProfile}
                      onMessage={handleMessage}
                    />
                  ) : (
                    <FullProfileCard
                      user={profileUser}
                      mutualFriends={mutualFriends}
                      onClose={handleClose}
                    />
                  )}
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
