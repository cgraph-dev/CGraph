/**
 * Environment configuration
 */

// Declare global process for Node.js environments
declare const process: {
  env: Record<string, string | undefined>;
} | undefined;

interface EnvConfig {
  // App
  appName: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  
  // API
  apiUrl: string;
  wsUrl: string;
  apiVersion: string;
  
  // Features
  features: {
    groups: boolean;
    forums: boolean;
    voiceChat: boolean;
    videoChat: boolean;
    walletConnect: boolean;
    web3Auth: boolean;
    notifications: boolean;
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
  // @ts-ignore - Vite specific
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore - Vite specific
    return import.meta.env[key] || import.meta.env[`VITE_${key}`] || defaultValue;
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
  
  features: {
    groups: true,
    forums: true,
    voiceChat: false,
    videoChat: false,
    walletConnect: true,
    web3Auth: true,
    notifications: true,
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
  
  features: {
    groups: true,
    forums: true,
    voiceChat: true,
    videoChat: true,
    walletConnect: true,
    web3Auth: true,
    notifications: true,
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
  
  features: {
    groups: true,
    forums: true,
    voiceChat: true,
    videoChat: true,
    walletConnect: true,
    web3Auth: true,
    notifications: true,
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
    default:
      return devConfig;
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
