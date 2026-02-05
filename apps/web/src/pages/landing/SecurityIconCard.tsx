/**
 * SecurityIconCard Component
 *
 * Hoverable security feature card with tooltip preview.
 * Uses React portal to escape parent transforms.
 *
 * @module pages/LandingPage/SecurityIconCard
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SecurityFeature } from './constants';

interface SecurityIconCardProps {
  feature: SecurityFeature;
}

export const SecurityIconCard = memo(function SecurityIconCard({ feature }: SecurityIconCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isReady, setIsReady] = useState(false); // Only show after scale is calculated
  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  // Get the current scale of the parent section
  const getParentScale = useCallback(() => {
    if (!cardRef.current) return 1;
    const section = cardRef.current.closest('.zoom-section');
    if (!section) return 1;
    const transform = window.getComputedStyle(section).transform;
    if (transform === 'none') return 1;
    // Parse matrix(a, b, c, d, tx, ty) - scale is in 'a' position
    const matrix = transform.match(/matrix\(([^)]+)\)/);
    if (matrix && matrix[1]) {
      const values = matrix[1].split(',').map((v) => parseFloat(v.trim()));
      return values[0] || 1; // 'a' value is the scaleX
    }
    return 1;
  }, []);

  // Update tooltip position on hover and during scroll
  const updatePosition = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const isTop = spaceAbove > spaceBelow;
      setPosition(isTop ? 'top' : 'bottom');

      // Get the current scale of the parent section
      const scale = getParentScale();

      // Calculate fixed position for the tooltip, scaled to match icons
      setTooltipStyle({
        position: 'fixed',
        left: rect.left + rect.width / 2,
        top: isTop ? rect.top - 12 * scale : rect.bottom + 12 * scale,
        transform: isTop
          ? `translate(-50%, -100%) scale(${scale})`
          : `translate(-50%, 0) scale(${scale})`,
        transformOrigin: isTop ? 'bottom center' : 'top center',
        zIndex: 9999,
        opacity: 1,
      });
      setIsReady(true);
    }
  }, [getParentScale]);

  useEffect(() => {
    if (isHovered) {
      // Calculate position immediately on hover
      updatePosition();
      // Update position on scroll to keep tooltip aligned and scaled
      window.addEventListener('scroll', updatePosition, { passive: true });
      return () => {
        window.removeEventListener('scroll', updatePosition);
        setIsReady(false);
      };
    }
    return undefined;
  }, [isHovered, updatePosition]);

  // Only render tooltip when hovered AND position/scale is ready
  const tooltip = isHovered && isReady && (
    <div
      className={`security-preview security-preview--portal ${position === 'top' ? 'security-preview--top' : 'security-preview--bottom'}`}
      style={tooltipStyle}
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
  );

  return (
    <div
      ref={cardRef}
      className="about__icon-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${feature.title}: ${feature.description}`}
      aria-expanded={isHovered}
    >
      <span aria-hidden="true">{feature.icon}</span>

      {/* Preview Tooltip - Rendered via portal to escape parent transforms */}
      {tooltip && createPortal(tooltip, document.body)}
    </div>
  );
});
