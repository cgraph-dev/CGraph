/**
 * Expo App Configuration
 *
 * Dynamic configuration for Expo SDK 54
 * Handles environment-specific settings and API URL resolution
 *
 * @version 1.0.0
 * @see https://docs.expo.dev/workflow/configuration/
 */

const IS_DEV = process.env.APP_VARIANT === 'development' || process.env.NODE_ENV !== 'production';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

/**
 * Get API URL based on environment
 * - Development: localhost (for simulator) or LAN IP (for physical device)
 * - Preview: Staging server
 * - Production: Production server
 */
const getApiUrl = () => {
  if (IS_DEV) {
    // For Expo Go on physical device, use your machine's LAN IP
    // Auto-detected or configured via environment variable
    const LAN_IP = process.env.API_HOST || '192.168.1.129';
    return process.env.API_URL || `http://${LAN_IP}:4000`;
  }

  if (IS_PREVIEW) {
    return process.env.API_URL || 'https://cgraph-backend.fly.dev';
  }

  return process.env.API_URL || 'https://cgraph-backend.fly.dev';
};

/**
 * Get WebSocket URL based on environment
 */
const getWsUrl = () => {
  if (IS_DEV) {
    const LAN_IP = process.env.API_HOST || '192.168.1.129';
    return process.env.WS_URL || `ws://${LAN_IP}:4000/socket`;
  }

  if (IS_PREVIEW) {
    return process.env.WS_URL || 'wss://cgraph-backend.fly.dev/socket';
  }

  return process.env.WS_URL || 'wss://cgraph-backend.fly.dev/socket';
};

/**
 * Get app variant suffix for bundle IDs
 */
const getAppVariantSuffix = () => {
  if (IS_DEV) return '.dev';
  if (IS_PREVIEW) return '.preview';
  return '';
};

/**
 * Get app name with variant
 */
const getAppName = () => {
  if (IS_DEV) return 'CGraph (Dev)';
  if (IS_PREVIEW) return 'CGraph (Preview)';
  return 'CGraph';
};

module.exports = ({ config }) => {
  return {
    ...config,
    name: getAppName(),
    slug: 'cgraph',
    version: '0.9.31',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'cgraph',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#10b981',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: `org.cgraph.app${getAppVariantSuffix()}`,
      buildNumber: '4',
      config: {
        usesNonExemptEncryption: false,
      },
      // Universal Links (Associated Domains)
      associatedDomains: IS_DEV
        ? ['applinks:staging.cgraph.app', 'webcredentials:staging.cgraph.app']
        : ['applinks:cgraph.app', 'applinks:www.cgraph.app', 'webcredentials:cgraph.app'],
      infoPlist: {
        UIBackgroundModes: ['remote-notification', 'fetch'],
        NSCameraUsageDescription:
          'CGraph needs camera access to take photos for messages and profile pictures.',
        NSPhotoLibraryUsageDescription:
          'CGraph needs photo library access to share images in messages.',
        NSPhotoLibraryAddUsageDescription:
          'CGraph needs permission to save images to your photo library.',
        NSMicrophoneUsageDescription:
          'CGraph needs microphone access for voice messages and calls.',
        NSFaceIDUsageDescription:
          'CGraph uses Face ID to protect your account and secure messages.',
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          // Allow all HTTP connections in development mode
          // This is required for connecting to localhost or LAN IPs
          NSAllowsArbitraryLoads: IS_DEV,
          // Also allow local networking specifically for physical device testing
          NSAllowsLocalNetworking: IS_DEV,
          NSExceptionDomains: IS_DEV
            ? {
                localhost: {
                  NSExceptionAllowsInsecureHTTPLoads: true,
                  NSIncludesSubdomains: true,
                },
                // Allow all .local domains (common for LAN hostnames)
                local: {
                  NSExceptionAllowsInsecureHTTPLoads: true,
                  NSIncludesSubdomains: true,
                },
              }
            : undefined,
        },
      },
      entitlements: {
        'keychain-access-groups': [`$(AppIdentifierPrefix)org.cgraph.app${getAppVariantSuffix()}`],
        'com.apple.developer.applesignin': ['Default'],
      },
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
        ],
      },
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#10b981',
      },
      package: `org.cgraph.app${getAppVariantSuffix().replace('.', '')}`,
      versionCode: 3,
      // Android App Links (Deep Links)
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: IS_DEV ? 'staging.cgraph.app' : 'cgraph.app',
              pathPrefix: '/',
            },
            ...(IS_DEV
              ? []
              : [
                  {
                    scheme: 'https',
                    host: 'www.cgraph.app',
                    pathPrefix: '/',
                  },
                ]),
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        'CAMERA',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
        'RECORD_AUDIO',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'POST_NOTIFICATIONS',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
      ],
      blockedPermissions: ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#10b981',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'CGraph needs camera access to take photos for messages and profile pictures.',
          microphonePermission: 'CGraph needs microphone access for voice messages and calls.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'CGraph needs photo library access to share images in messages.',
          cameraPermission:
            'CGraph needs camera access to take photos for messages and profile pictures.',
        },
      ],
      [
        'expo-secure-store',
        {
          faceIDPermission: 'CGraph uses Face ID to protect your account and secure messages.',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'CGraph uses Face ID to protect your account and secure messages.',
        },
      ],
      [
        'expo-audio',
        {
          microphonePermission: 'CGraph needs microphone access for voice messages.',
        },
      ],
      'expo-video',
      'expo-asset',
      '@react-native-community/datetimepicker',
    ],
    extra: {
      apiUrl: getApiUrl(),
      wsUrl: getWsUrl(),
      environment: IS_DEV ? 'development' : IS_PREVIEW ? 'preview' : 'production',
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      eas: {
        // REQUIRED: Set EAS_PROJECT_ID before building.
        // Run `eas init` in this directory to generate a real Expo project UUID,
        // then export it: export EAS_PROJECT_ID="your-uuid-here"
        projectId: process.env.EAS_PROJECT_ID ?? 'CONFIGURE_VIA_EAS_INIT',
      },
    },
    updates: {
      enabled: !IS_DEV,
      fallbackToCacheTimeout: 0,
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? 'CONFIGURE_VIA_EAS_INIT'}`,
    },
    experiments: {
      typedRoutes: true,
    },
  };
};
