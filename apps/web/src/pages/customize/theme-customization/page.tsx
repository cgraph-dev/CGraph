/**
 * Theme customization settings page.
 * @module
 */

import { useThemeCustomization } from './hooks';
import { SearchBar } from './search-bar';
import { ProfileThemePicker } from './profile-theme-picker';
import { SecretThemeSection } from './secret-theme-section';
import { SaveButton } from './save-button';

/**
 * ThemeCustomization Component
 *
 * Single unified theme system with ProfileThemeConfig presets.
 * @description Renders the theme customization page with profile theme picker.
 */
export default function ThemeCustomization() {
  const {
    searchQuery,
    setSearchQuery,
    profileThemeCategory,
    setProfileThemeCategory,
    selectedThemes,
    isSaving,
    error,
    filteredNewProfileThemes,
    handleSaveThemes,
    handleApplyProfileTheme,
  } = useThemeCustomization();

  return (
    <div className="space-y-6">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <ProfileThemePicker
        profileThemeCategory={profileThemeCategory}
        onCategoryChange={setProfileThemeCategory}
        filteredThemes={filteredNewProfileThemes}
        selectedProfileThemeId={selectedThemes.profile}
        onApplyTheme={handleApplyProfileTheme}
      />

      {/* Secret Chat Theme — separate equip slot */}
      <div className="border-t border-white/5 pt-6">
        <SecretThemeSection searchQuery={searchQuery} />
      </div>

      <SaveButton onSave={handleSaveThemes} isSaving={isSaving} error={error} />
    </div>
  );
}
