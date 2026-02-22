/**
 * IdentityCustomization Module
 *
 * Comprehensive identity customization page with 4 sections:
 * 1. Avatar Borders - 150+ animated borders with rarity filtering
 * 2. Titles - 30+ animated title styles
 * 3. Badges - 40+ badges, equip up to 5 with progress tracking
 * 4. Profile Card Layouts - 7 layout styles with visual previews
 */

export { default } from './identity-customization';

// Types
export type { Rarity, Border, Title, Badge, ProfileLayout, RarityOption } from './types';

// Constants
export {
  RARITIES,
  MOCK_BORDERS,
  MOCK_TITLES,
  MOCK_BADGES,
  PROFILE_LAYOUTS,
  getRarityColor,
  getV2BorderType,
  LEGACY_BORDER_ID_TO_V2_TYPE,
} from './constants';

// Section Components
export { BordersSection, TitlesSection, BadgesSection, LayoutsSection } from './sections';
