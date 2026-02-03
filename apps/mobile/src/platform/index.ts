/**
 * Platform Library
 *
 * Cross-platform parity layer with iOS and Android specific features.
 */

// ============================================================================
// Platform Adapter (Unified API)
// ============================================================================

export {
  platformAdapter,
  getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  getPlatformVersion,
  usePlatformCapabilities,
  useUnifiedHaptic,
  useSystemColors,
  usePlatformStyles,
  selectPlatform,
  default as PlatformAdapter,
} from './PlatformAdapter';

export type {
  PlatformType,
  UnifiedCapabilities,
  HapticType,
  UnifiedIconConfig,
  BottomSheetConfig,
} from './PlatformAdapter';

// ============================================================================
// iOS Features
// ============================================================================

export {
  iosFeatures,
  useIOSFeatures,
  useDynamicIsland,
  default as IOSFeatures,
} from './ios/IOSFeatures';

export type { IOSCapabilities, DynamicIslandState, SFSymbolConfig } from './ios/IOSFeatures';

// ============================================================================
// Android Features
// ============================================================================

export {
  androidFeatures,
  useAndroidFeatures,
  useMaterialYouColors,
  usePredictiveBack,
  default as AndroidFeatures,
} from './android/AndroidFeatures';

export type {
  AndroidCapabilities,
  MaterialYouColors,
  NotificationChannelConfig,
} from './android/AndroidFeatures';

// ============================================================================
// Default Export
// ============================================================================

const Platform = {
  PlatformAdapter: require('./PlatformAdapter').default,
  IOSFeatures: require('./ios/IOSFeatures').default,
  AndroidFeatures: require('./android/AndroidFeatures').default,
};

export default Platform;
