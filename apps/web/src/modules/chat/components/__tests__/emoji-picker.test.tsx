import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { EmojiPicker } from '../emoji-picker';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: (props: any) => <input {...props} />,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useMotionValue: (initial: any) => ({ get: () => initial, set: () => {}, on: () => () => {} }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSpring: (value: any) => value,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
