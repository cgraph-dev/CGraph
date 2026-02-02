/**
 * Enhanced Appearance Settings Component
 *
 * Comprehensive theme customization panel with:
 * - Visual theme picker with 7 built-in themes
 * - Font scaling with live preview
 * - Message density options
 * - Accessibility settings
 *
 * @version 4.0.1
 * @since v0.7.36
 */

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaintBrushIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useThemeEnhanced, useReducedMotion } from '@/contexts/ThemeContextEnhanced';
import { Theme } from '@/lib/theme/ThemeEngine';

// =============================================================================
// TYPES
// =============================================================================

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  isPremium?: boolean;
}

// =============================================================================
// THEME CARD COMPONENT
// =============================================================================

function ThemeCard({ theme, isActive, onSelect, onDelete, isPremium }: ThemeCardProps) {
  const reduceMotion = useReducedMotion();

  const previewColors = useMemo(
    () => ({
      bg: theme.colors.background,
      surface: theme.colors.surface,
      primary: theme.colors.primary,
      accent: theme.colors.accent,
      text: theme.colors.textPrimary,
      border: theme.colors.surfaceBorder,
      holoPrimary: theme.colors.holoPrimary,
      holoGlow: theme.colors.holoGlow,
    }),
    [theme]
  );

  const isMatrix = theme.id === 'matrix';
  const isHolographic = theme.category === 'special';

  return (
    <motion.button
      onClick={onSelect}
      whileHover={reduceMotion ? {} : { scale: 1.02, y: -2 }}
      whileTap={reduceMotion ? {} : { scale: 0.98 }}
      className={`relative w-full rounded-xl p-1 transition-all duration-300 ${
        isActive
          ? 'shadow-lg shadow-primary-500/20 ring-2 ring-primary-500'
          : 'ring-1 ring-dark-600 hover:ring-dark-500'
      } `}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${previewColors.primary}20, ${previewColors.accent}20)`
          : undefined,
      }}
    >
      {/* Theme Preview */}
      <div
        className="relative h-24 overflow-hidden rounded-lg"
        style={{ background: previewColors.bg }}
      >
        {/* Matrix Effect */}
        {isMatrix && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute font-mono text-xs"
                  style={{
                    left: `${i * 10 + 5}%`,
                    color: previewColors.primary,
                    textShadow: `0 0 5px ${previewColors.holoGlow}`,
                  }}
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          y: ['-100%', '200%'],
                        }
                  }
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'linear',
                  }}
                >
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j}>{String.fromCharCode(0x30a0 + Math.random() * 96)}</div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Holographic Scanlines */}
        {isHolographic && theme.animations.enableScanlines && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                ${previewColors.holoPrimary}05 2px,
                ${previewColors.holoPrimary}05 4px
              )`,
            }}
            animate={reduceMotion ? {} : { y: [0, 4] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
        )}

        {/* UI Mock */}
        <div className="relative flex h-full flex-col gap-1 p-2">
          {/* Header */}
          <div className="h-3 rounded" style={{ background: previewColors.surface }} />

          {/* Content */}
          <div className="flex flex-1 gap-1">
            {/* Sidebar */}
            <div className="w-6 rounded" style={{ background: previewColors.surface }} />

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-1">
              {/* Message bubbles */}
              <div
                className="h-2 w-3/4 rounded"
                style={{
                  background: previewColors.primary,
                  boxShadow: isHolographic ? `0 0 8px ${previewColors.holoGlow}` : undefined,
                }}
              />
              <div
                className="h-2 w-1/2 self-end rounded"
                style={{ background: previewColors.surface }}
              />
              <div
                className="h-2 w-2/3 rounded"
                style={{ background: previewColors.primary }}
              ></div>
            </div>
          </div>
        </div>

        {/* Glow effect for holographic themes */}
        {isHolographic && (
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              boxShadow: `inset 0 0 30px ${previewColors.holoGlow}30`,
            }}
          />
        )}

        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500"
            >
              <CheckIcon className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
            <SparklesIcon className="h-2.5 w-2.5" />
            PRO
          </div>
        )}
      </div>

      {/* Theme info */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="text-left">
          <h4 className="truncate text-sm font-medium text-white">{theme.name}</h4>
          <p className="text-xs capitalize text-gray-400">{theme.category}</p>
        </div>

        {/* Delete button for custom themes */}
        {!theme.isBuiltIn && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 transition-colors hover:text-red-400"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.button>
  );
}

// =============================================================================
// SLIDER COMPONENT
// =============================================================================

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  displayValue?: string;
  icon?: React.ReactNode;
}

function Slider({ value, min, max, step, onChange, label, displayValue, icon }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="font-mono text-sm text-primary-400">
          {displayValue ?? value.toFixed(1)}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-dark-700">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// =============================================================================
// TOGGLE COMPONENT
// =============================================================================

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-dark-700 bg-dark-800/50 p-4 ${disabled ? 'opacity-50' : 'hover:border-dark-600'} transition-colors`}
    >
      <div className="flex items-center gap-3">
        {icon && <div className={`text-gray-400 ${enabled ? 'text-primary-400' : ''}`}>{icon}</div>}
        <div>
          <h4 className="text-sm font-medium text-white">{label}</h4>
          {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        </div>
      </div>

      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary-500' : 'bg-dark-600'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} `}
      >
        <motion.div
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-md"
          animate={{ left: enabled ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

// =============================================================================
// SECTION HEADER COMPONENT
// =============================================================================

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="rounded-lg bg-primary-500/10 p-2 text-primary-400">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AppearanceSettingsEnhanced() {
  const {
    theme,
    preferences,
    availableThemes,
    isSystemPreference,
    setTheme,
    updateSettings,
    setFontScale,
    setMessageDisplay,
    setMessageSpacing,
    toggleReduceMotion,
    toggleHighContrast,
    toggleSystemPreference,
    deleteCustomTheme,
  } = useThemeEnhanced();

  // Group themes by category
  const themeGroups = useMemo(() => {
    const groups = {
      dark: [] as Theme[],
      light: [] as Theme[],
      special: [] as Theme[],
      custom: [] as Theme[],
    };

    availableThemes.forEach((t) => {
      if (!t.isBuiltIn) {
        groups.custom.push(t);
      } else if (t.category === 'dark') {
        groups.dark.push(t);
      } else if (t.category === 'light') {
        groups.light.push(t);
      } else if (t.category === 'special') {
        groups.special.push(t);
      }
    });

    return groups;
  }, [availableThemes]);

  // Handle delete custom theme
  const handleDeleteTheme = useCallback(
    (themeId: string) => {
      if (confirm('Are you sure you want to delete this theme?')) {
        deleteCustomTheme(themeId);
      }
    },
    [deleteCustomTheme]
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Appearance</h1>
        <p className="text-gray-400">
          Customize how CGraph looks and feels. Changes are saved automatically.
        </p>
      </div>

      {/* ===== THEME SELECTION ===== */}
      <section>
        <SectionHeader
          icon={<PaintBrushIcon className="h-5 w-5" />}
          title="Theme"
          description="Choose a color scheme that suits your style"
        />

        {/* System Preference Toggle */}
        <div className="mb-4">
          <Toggle
            enabled={isSystemPreference}
            onChange={toggleSystemPreference}
            label="Match System Theme"
            description="Automatically switch between light and dark themes based on your system settings"
            icon={<ComputerDesktopIcon className="h-5 w-5" />}
          />
        </div>

        {/* Dark Themes */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
            <MoonIcon className="h-4 w-4" />
            Dark Themes
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {themeGroups.dark.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isActive={theme.id === t.id}
                onSelect={() => setTheme(t.id)}
              />
            ))}
          </div>
        </div>

        {/* Light Themes */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
            <SunIcon className="h-4 w-4" />
            Light Themes
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {themeGroups.light.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isActive={theme.id === t.id}
                onSelect={() => setTheme(t.id)}
              />
            ))}
          </div>
        </div>

        {/* Special Themes */}
        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
            <SparklesIcon className="h-4 w-4" />
            Special Themes
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {themeGroups.special.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isActive={theme.id === t.id}
                onSelect={() => setTheme(t.id)}
                isPremium={t.isPremium}
              />
            ))}
          </div>
        </div>

        {/* Custom Themes */}
        {themeGroups.custom.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-medium text-gray-400">Custom Themes</h4>
            <div className="grid grid-cols-3 gap-4">
              {themeGroups.custom.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={theme.id === t.id}
                  onSelect={() => setTheme(t.id)}
                  onDelete={() => handleDeleteTheme(t.id)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== DISPLAY OPTIONS ===== */}
      <section>
        <SectionHeader
          icon={<AdjustmentsHorizontalIcon className="h-5 w-5" />}
          title="Display"
          description="Adjust text size and message density"
        />

        <div className="space-y-6 rounded-xl border border-dark-700 bg-dark-800/50 p-6">
          {/* Font Scale */}
          <Slider
            value={preferences.settings.fontScale}
            min={0.8}
            max={1.4}
            step={0.1}
            onChange={setFontScale}
            label="Font Size"
            displayValue={`${Math.round(preferences.settings.fontScale * 100)}%`}
          />

          {/* Message Spacing */}
          <Slider
            value={preferences.settings.messageSpacing}
            min={0.5}
            max={2}
            step={0.1}
            onChange={setMessageSpacing}
            label="Message Spacing"
            displayValue={`${Math.round(preferences.settings.messageSpacing * 100)}%`}
          />

          {/* Message Display Mode */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">Message Display</label>
            <div className="grid grid-cols-2 gap-3">
              {(['cozy', 'compact'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMessageDisplay(mode)}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    preferences.settings.messageDisplay === mode
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 hover:border-dark-500'
                  } `}
                >
                  <div className="flex flex-col items-center gap-2">
                    {mode === 'cozy' ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary-500" />
                          <div className="flex-1">
                            <div className="h-2 w-16 rounded bg-dark-600" />
                            <div className="mt-1 h-1.5 w-24 rounded bg-dark-700" />
                          </div>
                        </div>
                        <div className="ml-8 h-3 rounded bg-dark-700" />
                      </div>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="flex items-center gap-1">
                          <div className="h-4 w-4 rounded-full bg-primary-500" />
                          <div className="h-2 w-12 rounded bg-dark-600" />
                          <div className="h-2 flex-1 rounded bg-dark-700" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-4 w-4 rounded-full bg-green-500" />
                          <div className="h-2 w-10 rounded bg-dark-600" />
                          <div className="h-2 flex-1 rounded bg-dark-700" />
                        </div>
                      </div>
                    )}
                    <span className="text-sm font-medium capitalize text-white">{mode}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BACKGROUND EFFECTS ===== */}
      <section>
        <SectionHeader
          icon={<SparklesIcon className="h-5 w-5" />}
          title="Background Effects"
          description="Add dynamic visual effects to the app background"
        />

        <div className="space-y-4">
          {/* Effect Type */}
          <div className="grid grid-cols-3 gap-3">
            {(['none', 'shader'] as const).map((effect) => (
              <button
                key={effect}
                onClick={() => updateSettings({ backgroundEffect: effect })}
                className={`rounded-lg border p-3 capitalize transition-all ${
                  preferences.settings.backgroundEffect === effect
                    ? 'border-primary-500 bg-primary-500/10 text-white'
                    : 'border-dark-600 bg-dark-700 text-gray-400 hover:border-dark-500'
                } `}
              >
                {effect === 'none' ? 'Off' : 'Shader Effects'}
              </button>
            ))}
          </div>

          {/* Shader Variant */}
          {preferences.settings.backgroundEffect === 'shader' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Effect Style</label>
              <div className="grid grid-cols-5 gap-2">
                {(['matrix', 'fluid', 'particles', 'waves', 'neural'] as const).map((variant) => (
                  <button
                    key={variant}
                    onClick={() => updateSettings({ shaderVariant: variant })}
                    className={`rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                      preferences.settings.shaderVariant === variant
                        ? 'border-primary-500 bg-primary-500/10 text-white'
                        : 'border-dark-600 bg-dark-700 text-gray-400 hover:border-dark-500'
                    } `}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intensity Slider */}
          {preferences.settings.backgroundEffect !== 'none' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-300">Intensity</label>
                <span className="text-sm text-gray-400">
                  {Math.round((preferences.settings.backgroundIntensity || 0.6) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={preferences.settings.backgroundIntensity || 0.6}
                onChange={(e) =>
                  updateSettings({ backgroundIntensity: parseFloat(e.target.value) })
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-dark-600 accent-primary-500"
              />
            </div>
          )}
        </div>
      </section>

      {/* ===== ACCESSIBILITY ===== */}
      <section>
        <SectionHeader
          icon={<EyeIcon className="h-5 w-5" />}
          title="Accessibility"
          description="Settings to improve readability and reduce distractions"
        />

        <div className="space-y-3">
          <Toggle
            enabled={preferences.settings.reduceMotion}
            onChange={toggleReduceMotion}
            label="Reduce Motion"
            description="Minimize animations throughout the app"
          />

          <Toggle
            enabled={preferences.settings.highContrast}
            onChange={toggleHighContrast}
            label="High Contrast"
            description="Increase contrast for better visibility"
          />
        </div>
      </section>

      {/* ===== LIVE PREVIEW ===== */}
      <section>
        <SectionHeader
          icon={<SparklesIcon className="h-5 w-5" />}
          title="Preview"
          description="See how your settings look"
        />

        <div
          className="relative overflow-hidden rounded-xl border p-6"
          style={{
            background: theme.colors.background,
            borderColor: theme.colors.surfaceBorder,
          }}
        >
          {/* Scanlines for special themes */}
          {theme.animations.enableScanlines && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  ${theme.colors.holoScanline}05 2px,
                  ${theme.colors.holoScanline}05 4px
                )`,
              }}
            />
          )}

          {/* Sample message */}
          <div
            className="relative flex gap-3 rounded-lg p-4"
            style={{
              background: theme.colors.surface,
              fontSize: `${preferences.settings.fontScale}rem`,
              marginBottom: `${preferences.settings.messageSpacing}rem`,
            }}
          >
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full"
              style={{
                background: theme.colors.primary,
                boxShadow: theme.animations.enableGlow
                  ? `0 0 15px ${theme.colors.holoGlow}`
                  : undefined,
              }}
            />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold" style={{ color: theme.colors.primary }}>
                  CGraph User
                </span>
                <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                  Today at 12:00 PM
                </span>
              </div>
              <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                This is how your messages will look with the current settings. The theme affects
                colors, and display settings adjust sizing and spacing.
              </p>
            </div>
          </div>

          {/* Sample input */}
          <div
            className="relative flex items-center gap-2 rounded-lg p-3"
            style={{
              background: theme.colors.surfaceElevated,
              border: `1px solid ${theme.colors.surfaceBorder}`,
            }}
          >
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none"
              style={{
                color: theme.colors.textPrimary,
                fontSize: `${preferences.settings.fontScale}rem`,
              }}
              readOnly
            />
            <button
              className="rounded-lg px-4 py-2 font-medium transition-colors"
              style={{
                background: theme.colors.primary,
                color: '#fff',
                boxShadow: theme.animations.enableGlow
                  ? `0 0 10px ${theme.colors.holoGlow}`
                  : undefined,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
