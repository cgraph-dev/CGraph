/**
 * Storybook Preview Configuration for React Native/Expo
 * 
 * Global decorators, parameters, and theme configuration.
 * Applies consistent styling to all mobile stories.
 * 
 * @see https://storybook.js.org/docs/react-native/writing-stories/decorators
 * @since v0.7.31
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Preview } from '@storybook/react';

/**
 * Global decorators applied to all stories
 */
const decorators: Preview['decorators'] = [
  (Story) => (
    <View style={styles.container}>
      <Story />
    </View>
  ),
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
});

const preview: Preview = {
  decorators,
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
