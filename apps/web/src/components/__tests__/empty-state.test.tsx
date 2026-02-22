import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  EmptyState,
  EmptyMessages,
  EmptyConversations,
  EmptyGroups,
  EmptyForums,
  EmptySearchResults,
  EmptyNotifications,
} from '../feedback/empty-state';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="Empty" description="Some description text" />);
    expect(screen.getByText('Some description text')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders an icon when provided', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">★</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render icon container when no icon is provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    // The icon wrapper div has specific classes; should not exist
    const iconWrappers = container.querySelectorAll('.w-16.h-16');
    expect(iconWrappers).toHaveLength(0);
  });

  it('renders the action button and handles click', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" action={{ label: 'Do Something', onClick }} />);
    const button = screen.getByRole('button', { name: 'Do Something' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});

describe('EmptyMessages', () => {
  it('renders no-messages text', () => {
    render(<EmptyMessages />);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText(/Start a conversation/)).toBeInTheDocument();
  });

  it('renders action button when onStartConversation is provided', () => {
    const handler = vi.fn();
    render(<EmptyMessages onStartConversation={handler} />);
    const button = screen.getByRole('button', { name: 'Start Conversation' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when onStartConversation is omitted', () => {
    render(<EmptyMessages />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyConversations', () => {
  it('renders no-conversations text with action', () => {
    const handler = vi.fn();
    render(<EmptyConversations onNewConversation={handler} />);
    expect(screen.getByText('No conversations')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'New Conversation' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyGroups', () => {
  it('renders no-groups text with action', () => {
    const handler = vi.fn();
    render(<EmptyGroups onCreateGroup={handler} />);
    expect(screen.getByText('No groups')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Create Group' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyForums', () => {
  it('renders no-forums text with action', () => {
    const handler = vi.fn();
    render(<EmptyForums onCreateForum={handler} />);
    expect(screen.getByText('No forums')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Create Forum' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('EmptySearchResults', () => {
  it('renders no-results text including the search query', () => {
    render(<EmptySearchResults query="foobar" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/foobar/)).toBeInTheDocument();
  });

  it('does not render an action button', () => {
    render(<EmptySearchResults query="test" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyNotifications', () => {
  it('renders all-caught-up text', () => {
    render(<EmptyNotifications />);
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
    expect(screen.getByText(/don't have any new notifications/)).toBeInTheDocument();
  });
});
