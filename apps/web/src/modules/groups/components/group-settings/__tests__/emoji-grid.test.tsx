/** @module emoji-grid tests */
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
  entranceVariants: {},
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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
}));

import { EmojiGrid } from '../emoji-grid';

describe('EmojiGrid', () => {
  const mockEmojis = [
    {
      id: 'e1',
      name: 'thumbsup',
      imageUrl: '/emoji/thumbsup.png',
      isAnimated: false,
      isAvailable: true,
      uploadedBy: 'user1',
      createdAt: '2024-01-01',
    },
    {
      id: 'e2',
      name: 'party',
      imageUrl: '/emoji/party.gif',
      isAnimated: true,
      isAvailable: true,
      uploadedBy: 'user2',
      createdAt: '2024-01-02',
    },
  ];

  const defaultProps = {
    emojis: mockEmojis,
    loading: false,
    editingId: null,
    editName: '',
    onEditNameChange: vi.fn(),
    onStartEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onRename: vi.fn(),
    onDeleteRequest: vi.fn(),
    onUploadClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders emoji names', () => {
    render(<EmojiGrid {...defaultProps} />);
    expect(screen.getByText('thumbsup')).toBeInTheDocument();
    expect(screen.getByText('party')).toBeInTheDocument();
  });

  it('renders emoji images', () => {
    render(<EmojiGrid {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(2);
  });

  it('renders upload button', () => {
    render(<EmojiGrid {...defaultProps} />);
    expect(screen.getByTestId('icon-PlusIcon')).toBeInTheDocument();
  });

  it('calls onUploadClick when upload button clicked', () => {
    render(<EmojiGrid {...defaultProps} />);
    const plusBtn = screen.getByTestId('icon-PlusIcon').closest('button');
    if (plusBtn) fireEvent.click(plusBtn);
    expect(defaultProps.onUploadClick).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<EmojiGrid {...defaultProps} loading={true} />);
    // Should show loading indicator or skeleton
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
