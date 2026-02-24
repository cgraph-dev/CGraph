/** @module channel-item tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...rest }: any) => {
          const Tag = prop as any;
          return <Tag {...rest}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useInView: () => true,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0 }),
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  loop: () => ({}),
  springs: { snappy: {} },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

const iconProxy = new Proxy({}, {
  get: (_target, prop) => {
    if (typeof prop === 'string' && prop !== '__esModule') {
      return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
    }
    return undefined;
  },
});
vi.mock('@heroicons/react/24/outline', () => iconProxy);
vi.mock('@heroicons/react/24/solid', () => iconProxy);

vi.mock('./constants', () => ({
  channelTypeIcons: {},
  channelTypeColors: {},
}));

import { ChannelItem } from '../channel-item';

describe('ChannelItem', () => {
  const mockChannel = {
    id: 'ch1',
    name: 'general',
    type: 'text' as const,
    position: 0,
  };

  const renderWithRouter = (props: Record<string, unknown> = {}) =>
    render(
      <MemoryRouter initialEntries={['/groups/g1/channels/ch1']}>
        <ChannelItem channel={mockChannel} isActive={false} {...props} />
      </MemoryRouter>,
    );

  it('renders channel name', () => {
    renderWithRouter();
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('renders hash icon fallback', () => {
    renderWithRouter();
    expect(screen.getByTestId('icon-HashtagIcon')).toBeInTheDocument();
  });

  it('renders as a link', () => {
    renderWithRouter();
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('link points to channel route', () => {
    renderWithRouter();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/channels/ch1'));
  });
});
