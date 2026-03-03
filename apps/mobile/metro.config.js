/**
 * Metro configuration for Expo SDK 54
 * @see https://docs.expo.dev/guides/monorepos/
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root (monorepo root)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Add the workspace root to watch folders (keeping Expo defaults)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Let Metro know where to resolve packages in monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Fix pnpm monorepo entry point: Expo Go requests "expo/AppEntry" which
// has `import App from '../../App'` — that relative path only works with
// flat node_modules. Redirect to our project's index.js instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo/AppEntry' || moduleName.endsWith('expo/AppEntry.js')) {
    return {
      filePath: path.resolve(projectRoot, 'index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Transformer settings optimized for new architecture
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
