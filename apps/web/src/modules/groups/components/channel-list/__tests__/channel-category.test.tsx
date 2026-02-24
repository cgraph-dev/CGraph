/** @module channel-category tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
  springs: { snappy: {} },
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

vi.mock('./sortable-channel', () => ({
  SortableChannel: ({ channel }: { channel: { name: string } }) => (
    <div data-testid="channel">{channel.name}</div>
  ),
}));

import { CategorySection } from '../channel-category';

describe('CategorySection', () => {
  const mockCategory = {
    id: 'cat1',
    name: 'TEXT CHANNELS',
    channels: [
      { id: 'ch1', name: 'general', type: 'text' as const, position: 0 },
      { id: 'ch2', name: 'random', type: 'text' as const, position: 1 },
    ],
  };

  const defaultProps = {
    category: mockCategory,
    isExpanded: true,
    activeChannelId: 'ch1',
    onToggle: vi.fn(),
    onCreateChannel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category name', () => {
    render(<CategorySection {...defaultProps} />);
    expect(screen.getByText('TEXT CHANNELS')).toBeInTheDocument();
  });

  it('renders channels when expanded', () => {
    render(<CategorySection {...defaultProps} />);
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
  });

  it('calls onToggle when header clicked', () => {
    render(<CategorySection {...defaultProps} />);
    fireEvent.click(screen.getByText('TEXT CHANNELS'));
    expect(defaultProps.onToggle).toHaveBeenCalledOnce();
  });

  it('renders chevron icon', () => {
    render(<CategorySection {...defaultProps} />);
    expect(screen.getByTestId('icon-ChevronDownIcon')).toBeInTheDocument();
  });
});
