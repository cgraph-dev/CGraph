/**
 * Rating Stars Component
 * @module modules/forums/components/thread-view/components/rating-stars
 */

import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface RatingStarsProps {
  rating?: number;
  myRating?: number;
  ratingCount?: number;
  primaryColor: string;
  hoveredRating: number;
  setHoveredRating: (rating: number) => void;
  onRate: (rating: number) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Rating Stars component.
 */
export function RatingStars({
  rating,
  myRating,
  ratingCount,
  primaryColor,
  hoveredRating,
  setHoveredRating,
  onRate,
}: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoveredRating || myRating || 0);
        const isAverage = !hoveredRating && !myRating && star <= Math.round(rating || 0);
        return (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => onRate(star)}
            className="focus:outline-none"
          >
            {isFilled || isAverage ? (
              <StarIconSolid
                className="h-5 w-5"
                style={{ color: isFilled ? primaryColor : '#FFD700' }}
              />
            ) : (
              <StarIcon className="h-5 w-5 text-gray-500" />
            )}
          </motion.button>
        );
      })}
      {ratingCount && <span className="ml-1 text-xs text-gray-500">({ratingCount})</span>}
    </div>
  );
}
