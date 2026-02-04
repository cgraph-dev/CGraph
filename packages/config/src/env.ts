/**
 * Environment configuration
 */

// Declare global process for Node.js environments
declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

interface EnvConfig {
  // App
  appName: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;

  // API
  apiUrl: string;
  wsUrl: string;
  apiVersion: string;

  // AI Configuration - Placeholder for future Claude integration
  // @see docs/architecture/AI_INTEGRATION.md for implementation plan
  ai: {
    enabled: boolean; // Currently disabled - future feature
    model: 'claude-4-opus'; // Claude will be the only supported model
    endpoint?: string;
    maxTokens: number;
    temperature: number;
    features: {
      forumModeration: boolean; // Future: AI-powered forum moderation
      chatSuggestions: boolean; // Future: Smart chat suggestions
      contentModeration: boolean; // Future: Content moderation
      smartSearch: boolean; // Future: AI-enhanced search
    };
    rateLimits: {
      requestsPerMinute: number;
      tokensPerDay: number;
    };
  };

  // Features
  features: {
    groups: boolean;
    forums: boolean;
    voiceChat: boolean;
    videoChat: boolean;
    walletConnect: boolean;
    web3Auth: boolean;
    notifications: boolean;
    aiAssistant: boolean; // Master toggle for AI features
  };

  // Third-party
  sentryDsn?: string;
  analyticsId?: string;
  walletConnectProjectId?: string;

  // Upload
  maxUploadSize: number;
  uploadEndpoint: string;
  cdnUrl: string;
}

/**
 * Get the current environment
 */
function getEnvironment(): 'development' | 'staging' | 'production' {
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env.NODE_ENV || process.env.VITE_ENV;
    if (env === 'production') return 'production';
    if (env === 'staging') return 'staging';
  }
  return 'development';
}

/**
 * Get environment variable (works in both Vite and Node)
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`VITE_${key}`] || defaultValue;
  }
  // Vite-specific import.meta.env handling
  const meta =
    typeof globalThis !== 'undefined'
      ? (globalThis as { import_meta?: { env?: Record<string, string> } }).import_meta
      : undefined;
  if (meta?.env) {
    return meta.env[key] || meta.env[`VITE_${key}`] || defaultValue;
  }
  // Check for browser build-time injected import.meta
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const importMeta = import.meta as any as { env?: Record<string, string> };
    if (importMeta.env) {
      return importMeta.env[key] || importMeta.env[`VITE_${key}`] || defaultValue;
    }
  } catch {
    // import.meta not available in this environment
  }
  return defaultValue;
}

/**
 * Development configuration
 */
const devConfig: EnvConfig = {
  appName: 'CGraph Dev',
  environment: 'development',
  debug: true,

  apiUrl: 'http://localhost:4000/api/v1',
  wsUrl: 'ws://localhost:4000/socket',
  apiVersion: 'v1',

  // AI - Disabled placeholder for future Claude integration
  ai: {
    enabled: false, // AI features not yet implemented
    model: 'claude-4-opus',
    endpoint: undefined,
    maxTokens: 200000,
    temperature: 0.7,
    features: {
      forumModeration: false,
      chatSuggestions: false,
      contentModeration: false,
      smartSearch: false,
    },
    rateLimits: {
      requestsPerMinute: 10,
      tokensPerDay: 10000,
    },
  },

  features: {
    groups: true,
    forums: true,
    voiceChat: false,
    videoChat: false,
    walletConnect: true,
    web3Auth: true,
    notifications: true,
    aiAssistant: true,
  },

  maxUploadSize: 100 * 1024 * 1024,
  uploadEndpoint: 'http://localhost:4000/api/v1/upload',
  cdnUrl: 'http://localhost:4000/uploads',
};

/**
 * Staging configuration
 */
const stagingConfig: EnvConfig = {
  appName: 'CGraph Staging',
  environment: 'staging',
  debug: true,

  apiUrl: 'https://staging-api.cgraph.io/api/v1',
  wsUrl: 'wss://staging-api.cgraph.io/socket',
  apiVersion: 'v1',

  // AI - Disabled placeholder for future Claude integration
  ai: {
    enabled: false, // AI features not yet implemented
    model: 'claude-4-opus',
    endpoint: undefined,
    maxTokens: 200000,
    temperature: 0.7,
    features: {
      forumModeration: false,
      chatSuggestions: false,
      contentModeration: false,
      smartSearch: false,
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerDay: 100000,
    },
  },

  features: {
    groups: true,
    forums: true,
    voiceChat: true,
    videoChat: true,
    walletConnect: true,
    web3Auth: true,
    notifications: true,
    aiAssistant: true,
  },

  sentryDsn: getEnvVar('SENTRY_DSN'),
  analyticsId: getEnvVar('ANALYTICS_ID'),
  walletConnectProjectId: getEnvVar('WALLET_CONNECT_PROJECT_ID'),

  maxUploadSize: 100 * 1024 * 1024,
  uploadEndpoint: 'https://staging-api.cgraph.io/api/v1/upload',
  cdnUrl: 'https://staging-cdn.cgraph.io',
};

/**
 * Production configuration
 */
const prodConfig: EnvConfig = {
  appName: 'CGraph',
  environment: 'production',
  debug: false,

  apiUrl: 'https://api.cgraph.io/api/v1',
  wsUrl: 'wss://api.cgraph.io/socket',
  apiVersion: 'v1',

  // AI - Disabled placeholder for future Claude integration
  ai: {
    enabled: false, // AI features not yet implemented
    model: 'claude-4-opus',
    endpoint: undefined,
    maxTokens: 200000,
    temperature: 0.5,
    features: {
      forumModeration: false,
      chatSuggestions: false,
      contentModeration: false,
      smartSearch: false,
    },
    rateLimits: {
      requestsPerMinute: 200,
      tokensPerDay: 1000000,
    },
  },

  features: {
    groups: true,
    forums: true,
    voiceChat: true,
    videoChat: true,
    walletConnect: true,
    web3Auth: true,
    notifications: true,
    aiAssistant: true,
  },

  sentryDsn: getEnvVar('SENTRY_DSN'),
  analyticsId: getEnvVar('ANALYTICS_ID'),
  walletConnectProjectId: getEnvVar('WALLET_CONNECT_PROJECT_ID'),

  maxUploadSize: 100 * 1024 * 1024,
  uploadEndpoint: 'https://api.cgraph.io/api/v1/upload',
  cdnUrl: 'https://cdn.cgraph.io',
};

/**
 * Get the configuration for the current environment
 */
export function getConfig(): EnvConfig {
  const env = getEnvironment();

  switch (env) {
    case 'production':
      return prodConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
      return devConfig;
    default: {
      // Exhaustive check - TypeScript error if a case is missing
      const _exhaustive: never = env;
      throw new Error(`Unhandled environment: ${_exhaustive}`);
    }
  }
}

/**
 * Current configuration
 */
export const config = getConfig();

/**
 * Check if in development mode
 */
export function isDev(): boolean {
  return config.environment === 'development';
}

/**
 * Check if in production mode
 */
export function isProd(): boolean {
  return config.environment === 'production';
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvConfig['features']): boolean {
  return config.features[feature];
}
