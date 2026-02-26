/** @module quest-objective-item tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
