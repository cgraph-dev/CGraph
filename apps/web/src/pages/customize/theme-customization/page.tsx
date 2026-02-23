/**
 * Theme customization settings page.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';

import { useThemeCustomization } from './hooks';
import { CategoryTabs } from './category-tabs';
import { SearchBar } from './search-bar';
import { ThemeDescription } from './theme-description';
import { ProfileThemePicker } from './profile-theme-picker';
import { SaveButton } from './save-button';
import { ThemeCard } from './theme-card';

/**
 * ThemeCustomization Component
 *
 * Comprehensive theme customization with 4 categories:
 * 1. Profile Themes - 20+ profile color schemes
 * 2. Chat Themes - 15+ chat bubble/background themes
 * 3. Forum Themes - 12+ forum layout themes
 * 4. App Themes - 8+ global app color schemes
 */
export default function ThemeCustomization() {
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    useNewProfileThemes,
    setUseNewProfileThemes,
    profileThemeCategory,
    setProfileThemeCategory,
    selectedThemes,
    isSaving,
    error,
    filteredThemes,
    filteredNewProfileThemes,
    handleApplyTheme,
    handleSaveThemes,
    isThemeActive,
    isThemePreviewing,
    handleApplyNewProfileTheme,
  } = useThemeCustomization();

  return (
    <div className="space-y-6">
      <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <ThemeDescription activeCategory={activeCategory} />

      {/* Profile Theme Category Picker (only show for profile category) */}
      {activeCategory === 'profile' && (
        <ProfileThemePicker
          useNewProfileThemes={useNewProfileThemes}
          onToggleNewThemes={() => setUseNewProfileThemes(!useNewProfileThemes)}
          profileThemeCategory={profileThemeCategory}
          onCategoryChange={setProfileThemeCategory}
          filteredThemes={filteredNewProfileThemes}
          selectedProfileThemeId={selectedThemes.profile}
          onApplyTheme={handleApplyNewProfileTheme}
        />
      )}

      {/* Legacy Themes Grid (non-profile or classic profile view) */}
      {!(activeCategory === 'profile' && useNewProfileThemes) && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {filteredThemes.map((theme, index) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={isThemeActive(theme.id, activeCategory)}
                isPreviewing={isThemePreviewing(theme.id)}
                onApply={() => handleApplyTheme(theme.id, activeCategory, theme)}
                delay={index * 0.05}
              />
            ))}

            {filteredThemes.length === 0 && (
              <div className="col-span-2 py-12 text-center text-white/60">
                No themes found matching your search.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <SaveButton onSave={handleSaveThemes} isSaving={isSaving} error={error} />
    </div>
  );
}
