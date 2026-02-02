import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('UICustomizationSettings');
import {
  SparklesIcon,
  SwatchIcon,
  BeakerIcon,
  BoltIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';

/**
 * Advanced UI Customization Settings
 *
 * Provides extensive user control over every aspect of the UI experience.
 * Features include theme customization, animation controls, particle systems,
 * glassmorphism effects, typography, spacing, and accessibility options.
 *
 * All settings persist to localStorage and apply instantly across the app.
 */

export interface UIPreferences {
  // Theme & Colors
  theme: 'dark' | 'darker' | 'midnight' | 'amoled' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundGradient: 'none' | 'subtle' | 'vibrant' | 'rainbow' | 'northern-lights';

  // Glass Effects
  glassEffect: 'none' | 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'matrix';
  glassBlur: number; // 0-50
  glassOpacity: number; // 0-100
  glassBorderWidth: number; // 0-5
  glowIntensity: number; // 0-100

  // Animations
  animationSpeed: 'instant' | 'fast' | 'normal' | 'slow' | 'very-slow';
  animationIntensity: 'minimal' | 'low' | 'medium' | 'high' | 'ultra';
  enableTransitions: boolean;
  enableHoverEffects: boolean;
  enable3DTransforms: boolean;
  enableParallax: boolean;

  // Particles & Effects
  particleSystem: 'none' | 'minimal' | 'medium' | 'heavy' | 'extreme';
  particleColor: 'primary' | 'rainbow' | 'monochrome' | 'custom';
  particleShape: 'circle' | 'square' | 'star' | 'heart' | 'custom';
  showAmbientEffects: boolean;
  showGlowEffects: boolean;
  showShadows: boolean;

  // Typography
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'system' | 'inter' | 'jetbrains' | 'comic-sans' | 'custom';
  fontWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight: 'compact' | 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'tight' | 'normal' | 'wide' | 'wider';

  // Spacing & Layout
  spacing: 'compact' | 'normal' | 'comfortable' | 'spacious';
  borderRadius: number; // 0-50
  contentWidth: 'narrow' | 'normal' | 'wide' | 'full';
  sidebarPosition: 'left' | 'right';

  // Performance
  reducedMotion: boolean;
  hardwareAcceleration: boolean;
  lazyLoadImages: boolean;
  virtualizeListsAtBeyond: number; // items

  // Accessibility
  highContrast: boolean;
  largeClickTargets: boolean;
  showFocusIndicators: boolean;
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;

  // Experimental
  enableNeuralEffects: boolean;
  enableQuantumUI: boolean;
  enableHolographicProjection: boolean;
  enableMindControl: boolean; // 😄
}

const defaultPreferences: UIPreferences = {
  theme: 'dark',
  primaryColor: '#10b981',
  secondaryColor: '#8b5cf6',
  accentColor: '#ec4899',
  backgroundGradient: 'subtle',

  glassEffect: 'holographic',
  glassBlur: 20,
  glassOpacity: 15,
  glassBorderWidth: 1,
  glowIntensity: 50,

  animationSpeed: 'normal',
  animationIntensity: 'high',
  enableTransitions: true,
  enableHoverEffects: true,
  enable3DTransforms: true,
  enableParallax: true,

  particleSystem: 'medium',
  particleColor: 'primary',
  particleShape: 'circle',
  showAmbientEffects: true,
  showGlowEffects: true,
  showShadows: true,

  fontSize: 'medium',
  fontFamily: 'inter',
  fontWeight: 'normal',
  lineHeight: 'normal',
  letterSpacing: 'normal',

  spacing: 'normal',
  borderRadius: 12,
  contentWidth: 'normal',
  sidebarPosition: 'left',

  reducedMotion: false,
  hardwareAcceleration: true,
  lazyLoadImages: true,
  virtualizeListsAtBeyond: 100,

  highContrast: false,
  largeClickTargets: false,
  showFocusIndicators: true,
  enableHapticFeedback: true,
  enableSoundEffects: false,

  enableNeuralEffects: false,
  enableQuantumUI: false,
  enableHolographicProjection: false,
  enableMindControl: false,
};

export const useUIPreferences = create<{
  preferences: UIPreferences;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
  resetToDefaults: () => void;
  exportPreferences: () => string;
  importPreferences: (json: string) => void;
}>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));

        // Apply changes to document
        applyPreferencesToDOM(get().preferences);
      },

      resetToDefaults: () => {
        set({ preferences: defaultPreferences });
        applyPreferencesToDOM(defaultPreferences);
        HapticFeedback.medium();
      },

      exportPreferences: () => {
        return JSON.stringify(get().preferences, null, 2);
      },

      importPreferences: (json) => {
        try {
          const imported = JSON.parse(json);
          set({ preferences: { ...defaultPreferences, ...imported } });
          applyPreferencesToDOM(get().preferences);
          HapticFeedback.success();
        } catch (error) {
          logger.error('Failed to import preferences:', error);
          HapticFeedback.error();
        }
      },
    }),
    {
      name: 'cgraph-ui-preferences',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);

// Apply preferences to DOM
function applyPreferencesToDOM(prefs: UIPreferences) {
  const root = document.documentElement;

  // Colors
  root.style.setProperty('--color-primary', prefs.primaryColor);
  root.style.setProperty('--color-secondary', prefs.secondaryColor);
  root.style.setProperty('--color-accent', prefs.accentColor);

  // Glass effect
  root.style.setProperty('--glass-blur', `${prefs.glassBlur}px`);
  root.style.setProperty('--glass-opacity', `${prefs.glassOpacity}%`);
  root.style.setProperty('--glass-border-width', `${prefs.glassBorderWidth}px`);
  root.style.setProperty('--glow-intensity', `${prefs.glowIntensity}%`);

  // Animation speed
  const speeds = { instant: '0s', fast: '0.15s', normal: '0.3s', slow: '0.6s', 'very-slow': '1s' };
  root.style.setProperty('--animation-speed', speeds[prefs.animationSpeed]);

  // Spacing
  const spacingValues = {
    compact: '0.5rem',
    normal: '1rem',
    comfortable: '1.5rem',
    spacious: '2rem',
  };
  root.style.setProperty('--spacing-unit', spacingValues[prefs.spacing]);

  // Border radius
  root.style.setProperty('--border-radius', `${prefs.borderRadius}px`);

  // Font size
  const fontSizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
  root.style.setProperty('--font-size-base', fontSizes[prefs.fontSize]);

  // Reduced motion
  if (prefs.reducedMotion) {
    root.style.setProperty('--animation-speed', '0.01s');
  }
}

export default function UICustomizationSettings() {
  const { preferences, updatePreference, resetToDefaults, exportPreferences, importPreferences } =
    useUIPreferences();
  const [activeTab, setActiveTab] = useState<
    'theme' | 'effects' | 'animations' | 'typography' | 'advanced'
  >('theme');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    applyPreferencesToDOM(preferences);
  }, [preferences]);

  const tabs = [
    { id: 'theme' as const, label: 'Theme & Colors', icon: SwatchIcon },
    { id: 'effects' as const, label: 'Glass & Effects', icon: SparklesIcon },
    { id: 'animations' as const, label: 'Animations', icon: BoltIcon },
    { id: 'typography' as const, label: 'Typography', icon: PaintBrushIcon },
    { id: 'advanced' as const, label: 'Advanced', icon: BeakerIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Cog6ToothIcon className="h-7 w-7 text-primary-400" />
            UI Customization
          </h2>
          <p className="mt-1 text-gray-400">Personalize every aspect of your CGraph experience</p>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowExportModal(true)}
            className="rounded-lg bg-dark-700 px-4 py-2 text-white transition-colors hover:bg-dark-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Export/Import
          </motion.button>
          <motion.button
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) {
                resetToDefaults();
              }
            }}
            className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                HapticFeedback.light();
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'theme' && (
            <ThemeSettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'effects' && (
            <EffectsSettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'animations' && (
            <AnimationsSettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'typography' && (
            <TypographySettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'advanced' && (
            <AdvancedSettings preferences={preferences} updatePreference={updatePreference} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Export/Import Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportImportModal
            exportData={exportPreferences()}
            onImport={(data) => {
              importPreferences(data);
              setShowExportModal(false);
            }}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Settings component props interface
interface SettingsTabProps {
  preferences: UIPreferences;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
}

// Theme Settings Tab
function ThemeSettings({ preferences, updatePreference }: SettingsTabProps) {
  const themes = [
    { value: 'dark' as const, label: 'Dark', preview: 'bg-dark-900' },
    { value: 'darker' as const, label: 'Darker', preview: 'bg-dark-950' },
    { value: 'midnight' as const, label: 'Midnight', preview: 'bg-gray-950' },
    { value: 'amoled' as const, label: 'AMOLED', preview: 'bg-black' },
  ];

  const gradients = [
    { value: 'none' as const, label: 'None', preview: 'bg-dark-900' },
    {
      value: 'subtle' as const,
      label: 'Subtle',
      preview: 'bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950',
    },
    {
      value: 'vibrant' as const,
      label: 'Vibrant',
      preview: 'bg-gradient-to-br from-primary-900 via-purple-900 to-pink-900',
    },
    {
      value: 'rainbow' as const,
      label: 'Rainbow',
      preview: 'bg-gradient-to-br from-red-900 via-purple-900 to-blue-900',
    },
    {
      value: 'northern-lights' as const,
      label: 'Aurora',
      preview: 'bg-gradient-to-br from-green-900 via-blue-900 to-purple-900',
    },
  ];

  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Base Theme</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {themes.map((theme) => (
            <motion.button
              key={theme.value}
              onClick={() => updatePreference('theme', theme.value)}
              className={`rounded-xl border-2 p-4 transition-all ${
                preferences.theme === theme.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`mb-2 h-16 rounded-lg ${theme.preview}`} />
              <span className="text-sm font-medium text-white">{theme.label}</span>
              {preferences.theme === theme.value && (
                <CheckIcon className="mx-auto mt-1 h-4 w-4 text-primary-400" />
              )}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Background Gradient</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {gradients.map((gradient) => (
            <motion.button
              key={gradient.value}
              onClick={() => updatePreference('backgroundGradient', gradient.value)}
              className={`rounded-xl border-2 p-4 transition-all ${
                preferences.backgroundGradient === gradient.value
                  ? 'border-primary-500'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`mb-2 h-16 rounded-lg ${gradient.preview}`} />
              <span className="text-xs font-medium text-white">{gradient.label}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Color Palette</h3>
        <div className="space-y-4">
          <ColorPicker
            label="Primary Color"
            value={preferences.primaryColor}
            onChange={(color) => updatePreference('primaryColor', color)}
          />
          <ColorPicker
            label="Secondary Color"
            value={preferences.secondaryColor}
            onChange={(color) => updatePreference('secondaryColor', color)}
          />
          <ColorPicker
            label="Accent Color"
            value={preferences.accentColor}
            onChange={(color) => updatePreference('accentColor', color)}
          />
        </div>
      </GlassCard>
    </div>
  );
}

// Effects Settings Tab
function EffectsSettings({ preferences, updatePreference }: SettingsTabProps) {
  const glassEffects = [
    { value: 'none' as const, label: 'None' },
    { value: 'default' as const, label: 'Default' },
    { value: 'frosted' as const, label: 'Frosted' },
    { value: 'crystal' as const, label: 'Crystal' },
    { value: 'neon' as const, label: 'Neon' },
    { value: 'holographic' as const, label: 'Holographic' },
    { value: 'matrix' as const, label: 'Matrix' },
  ];

  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Glass Effect Style</h3>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-7">
          {glassEffects.map((effect) => (
            <motion.button
              key={effect.value}
              onClick={() => updatePreference('glassEffect', effect.value)}
              className={`rounded-lg border px-4 py-3 text-sm transition-all ${
                preferences.glassEffect === effect.value
                  ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                  : 'border-dark-600 bg-dark-700/50 text-gray-400 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {effect.label}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Glass Properties</h3>
        <div className="space-y-6">
          <SliderControl
            label="Blur Intensity"
            value={preferences.glassBlur}
            onChange={(value) => updatePreference('glassBlur', value)}
            min={0}
            max={50}
            suffix="px"
          />
          <SliderControl
            label="Opacity"
            value={preferences.glassOpacity}
            onChange={(value) => updatePreference('glassOpacity', value)}
            min={0}
            max={100}
            suffix="%"
          />
          <SliderControl
            label="Border Width"
            value={preferences.glassBorderWidth}
            onChange={(value) => updatePreference('glassBorderWidth', value)}
            min={0}
            max={5}
            suffix="px"
          />
          <SliderControl
            label="Glow Intensity"
            value={preferences.glowIntensity}
            onChange={(value) => updatePreference('glowIntensity', value)}
            min={0}
            max={100}
            suffix="%"
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Particle System</h3>
        <div className="space-y-4">
          <Select
            label="Particle Density"
            value={preferences.particleSystem}
            onChange={(value) =>
              updatePreference('particleSystem', value as UIPreferences['particleSystem'])
            }
            options={[
              { value: 'none', label: 'Disabled' },
              { value: 'minimal', label: 'Minimal (Best Performance)' },
              { value: 'medium', label: 'Medium (Balanced)' },
              { value: 'heavy', label: 'Heavy (Beautiful)' },
              { value: 'extreme', label: 'Extreme (May Impact Performance)' },
            ]}
          />
          <Select
            label="Particle Color"
            value={preferences.particleColor}
            onChange={(value) =>
              updatePreference('particleColor', value as UIPreferences['particleColor'])
            }
            options={[
              { value: 'primary', label: 'Primary Theme Color' },
              { value: 'rainbow', label: 'Rainbow' },
              { value: 'monochrome', label: 'Monochrome' },
            ]}
          />
          <Select
            label="Particle Shape"
            value={preferences.particleShape}
            onChange={(value) =>
              updatePreference('particleShape', value as UIPreferences['particleShape'])
            }
            options={[
              { value: 'circle', label: 'Circle' },
              { value: 'square', label: 'Square' },
              { value: 'star', label: 'Star' },
              { value: 'heart', label: 'Heart' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Visual Effects</h3>
        <div className="space-y-3">
          <Toggle
            label="Ambient Effects"
            description="Background particles and atmosphere"
            value={preferences.showAmbientEffects}
            onChange={(value) => updatePreference('showAmbientEffects', value)}
          />
          <Toggle
            label="Glow Effects"
            description="Pulsing glows and halos"
            value={preferences.showGlowEffects}
            onChange={(value) => updatePreference('showGlowEffects', value)}
          />
          <Toggle
            label="Shadows"
            description="Drop shadows and depth effects"
            value={preferences.showShadows}
            onChange={(value) => updatePreference('showShadows', value)}
          />
        </div>
      </GlassCard>
    </div>
  );
}

// Animations Settings Tab
function AnimationsSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Animation Speed</h3>
        <Select
          label="Global Animation Speed"
          value={preferences.animationSpeed}
          onChange={(value) =>
            updatePreference('animationSpeed', value as UIPreferences['animationSpeed'])
          }
          options={[
            { value: 'instant', label: 'Instant (No Animations)' },
            { value: 'fast', label: 'Fast (150ms)' },
            { value: 'normal', label: 'Normal (300ms)' },
            { value: 'slow', label: 'Slow (600ms)' },
            { value: 'very-slow', label: 'Very Slow (1s)' },
          ]}
        />
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Animation Intensity</h3>
        <Select
          label="Effect Complexity"
          value={preferences.animationIntensity}
          onChange={(value) =>
            updatePreference('animationIntensity', value as UIPreferences['animationIntensity'])
          }
          options={[
            { value: 'minimal', label: 'Minimal (Best Performance)' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium (Recommended)' },
            { value: 'high', label: 'High' },
            { value: 'ultra', label: 'Ultra (Maximum Effects)' },
          ]}
        />
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Animation Features</h3>
        <div className="space-y-3">
          <Toggle
            label="Transitions"
            description="Smooth element transitions"
            value={preferences.enableTransitions}
            onChange={(value) => updatePreference('enableTransitions', value)}
          />
          <Toggle
            label="Hover Effects"
            description="Interactive hover animations"
            value={preferences.enableHoverEffects}
            onChange={(value) => updatePreference('enableHoverEffects', value)}
          />
          <Toggle
            label="3D Transforms"
            description="Perspective and depth effects"
            value={preferences.enable3DTransforms}
            onChange={(value) => updatePreference('enable3DTransforms', value)}
          />
          <Toggle
            label="Parallax Scrolling"
            description="Depth-based scroll effects"
            value={preferences.enableParallax}
            onChange={(value) => updatePreference('enableParallax', value)}
          />
        </div>
      </GlassCard>
    </div>
  );
}

// Typography Settings Tab
function TypographySettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Font Settings</h3>
        <div className="space-y-4">
          <Select
            label="Font Size"
            value={preferences.fontSize}
            onChange={(value) => updatePreference('fontSize', value as UIPreferences['fontSize'])}
            options={[
              { value: 'small', label: 'Small (14px)' },
              { value: 'medium', label: 'Medium (16px)' },
              { value: 'large', label: 'Large (18px)' },
              { value: 'xlarge', label: 'Extra Large (20px)' },
            ]}
          />
          <Select
            label="Font Family"
            value={preferences.fontFamily}
            onChange={(value) =>
              updatePreference('fontFamily', value as UIPreferences['fontFamily'])
            }
            options={[
              { value: 'system', label: 'System Default' },
              { value: 'inter', label: 'Inter (Recommended)' },
              { value: 'jetbrains', label: 'JetBrains Mono' },
              { value: 'comic-sans', label: 'Comic Sans (Why?)' },
            ]}
          />
          <Select
            label="Font Weight"
            value={preferences.fontWeight}
            onChange={(value) =>
              updatePreference('fontWeight', value as UIPreferences['fontWeight'])
            }
            options={[
              { value: 'light', label: 'Light (300)' },
              { value: 'normal', label: 'Normal (400)' },
              { value: 'medium', label: 'Medium (500)' },
              { value: 'semibold', label: 'Semibold (600)' },
              { value: 'bold', label: 'Bold (700)' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Text Spacing</h3>
        <div className="space-y-4">
          <Select
            label="Line Height"
            value={preferences.lineHeight}
            onChange={(value) =>
              updatePreference('lineHeight', value as UIPreferences['lineHeight'])
            }
            options={[
              { value: 'compact', label: 'Compact (1.2)' },
              { value: 'normal', label: 'Normal (1.5)' },
              { value: 'relaxed', label: 'Relaxed (1.75)' },
              { value: 'loose', label: 'Loose (2)' },
            ]}
          />
          <Select
            label="Letter Spacing"
            value={preferences.letterSpacing}
            onChange={(value) =>
              updatePreference('letterSpacing', value as UIPreferences['letterSpacing'])
            }
            options={[
              { value: 'tight', label: 'Tight (-0.05em)' },
              { value: 'normal', label: 'Normal (0)' },
              { value: 'wide', label: 'Wide (0.05em)' },
              { value: 'wider', label: 'Wider (0.1em)' },
            ]}
          />
        </div>
      </GlassCard>
    </div>
  );
}

// Advanced Settings Tab
function AdvancedSettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Layout</h3>
        <div className="space-y-4">
          <Select
            label="Spacing"
            value={preferences.spacing}
            onChange={(value) => updatePreference('spacing', value as UIPreferences['spacing'])}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' },
            ]}
          />
          <SliderControl
            label="Border Radius"
            value={preferences.borderRadius}
            onChange={(value) => updatePreference('borderRadius', value)}
            min={0}
            max={50}
            suffix="px"
          />
          <Select
            label="Content Width"
            value={preferences.contentWidth}
            onChange={(value) =>
              updatePreference('contentWidth', value as UIPreferences['contentWidth'])
            }
            options={[
              { value: 'narrow', label: 'Narrow (800px)' },
              { value: 'normal', label: 'Normal (1200px)' },
              { value: 'wide', label: 'Wide (1600px)' },
              { value: 'full', label: 'Full Width' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Performance</h3>
        <div className="space-y-3">
          <Toggle
            label="Hardware Acceleration"
            description="Use GPU for animations (recommended)"
            value={preferences.hardwareAcceleration}
            onChange={(value) => updatePreference('hardwareAcceleration', value)}
          />
          <Toggle
            label="Lazy Load Images"
            description="Load images as they enter viewport"
            value={preferences.lazyLoadImages}
            onChange={(value) => updatePreference('lazyLoadImages', value)}
          />
          <SliderControl
            label="Virtualize Lists After"
            value={preferences.virtualizeListsAtBeyond}
            onChange={(value) => updatePreference('virtualizeListsAtBeyond', value)}
            min={50}
            max={500}
            step={50}
            suffix=" items"
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Accessibility</h3>
        <div className="space-y-3">
          <Toggle
            label="Reduced Motion"
            description="Minimize animations (respects system preference)"
            value={preferences.reducedMotion}
            onChange={(value) => updatePreference('reducedMotion', value)}
          />
          <Toggle
            label="High Contrast"
            description="Increase contrast for better visibility"
            value={preferences.highContrast}
            onChange={(value) => updatePreference('highContrast', value)}
          />
          <Toggle
            label="Large Click Targets"
            description="Increase button/link sizes"
            value={preferences.largeClickTargets}
            onChange={(value) => updatePreference('largeClickTargets', value)}
          />
          <Toggle
            label="Focus Indicators"
            description="Show keyboard focus outlines"
            value={preferences.showFocusIndicators}
            onChange={(value) => updatePreference('showFocusIndicators', value)}
          />
        </div>
      </GlassCard>

      <GlassCard variant="neon" glow className="border-2 border-purple-500/30 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
          <BeakerIcon className="h-5 w-5 text-purple-400" />
          Experimental Features
        </h3>
        <p className="mb-4 text-sm text-gray-400">Cutting-edge features that may be unstable</p>
        <div className="space-y-3">
          <Toggle
            label="Neural Effects"
            description="AI-powered animations that adapt to your behavior"
            value={preferences.enableNeuralEffects}
            onChange={(value) => updatePreference('enableNeuralEffects', value)}
          />
          <Toggle
            label="Quantum UI"
            description="Superposition of multiple UI states simultaneously"
            value={preferences.enableQuantumUI}
            onChange={(value) => updatePreference('enableQuantumUI', value)}
          />
          <Toggle
            label="Holographic Projection"
            description="3D holographic interface (requires AR hardware)"
            value={preferences.enableHolographicProjection}
            onChange={(value) => updatePreference('enableHolographicProjection', value)}
          />
          <Toggle
            label="Mind Control"
            description="Control UI with your thoughts (BCI required)"
            value={preferences.enableMindControl}
            onChange={(value) => updatePreference('enableMindControl', value)}
          />
        </div>
      </GlassCard>
    </div>
  );
}

// Helper Components
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 cursor-pointer rounded-lg border-2 border-dark-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
        />
      </div>
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: SliderControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm font-semibold text-primary-400">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-dark-700"
      />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white transition-colors focus:border-primary-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-dark-700/30">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="mt-0.5 text-xs text-gray-500">{description}</div>}
      </div>
      <motion.button
        onClick={() => {
          onChange(!value);
          HapticFeedback.light();
        }}
        className={`relative h-6 w-12 rounded-full transition-colors ${
          value ? 'bg-primary-600' : 'bg-dark-600'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
          animate={{ x: value ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}

interface ExportImportModalProps {
  exportData: string;
  onImport: (data: string) => void;
  onClose: () => void;
}

function ExportImportModal({ exportData, onImport, onClose }: ExportImportModalProps) {
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="holographic" glow className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Export / Import Settings</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Export (Copy to share)
              </label>
              <div className="relative">
                <textarea
                  value={exportData}
                  readOnly
                  className="h-40 w-full resize-none rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 font-mono text-xs text-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportData);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    HapticFeedback.success();
                  }}
                  className="absolute right-2 top-2 rounded-lg bg-primary-600 px-3 py-1 text-sm text-white transition-colors hover:bg-primary-500"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Import (Paste settings)
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste settings JSON here..."
                className="h-40 w-full resize-none rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 font-mono text-xs text-white focus:border-primary-500 focus:outline-none"
              />
              <button
                onClick={() => onImport(importText)}
                disabled={!importText.trim()}
                className="mt-2 w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-500 disabled:bg-dark-700 disabled:text-gray-500"
              >
                Import Settings
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
