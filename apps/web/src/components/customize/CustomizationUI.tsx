/**
 * Customization UI Components
 *
 * Reusable, animated components for the customization system.
 * Matches the design patterns from the landing page demo.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { ThemePreset } from '@/stores/customizationStoreV2';
import { themeColors } from '@/stores/customizationStoreV2';

// =============================================================================
// ANIMATION SPRINGS
// =============================================================================

export const springs = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  smooth: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 20 },
};

// =============================================================================
// ANIMATED TOGGLE SWITCH
// =============================================================================

interface AnimatedToggleProps {
  enabled: boolean;
  onToggle: () => void;
  colorPreset?: ThemePreset;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const AnimatedToggle = memo(function AnimatedToggle({
  enabled,
  onToggle,
  colorPreset = 'emerald',
  size = 'md',
  disabled = false,
}: AnimatedToggleProps) {
  const colors = themeColors[colorPreset];

  const sizeConfig = {
    sm: { track: 'h-4 w-7', dot: 'h-3 w-3', offset: enabled ? '14px' : '2px' },
    md: { track: 'h-5 w-9', dot: 'h-4 w-4', offset: enabled ? '18px' : '2px' },
    lg: { track: 'h-6 w-11', dot: 'h-5 w-5', offset: enabled ? '22px' : '2px' },
  };

  const config = sizeConfig[size];

  return (
    <motion.button
      className={`relative ${config.track} rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      style={{
        background: enabled
          ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          : '#374151',
        boxShadow: enabled ? `0 0 12px ${colors.glow}` : 'none',
      }}
      onClick={() => !disabled && onToggle()}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      <motion.div
        className={`absolute top-0.5 ${config.dot} rounded-full bg-white shadow-lg`}
        animate={{ left: config.offset }}
        transition={springs.snappy}
      />
    </motion.button>
  );
});

// =============================================================================
// COLOR PICKER GRID
// =============================================================================

interface ColorPickerGridProps {
  selected: ThemePreset;
  onSelect: (preset: ThemePreset) => void;
  size?: 'sm' | 'md' | 'lg';
}

const allThemes: ThemePreset[] = [
  'emerald',
  'purple',
  'cyan',
  'orange',
  'pink',
  'gold',
  'crimson',
  'arctic',
];

export const ColorPickerGrid = memo(function ColorPickerGrid({
  selected,
  onSelect,
  size = 'md',
}: ColorPickerGridProps) {
  const sizeConfig = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allThemes.map((preset) => {
        const colors = themeColors[preset];
        const isSelected = preset === selected;

        return (
          <motion.button
            key={preset}
            className={`${sizeConfig[size]} rounded-full border-2 ${
              isSelected ? 'border-white' : 'border-transparent'
            }`}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isSelected ? `0 0 15px ${colors.glow}` : 'none',
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(preset)}
            title={colors.name}
          />
        );
      })}
    </div>
  );
});

// =============================================================================
// RANGE SLIDER WITH GRADIENT FILL
// =============================================================================

interface GradientSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  colorPreset?: ThemePreset;
  label?: string;
  showValue?: boolean;
  suffix?: string;
}

export const GradientSlider = memo(function GradientSlider({
  value,
  min,
  max,
  onChange,
  colorPreset = 'emerald',
  label,
  showValue = true,
  suffix = '',
}: GradientSliderProps) {
  const colors = themeColors[colorPreset];
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-white">
              {value}
              {suffix}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700"
          style={{
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
        {/* Custom thumb styles via CSS */}
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
          input[type='range']::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    </div>
  );
});

// =============================================================================
// ANIMATED TABS
// =============================================================================

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  colorPreset?: ThemePreset;
  layoutId?: string;
}

export const AnimatedTabs = memo(function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  colorPreset = 'emerald',
  layoutId = 'activeTab',
}: AnimatedTabsProps) {
  const colors = themeColors[colorPreset];

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <motion.button
            key={tab.id}
            className={`relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
            }`}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`,
                  boxShadow: `0 0 20px ${colors.glow}`,
                }}
                transition={springs.smooth}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});

// =============================================================================
// OPTION BUTTON (for style selection)
// =============================================================================

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  premium?: boolean;
  rarity?: string;
  colorPreset?: ThemePreset;
}

export const OptionButton = memo(function OptionButton({
  selected,
  onClick,
  icon,
  label,
  description,
  premium,
  rarity,
  colorPreset = 'emerald',
}: OptionButtonProps) {
  const colors = themeColors[colorPreset];
  const rarityColorMap: Record<string, string> = {
    Rare: '#3b82f6',
    Epic: '#8b5cf6',
    Legendary: '#f97316',
    Mythic: '#ec4899',
  };

  return (
    <motion.button
      className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
        selected
          ? 'border-white/30 bg-white/10'
          : 'hover:bg-white/8 border-white/10 bg-white/5 hover:border-white/20'
      }`}
      style={{
        boxShadow: selected ? `0 0 20px ${colors.glow}` : 'none',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
                : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{label}</span>
            {rarity && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  background: `${rarityColorMap[rarity]}30`,
                  color: rarityColorMap[rarity],
                }}
              >
                {rarity}
              </span>
            )}
            {premium && !rarity && (
              <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">
                PRO
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 truncate text-xs text-white/60">{description}</p>}
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <motion.div
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.bouncy}
        >
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
});

// =============================================================================
// SPEED SELECTOR (Slow / Normal / Fast)
// =============================================================================

type SpeedOption = 'slow' | 'normal' | 'fast';

interface SpeedSelectorProps {
  value: SpeedOption;
  onChange: (speed: SpeedOption) => void;
  colorPreset?: ThemePreset;
}

export const SpeedSelector = memo(function SpeedSelector({
  value,
  onChange,
  colorPreset = 'emerald',
}: SpeedSelectorProps) {
  const colors = themeColors[colorPreset];
  const options: { id: SpeedOption; label: string; icon: string }[] = [
    { id: 'slow', label: 'Slow', icon: '🐢' },
    { id: 'normal', label: 'Normal', icon: '⚡' },
    { id: 'fast', label: 'Fast', icon: '🚀' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const isSelected = option.id === value;

        return (
          <motion.button
            key={option.id}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              isSelected
                ? 'border border-white/20 text-white'
                : 'border border-transparent bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
                : undefined,
              boxShadow: isSelected ? `0 0 15px ${colors.glow}` : 'none',
            }}
            onClick={() => onChange(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

// =============================================================================
// SIZE SELECTOR (Small / Medium / Large)
// =============================================================================

type SizeOption = 'small' | 'medium' | 'large';

interface SizeSelectorProps {
  value: SizeOption;
  onChange: (size: SizeOption) => void;
  colorPreset?: ThemePreset;
}

export const SizeSelector = memo(function SizeSelector({
  value,
  onChange,
  colorPreset = 'emerald',
}: SizeSelectorProps) {
  const colors = themeColors[colorPreset];
  const options: { id: SizeOption; label: string }[] = [
    { id: 'small', label: 'S' },
    { id: 'medium', label: 'M' },
    { id: 'large', label: 'L' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const isSelected = option.id === value;

        return (
          <motion.button
            key={option.id}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
              isSelected
                ? 'border border-white/20 text-white'
                : 'border border-transparent bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
                : undefined,
              boxShadow: isSelected ? `0 0 15px ${colors.glow}` : 'none',
            }}
            onClick={() => onChange(option.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
});

// =============================================================================
// SECTION HEADER
// =============================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

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

// =============================================================================
// TOGGLE ROW (Label + Toggle in a row)
// =============================================================================

interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  onToggle: () => void;
  colorPreset?: ThemePreset;
}

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

// =============================================================================
// PREMIUM BADGE
// =============================================================================

export interface PremiumBadgeProps {
  tier?: 'free' | 'pro' | 'elite';
  className?: string;
}

export const PremiumBadge = memo(function PremiumBadge({
  tier = 'pro',
  className = '',
}: PremiumBadgeProps) {
  const config = {
    free: { label: 'FREE', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    pro: { label: 'PRO', bg: 'bg-purple-500/20', text: 'text-purple-400' },
    elite: { label: 'ELITE', bg: 'bg-pink-500/20', text: 'text-pink-400' },
  };

  const { label, bg, text } = config[tier];

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  );
});
