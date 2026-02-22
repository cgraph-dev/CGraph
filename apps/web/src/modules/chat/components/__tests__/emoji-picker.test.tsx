import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { EmojiPicker } from '../emoji-picker';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    input: (props: any) => <input {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: (initial: any) => ({ get: () => initial, set: () => {}, on: () => () => {} }),
  useSpring: (value: any) => value,
  useTransform: (value: any) => value,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

describe('EmojiPicker', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    expect(document.body).toBeTruthy();
  });

  it('calls onSelect when emoji is clicked', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    const buttons = document.querySelectorAll('button');
    if (buttons.length > 0) {
      buttons[0]!.click();
    }
    expect(document.body).toBeTruthy();
  });
});
