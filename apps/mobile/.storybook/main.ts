/**
 * Storybook Main Configuration for React Native/Expo
 * 
 * Configures Storybook with on-device addons for mobile development.
 * Stories are loaded from the src/components directory.
 * 
 * @see https://storybook.js.org/docs/react-native/get-started
 * @since v0.7.31
 */
import { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.?(ts|tsx|js|jsx)',
  ],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
  ],
};

export default main;
