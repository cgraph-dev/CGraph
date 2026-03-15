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
} from './platform-adapter';

export type {
  PlatformType,
  UnifiedCapabilities,
  HapticType,
  UnifiedIconConfig,
  BottomSheetConfig,
} from './platform-adapter';

// ============================================================================
// iOS Features
// ============================================================================

export {
  iosFeatures,
  useIOSFeatures,
  useDynamicIsland,
  default as IOSFeatures,
} from './ios/ios-features';

export type { IOSCapabilities, DynamicIslandState, SFSymbolConfig } from './ios/ios-features';

// ============================================================================
// Android Features
// ============================================================================

export {
  androidFeatures,
  useAndroidFeatures,
  useMaterialYouColors,
  usePredictiveBack,
  default as AndroidFeatures,
} from './android/android-features';

export type {
  AndroidCapabilities,
  MaterialYouColors,
  NotificationChannelConfig,
} from './android/android-features';

// ============================================================================
// Default Export
// ============================================================================

const Platform = {
   
  PlatformAdapter: require('./platform-adapter').default,

   
  IOSFeatures: require('./ios/ios-features').default,

   
  AndroidFeatures: require('./android/android-features').default,
};

export default Platform;
