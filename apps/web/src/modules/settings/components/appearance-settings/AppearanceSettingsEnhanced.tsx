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

import { useThemeEnhanced } from '@/contexts/ThemeContextEnhanced';

import { ThemeSelection } from './ThemeSelection';
import { DisplayOptions } from './DisplayOptions';
import { BackgroundEffects } from './BackgroundEffects';
import { Accessibility } from './Accessibility';
import { LivePreview } from './LivePreview';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AppearanceSettingsEnhanced() {
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

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Appearance</h1>
        <p className="text-gray-400">
          Customize how CGraph looks and feels. Changes are saved automatically.
        </p>
      </div>

      {/* Theme Selection */}
      <ThemeSelection
        theme={theme}
        availableThemes={availableThemes}
        isSystemPreference={isSystemPreference}
        setTheme={setTheme}
        toggleSystemPreference={toggleSystemPreference}
        deleteCustomTheme={deleteCustomTheme}
      />

      {/* Display Options */}
      <DisplayOptions
        fontScale={preferences.settings.fontScale}
        messageSpacing={preferences.settings.messageSpacing}
        messageDisplay={preferences.settings.messageDisplay}
        setFontScale={setFontScale}
        setMessageSpacing={setMessageSpacing}
        setMessageDisplay={setMessageDisplay}
      />

      {/* Background Effects */}
      <BackgroundEffects
        backgroundEffect={preferences.settings.backgroundEffect}
        shaderVariant={preferences.settings.shaderVariant}
        backgroundIntensity={preferences.settings.backgroundIntensity || 0.6}
        updateSettings={updateSettings}
      />

      {/* Accessibility */}
      <Accessibility
        reduceMotion={preferences.settings.reduceMotion}
        highContrast={preferences.settings.highContrast}
        toggleReduceMotion={toggleReduceMotion}
        toggleHighContrast={toggleHighContrast}
      />

      {/* Live Preview */}
      <LivePreview
        theme={theme}
        fontScale={preferences.settings.fontScale}
        messageSpacing={preferences.settings.messageSpacing}
      />
    </div>
  );
}

export default AppearanceSettingsEnhanced;
