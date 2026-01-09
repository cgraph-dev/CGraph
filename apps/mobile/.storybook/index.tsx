/**
 * Storybook Entry Point for React Native/Expo
 * 
 * This file bootstraps Storybook and exports the StorybookUIRoot component.
 * Import and render this component to show Storybook in your app.
 * 
 * @example
 * // In App.tsx (development mode)
 * import StorybookUIRoot from './.storybook';
 * export default StorybookUIRoot;
 * 
 * @see https://storybook.js.org/docs/react-native/get-started
 * @since v0.7.31
 */
import { view } from '@storybook/react-native';

const StorybookUIRoot = view;

export default StorybookUIRoot;
