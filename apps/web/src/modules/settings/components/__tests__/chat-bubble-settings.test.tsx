/** @module ChatBubbleSettings tests */

import React from 'react';
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
  tweens: { standard: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { fast: {} },
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
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

const mockUpdateChatBubble = vi.fn();
const mockResetChatBubble = vi.fn();
const mockApplyPreset = vi.fn();

vi.mock('@/stores/theme', () => ({
  useChatBubbleStore: () => ({
    chatBubble: {
      bubbleShape: 'rounded',
      ownMessageBg: '#3b82f6',
      ownMessageText: '#ffffff',
      borderRadius: 12,
      shadowIntensity: 15,
      entranceAnimation: 'slide',
      hoverEffect: true,
      glassEffect: false,
      borderStyle: 'none',
    },
    updateChatBubble: mockUpdateChatBubble,
    resetChatBubble: mockResetChatBubble,
    applyPreset: mockApplyPreset,
  }),
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useChatCustomization: () => ({
    updateChat: vi.fn(),
  }),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/data/chatBackgrounds', () => ({
  CHAT_BACKGROUNDS: [{ id: 'default_dark', name: 'Dark', category: 'solid' }],
  getBackgroundsByCategory: () => [],
}));

vi.mock('./chat-bubble-settings.constants', () => ({
  CHAT_BUBBLE_PRESETS_UI: [
    { id: 'default', label: 'Default', preview: 'bg-gray-700' },
    { id: 'neon', label: 'Neon', preview: 'bg-green-500' },
  ],
  CHAT_BUBBLE_TABS: [
    { id: 'colors', label: 'Colors' },
    { id: 'shape', label: 'Shape' },
  ],
}));

vi.mock('./chat-bubble-tabs', () => ({
  ColorsTab: () => <div data-testid="colors-tab">Colors Tab</div>,
  ShapeTab: () => <div data-testid="shape-tab">Shape Tab</div>,
  EffectsTab: () => <div data-testid="effects-tab">Effects Tab</div>,
  AnimationsTab: () => <div data-testid="animations-tab">Animations Tab</div>,
  LayoutTab: () => <div data-testid="layout-tab">Layout Tab</div>,
  BackgroundsTab: () => <div data-testid="backgrounds-tab">Backgrounds Tab</div>,
}));

import ChatBubbleSettings from '../chat-bubble-settings';

describe('ChatBubbleSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings header', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Chat Bubble Customization')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Personalize your message bubbles')).toBeInTheDocument();
  });

  it('renders the chat bubble icon', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByTestId('icon-ChatBubbleLeftIcon')).toBeInTheDocument();
  });

  it('renders the reset button icon', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByTestId('icon-ArrowPathIcon')).toBeInTheDocument();
  });

  it('renders Quick Presets section', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Quick Presets')).toBeInTheDocument();
  });

  it('renders preset options', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Neon')).toBeInTheDocument();
  });

  it('renders Preview section', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders GlassCard components', () => {
    render(<ChatBubbleSettings />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('calls applyPreset when a preset button is clicked', () => {
    render(<ChatBubbleSettings />);
    fireEvent.click(screen.getByText('Neon'));
    expect(mockApplyPreset).toHaveBeenCalledWith('neon');
  });
});
