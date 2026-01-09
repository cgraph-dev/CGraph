/**
 * Storybook Main Configuration
 * 
 * Configures Storybook with Vite builder and React framework.
 * Includes addons for documentation, interactions, and accessibility.
 * 
 * @see https://storybook.js.org/docs/configure
 * @since v0.7.30
 */
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
  ],
  
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: 'vite.config.ts',
      },
    },
  },
  
  docs: {},
  
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out HTML native props to reduce noise
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules/@types/react');
        }
        return true;
      },
    },
  },
  
  viteFinal: async (config) => {
    // Ensure proper resolution for Storybook
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': '/src',
      };
    }
    return config;
  },
};

export default config;
