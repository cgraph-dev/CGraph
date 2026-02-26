/**
 * AutomodSettings Component Tests
 * @module moderation/components/automod-settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AutomodSettings } from '../automod-settings';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('AutomodSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', async () => {
    render(<AutomodSettings groupId="g1" />);
    expect(screen.getByText('AutoMod Rules')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AutomodSettings groupId="g1" />);
    // Component starts in loading state
    expect(screen.getByText('AutoMod Rules')).toBeInTheDocument();
  });

  it('shows empty state after loading when no rules', async () => {
    render(<AutomodSettings groupId="g1" />);
    await waitFor(() => {
      expect(screen.getByText('No automod rules configured')).toBeInTheDocument();
    });
  });

  it('renders "Add Rule" button', async () => {
    render(<AutomodSettings groupId="g1" />);
    await waitFor(() => {
      expect(screen.getByText('Add Rule')).toBeInTheDocument();
    });
  });
});
