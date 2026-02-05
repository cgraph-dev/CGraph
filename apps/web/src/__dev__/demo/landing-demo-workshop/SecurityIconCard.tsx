/**
 * SecurityIconCard Component
 * Security feature icon with hover preview tooltip
 */

import { useState, useEffect, useRef } from 'react';
import type { SecurityIconCardProps } from './types';

export function SecurityIconCard({ feature }: SecurityIconCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className="about__icon-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {feature.icon}

      {/* Preview Tooltip */}
      {isHovered && (
        <div
          className={`security-preview ${position === 'top' ? 'security-preview--top' : 'security-preview--bottom'}`}
        >
          <div className="security-preview__glow" />
          <div className="security-preview__content">
            <div className="security-preview__icon">{feature.icon}</div>
            <div className="security-preview__info">
              <h4 className="security-preview__title">{feature.title}</h4>
              <p className="security-preview__desc">{feature.description}</p>
            </div>
          </div>
          <div className="security-preview__arrow" />
        </div>
      )}
    </div>
  );
}
