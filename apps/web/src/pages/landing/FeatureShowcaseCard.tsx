/**
 * FeatureShowcaseCard Component
 *
 * Interactive showcase card that demonstrates premium features
 * with hover-to-reveal animations.
 *
 * @module pages/LandingPage/FeatureShowcaseCard
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedAvatar from '@/components/ui/AnimatedAvatar';
import type { ShowcaseCardData } from './constants';
import { springs } from '@/lib/animation-presets/presets';

interface FeatureShowcaseCardProps {
  data: ShowcaseCardData;
}

export const FeatureShowcaseCard = memo(function FeatureShowcaseCard({
  data,
}: FeatureShowcaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const renderContent = () => {
    switch (data.id) {
      case 'avatar':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Avatar */}
              <div className="showcase-avatar showcase-avatar--basic">
                <div className="showcase-avatar__image">
                  <span>CG</span>
                </div>
                <span className="showcase-avatar__label">Basic</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Premium Avatar with AnimatedAvatar */}
              <div className="showcase-avatar showcase-avatar--premium">
                <AnimatedAvatar
                  alt="CGraph Premium"
                  size="2xl"
                  fallbackText="CG"
                  isPremium
                  customStyle={{ borderStyle: 'supernova', borderColor: '#10b981' }}
                />
                <span className="showcase-avatar__label showcase-avatar__label--premium">
                  Legendary
                </span>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Chat Bubble */}
              <div className="showcase-chat">
                <div className="showcase-chat__bubble showcase-chat__bubble--basic">
                  Hello there! 👋
                </div>
                <span className="showcase-chat__label">Default</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Premium Chat Bubble */}
              <div className="showcase-chat">
                <div className="showcase-chat__bubble showcase-chat__bubble--premium">
                  <span className="showcase-chat__bubble-glow" />
                  Hello there! 👋
                </div>
                <span className="showcase-chat__label showcase-chat__label--premium">
                  Glass Premium
                </span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Profile Card */}
              <div className="showcase-profile showcase-profile--basic">
                <div className="showcase-profile__avatar">CG</div>
                <div className="showcase-profile__info">
                  <span className="showcase-profile__name">CGraph User</span>
                  <span className="showcase-profile__status">Online</span>
                </div>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Premium Profile Card */}
              <div className="showcase-profile showcase-profile--premium">
                <div className="showcase-profile__glow" />
                <div className="showcase-profile__avatar showcase-profile__avatar--premium">
                  <AnimatedAvatar
                    alt="CGraph Elite"
                    size="lg"
                    fallbackText="CG"
                    isPremium
                    customStyle={{ borderStyle: 'celestial', borderColor: '#8b5cf6' }}
                  />
                </div>
                <div className="showcase-profile__info">
                  <span className="showcase-profile__name showcase-profile__name--premium">
                    CGraph Elite
                  </span>
                  <div className="showcase-profile__badges">
                    <span className="showcase-badge showcase-badge--founder">👑</span>
                    <span className="showcase-badge showcase-badge--verified">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'title':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Title */}
              <div className="showcase-title">
                <span className="showcase-title__text showcase-title__text--basic">Member</span>
                <span className="showcase-title__sublabel">Standard Title</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Animated Legendary Title */}
              <div className="showcase-title">
                <span className="showcase-title__text showcase-title__text--legendary">
                  <span className="showcase-title__glow" />⚡ LEGENDARY ⚡
                </span>
                <div className="showcase-title__badges">
                  <motion.span
                    className="showcase-badge showcase-badge--animated"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔥
                  </motion.span>
                  <motion.span
                    className="showcase-badge showcase-badge--animated"
                    animate={{
                      scale: [1, 1.15, 1],
                      y: [0, -3, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    💎
                  </motion.span>
                  <motion.span
                    className="showcase-badge showcase-badge--animated"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  >
                    ⭐
                  </motion.span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Handle keyboard interaction for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsHovered(!isHovered);
    }
  };

  return (
    <motion.div
      className="showcase-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      whileHover={{ scale: 1.02, y: -8 }}
      transition={springs.bouncy}
      role="button"
      tabIndex={0}
      aria-pressed={isHovered}
      aria-label={`${data.label} showcase - ${isHovered ? 'showing premium version' : 'hover to see premium version'}`}
    >
      <div className="showcase-card__indicator" aria-hidden="true">
        <span className={`showcase-card__dot ${isHovered ? 'showcase-card__dot--active' : ''}`} />
        <span className="showcase-card__hover-hint">{isHovered ? 'Premium' : 'Hover me'}</span>
      </div>
      {renderContent()}
      <div className="showcase-card__footer">
        <span className="showcase-card__icon" aria-hidden="true">
          {data.icon}
        </span>
        <span className="showcase-card__label">{data.label}</span>
      </div>
    </motion.div>
  );
});
