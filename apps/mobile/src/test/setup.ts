/**
 * Jest Test Setup for CGraph Mobile
 *
 * Global test configuration, mocks, and utilities for React Native testing.
 * Provides comprehensive mocking of Expo modules and React Native APIs.
 *
 * @since v0.7.28
 */

// The jest matchers are now built into @testing-library/react-native v12.4+
// No explicit import needed - they're auto-registered when jest-expo is used

// Silence console noise during tests unless debugging
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    // Filter React internal warnings that aren't actionable in tests
    if (
      message.includes('Warning: ReactDOM.render') ||
      message.includes('Warning: An update to') ||
      message.includes('act(...)') ||
      message.includes('not wrapped in act')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    // Filter React Native specific warnings
    if (
      message.includes('Animated:') ||
      message.includes('NativeEventEmitter') ||
      message.includes('Require cycle')
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: 'CGraph',
      slug: 'cgraph',
      extra: {
        apiUrl: 'http://localhost:4000',
        isDevMode: true,
      },
    },
    appOwnership: 'expo',
  },
}));

// Mock Expo SplashScreen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

// Mock Expo Font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(true),
  useFonts: jest.fn(() => [true]),
  isLoaded: jest.fn().mockReturnValue(true),
  Font: {
    isLoaded: jest.fn().mockReturnValue(true),
  },
}));

// Mock @expo/vector-icons - creates simple Text components
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const createMockIcon = (name: string) => {
    const MockIcon = (props: { name?: string; size?: number; color?: string }) =>
      React.createElement(Text, { testID: `icon-${props.name || 'unknown'}` }, `[${name}]`);
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Ionicons: createMockIcon('Ionicons'),
    MaterialIcons: createMockIcon('MaterialIcons'),
    MaterialCommunityIcons: createMockIcon('MaterialCommunityIcons'),
    FontAwesome: createMockIcon('FontAwesome'),
    FontAwesome5: createMockIcon('FontAwesome5'),
    Feather: createMockIcon('Feather'),
    AntDesign: createMockIcon('AntDesign'),
    Entypo: createMockIcon('Entypo'),
    EvilIcons: createMockIcon('EvilIcons'),
    Octicons: createMockIcon('Octicons'),
    createIconSet: jest.fn(() => createMockIcon('CustomIcon')),
    createIconSetFromIcoMoon: jest.fn(() => createMockIcon('IcoMoonIcon')),
    createIconSetFromFontello: jest.fn(() => createMockIcon('FontelloIcon')),
  };
});

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock Expo Local Authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock Expo Clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue(''),
  hasStringAsync: jest.fn().mockResolvedValue(false),
}));

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: null,
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: null,
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: {
    All: 'All',
    Images: 'Images',
    Videos: 'Videos',
  },
}));

// Mock Expo File System
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  cacheDirectory: '/mock/cache/directory/',
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/mock/downloaded/file' }),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

// Mock Expo Audio
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seekTo: jest.fn(),
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isLoaded: true,
  })),
  useAudioRecorder: jest.fn(() => ({
    record: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    isRecording: false,
    uri: null,
  })),
  AudioMode: {
    PLAYBACK: 'playback',
    RECORDING: 'recording',
  },
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      reset: jest.fn(),
      dispatch: jest.fn(),
      isFocused: jest.fn(() => true),
      canGoBack: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
      name: 'MockRoute',
      key: 'mock-key',
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    useIsFocused: () => true,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock Axios for API testing
interface MockAxiosInstance {
  create: jest.Mock;
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
  defaults: { headers: { common: Record<string, string> } };
  interceptors: {
    request: { use: jest.Mock; eject: jest.Mock };
    response: { use: jest.Mock; eject: jest.Mock };
  };
}

jest.mock('axios', () => {
  const mockAxios: MockAxiosInstance = {
    create: jest.fn((): MockAxiosInstance => mockAxios),
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockAxios,
    ...mockAxios,
  };
});

// Mock Phoenix socket for real-time testing
jest.mock('phoenix', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    isConnected: jest.fn(() => false),
    channel: jest.fn().mockImplementation(() => ({
      join: jest.fn().mockReturnValue({
        receive: jest.fn().mockReturnThis(),
      }),
      leave: jest.fn(),
      push: jest.fn().mockReturnValue({
        receive: jest.fn().mockReturnThis(),
      }),
      on: jest.fn(),
      off: jest.fn(),
    })),
  })),
  Presence: jest.fn().mockImplementation(() => ({
    onSync: jest.fn(),
    onJoin: jest.fn(),
    onLeave: jest.fn(),
    list: jest.fn(() => []),
  })),
}));

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
    }
  }
}

// Extend Jest matchers for accessibility testing
expect.extend({
  toBeAccessible(received) {
    const hasAccessibilityLabel =
      received?.props?.accessibilityLabel !== undefined ||
      received?.props?.accessible !== undefined;

    return {
      pass: hasAccessibilityLabel,
      message: () =>
        hasAccessibilityLabel
          ? `Expected element not to have accessibility attributes`
          : `Expected element to have accessibilityLabel or accessible prop`,
    };
  },
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Export test utilities for reuse
export {};
