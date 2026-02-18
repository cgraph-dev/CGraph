/**
 * Utility components for customization UI
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';

import { AnimatedToggle } from './AnimatedToggle';
import { premiumConfig } from './constants';
import type { SectionHeaderProps, ToggleRowProps, PremiumBadgeProps } from './types';

export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
      </div>
    </div>
  );
});

export const ToggleRow = memo(function ToggleRow({
  label,
  description,
  icon,
  enabled,
  onToggle,
  colorPreset = 'emerald',
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          {description && <p className="text-xs text-white/50">{description}</p>}
        </div>
      </div>
      <AnimatedToggle enabled={enabled} onToggle={onToggle} colorPreset={colorPreset} />
    </div>
  );
});

export const PremiumBadge = memo(function PremiumBadge({
  tier = 'premium',
  className = '',
}: PremiumBadgeProps) {
  const { label, bg, text } = premiumConfig[tier];

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  );
});
