/** @module subscribe-button tests */
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

vi.mock('@/lib/animation-presets', () => ({ tweens: { standard: {}, quickFade: {} } }));
vi.mock('@/lib/api', () => ({ api: { post: vi.fn(), delete: vi.fn(), put: vi.fn() } }));
vi.mock('@/shared/components/ui', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

import { SubscribeButton } from '../subscribe-button';

describe('SubscribeButton', () => {
  const defaultProps = {
    targetType: 'forum' as const,
    targetId: 'forum-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell icon', () => {
    render(<SubscribeButton {...defaultProps} />);
    expect(screen.getByTestId('icon-BellIcon')).toBeInTheDocument();
  });

  it('renders with initial subscription level', () => {
    render(<SubscribeButton {...defaultProps} subscription={{ id: 'sub-1', notification_level: 'all' }} />);
    expect(screen.getByTestId('icon-BellIcon')).toBeInTheDocument();
  });

  it('shows dropdown on button click', () => {
    render(<SubscribeButton {...defaultProps} subscription={{ id: 'sub-1', notification_level: 'all' }} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(screen.getByText(/All Activity/)).toBeInTheDocument();
    expect(screen.getByText(/Mentions Only/)).toBeInTheDocument();
  });

  it('renders chevron down icon when subscribed', () => {
    render(<SubscribeButton {...defaultProps} subscription={{ id: 'sub-1', notification_level: 'all' }} />);
    expect(screen.getByTestId('icon-ChevronDownIcon')).toBeInTheDocument();
  });
});
