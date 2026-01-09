/**
 * Jest Configuration for CGraph Mobile
 *
 * Comprehensive test configuration for React Native with Expo SDK 54.
 * Supports component testing, integration tests, and snapshot testing.
 *
 * @since v0.7.28
 */

module.exports = {
  preset: 'jest-expo',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
  ],

  // Module resolution
  moduleNameMapper: {
    // Path aliases matching tsconfig
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },

  // Transform configuration - include all required packages
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@tanstack/.*|phoenix|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context)/.*',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
    '!src/types/**',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],

  // Test environment - use jest-expo default
  // testEnvironment: 'jsdom', - removed to use jest-expo default

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Verbose output for CI
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Maximum workers for parallel testing
  maxWorkers: '50%',

  // Fail tests on console warnings/errors
  errorOnDeprecated: true,

  // Timeout for individual tests
  testTimeout: 10000,

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Reporter configuration for CI
  reporters: ['default'],
};
