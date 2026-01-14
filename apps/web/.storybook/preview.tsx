/**
 * Storybook Preview Configuration
 * 
 * Global decorators, parameters, and theme configuration.
 * Applies TailwindCSS and global styles to all stories.
 * 
 * @see https://storybook.js.org/docs/configure#configure-story-rendering
 * @since v0.7.30
 */
import React from 'react';
import type { Preview } from '@storybook/react';
import '../src/index.css';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { handlers } from '../src/mocks/handlers';

initialize({ onUnhandledRequest: 'bypass' });

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f23' },
        { name: 'light', value: '#ffffff' },
        { name: 'gray', value: '#1a1a2e' },
      ],
    },
    
    layout: 'centered',
    
    docs: {
      toc: true,
    },
    
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
  
  decorators: [
    mswDecorator,
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],

  msw: {
    handlers,
  },
  
  tags: ['autodocs'],
};

export default preview;
