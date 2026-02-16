import React from 'react';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

/**
 * FeatureCard - Core UI Primitive
 *
 * Interactive card with 3D tilt physics for feature showcases.
 * Includes animated border, glass background, spotlight glare, and accent line.
 *
 * Based on the original TiltCard from LandingPage.tsx, extracted as a reusable primitive.
 */
export const FeatureCard = React.memo(function FeatureCard({
  icon,
  title,
  description,
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`feature-card ${className}`}>
      <div className="feature-card__animated-border" />
      <div className="feature-card__bg" />
      <div className="feature-card__glare" />
      <div className="feature-card__content">
        <span className="feature-card__icon">{icon}</span>
        <h3 className="feature-card__title font-robert">{title}</h3>
        <p className="feature-card__desc font-space">{description}</p>
      </div>
      <div className="feature-card__accent" />
    </div>
  );
});
