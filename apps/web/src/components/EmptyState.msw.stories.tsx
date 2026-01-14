import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import EmptyState from './EmptyState';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState/MSW Example',
  component: EmptyState,
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/api/v1/users/me`, () =>
          HttpResponse.json({ data: { id: 'story-user', email: 'story@example.com' } })
        ),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const WithMockedRequest: Story = {
  args: {
    title: 'All caught up',
    description: 'This story uses MSW to mock /users/me.',
  },
};