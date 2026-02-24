/** @module quest-objective-item tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

import { QuestObjectiveItem } from '../quest-objective-item';

describe('QuestObjectiveItem', () => {
  const completedObjective = {
    id: 'o1',
    description: 'Send 10 messages',
    currentValue: 10,
    targetValue: 10,
    completed: true,
  };

  const incompleteObjective = {
    id: 'o2',
    description: 'Join 3 groups',
    currentValue: 1,
    targetValue: 3,
    completed: false,
  };

  it('renders objective description', () => {
    render(<QuestObjectiveItem objective={incompleteObjective} index={0} />);
    expect(screen.getByText('Join 3 groups')).toBeInTheDocument();
  });

  it('renders progress values', () => {
    render(<QuestObjectiveItem objective={incompleteObjective} index={0} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('shows check icon when completed', () => {
    render(<QuestObjectiveItem objective={completedObjective} index={0} />);
    expect(screen.getByTestId('icon-CheckCircleIcon')).toBeInTheDocument();
  });

  it('applies line-through style when completed', () => {
    render(<QuestObjectiveItem objective={completedObjective} index={0} />);
    const desc = screen.getByText('Send 10 messages');
    expect(desc.className).toContain('line-through');
  });

  it('renders incomplete indicator dot when not completed', () => {
    const { container } = render(<QuestObjectiveItem objective={incompleteObjective} index={0} />);
    const dot = container.querySelector('.bg-gray-500');
    expect(dot).toBeInTheDocument();
  });
});
