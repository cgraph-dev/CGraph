/**
 * ThreadRating Component
 * 5-star rating system for threads with interactive input
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/modules/forums/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ThreadRating');

interface ThreadRatingProps {
  threadId: string;
  rating?: number; // Average rating (0-5)
  ratingCount?: number; // Number of ratings
  myRating?: number | null; // Current user's rating (1-5)
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean; // Allow user to rate
  showCount?: boolean; // Show number of ratings
  className?: string;
}

/**
 * Thread Rating component.
 */
export default function ThreadRating({
  threadId,
  rating = 0,
  ratingCount = 0,
  myRating = null,
  size = 'md',
  interactive = true,
  showCount = true,
  className = '',
}: ThreadRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const { rateThread } = useForumStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleRate = async (starValue: number) => {
    if (!interactive || isSubmitting) return;

    setIsSubmitting(true);
    HapticFeedback.light();

    try {
      await rateThread(threadId, starValue);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to rate thread:', error);
      HapticFeedback.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredStar !== null ? hoveredStar : myRating || rating;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Star Rating Display/Input */}
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoveredStar(null)}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayRating;
          const isMyRating = myRating !== null && starValue <= myRating;

          return (
            <motion.button
              key={starValue}
              onClick={() => handleRate(starValue)}
              onMouseEnter={() => interactive && setHoveredStar(starValue)}
              disabled={!interactive || isSubmitting}
              whileHover={interactive ? { scale: 1.1 } : {}}
              whileTap={interactive ? { scale: 0.9 } : {}}
              className={`transition-colors duration-150 ${interactive ? 'cursor-pointer' : 'cursor-default'} ${isSubmitting ? 'opacity-50' : ''} `}
              aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              {isFilled ? (
                <StarIcon
                  className={`${sizeClasses[size]} ${
                    isMyRating
                      ? 'text-primary-400'
                      : hoveredStar !== null
                        ? 'text-yellow-400'
                        : 'text-yellow-500'
                  }`}
                />
              ) : (
                <StarOutlineIcon
                  className={`${sizeClasses[size]} ${
                    hoveredStar !== null ? 'text-yellow-400/50' : 'text-gray-500'
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Rating Stats */}
      {showCount && ratingCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <span className="font-semibold text-white">{rating.toFixed(1)}</span>
          <span className="text-gray-500">
            ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      )}

      {/* My Rating Indicator */}
      {myRating !== null && interactive && (
        <span className="text-xs text-primary-400">Your rating: {myRating}★</span>
      )}
    </div>
  );
}
