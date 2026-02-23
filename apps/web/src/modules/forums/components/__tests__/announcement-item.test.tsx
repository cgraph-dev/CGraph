/** @module announcement-item tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('dompurify', () => ({
  default: { sanitize: vi.fn((html: string) => html) },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
  ChevronDownIcon: (props: Record<string, unknown>) => (
    <svg data-testid="chevron-down" {...props} />
  ),
  ChevronUpIcon: (props: Record<string, unknown>) => <svg data-testid="chevron-up" {...props} />,
}));

vi.mock('@/modules/forums/components/announcementBannerStyles', () => ({
  getAnnouncementStyle: vi.fn(() => 'info'),
  getStyleClasses: vi.fn(() => ({
    container: 'mock-container',
    header: 'mock-header',
    title: 'mock-title',
    content: 'mock-content',
    readMore: 'mock-read-more',
  })),
  getStyleIcon: vi.fn(() => ({
    icon: (props: Record<string, unknown>) => <svg data-testid="style-icon" {...props} />,
    color: 'text-blue-500',
  })),
}));

import { AnnouncementItem } from '../announcement-item';

const baseAnnouncement = {
  id: 'ann-1',
  title: 'Test Announcement',
  content: 'Short content here',
  allowHtml: false,
  isPinned: true,
  backgroundColor: undefined,
};

const longAnnouncement = {
  ...baseAnnouncement,
  content: 'A'.repeat(250),
};

describe('AnnouncementItem', () => {
  const onToggle = vi.fn();
  const onDismiss = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders announcement title', () => {
    render(
      <AnnouncementItem
        announcement={baseAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.getByText('Test Announcement')).toBeInTheDocument();
  });

  it('renders style icon', () => {
    render(
      <AnnouncementItem
        announcement={baseAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.getByTestId('style-icon')).toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss provided', () => {
    render(
      <AnnouncementItem
        announcement={baseAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        onDismiss={onDismiss}
        collapsible
      />
    );
    expect(screen.getByTitle('Dismiss')).toBeInTheDocument();
  });

  it('does not render dismiss button when onDismiss omitted', () => {
    render(
      <AnnouncementItem
        announcement={baseAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.queryByTitle('Dismiss')).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    render(
      <AnnouncementItem
        announcement={baseAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        onDismiss={onDismiss}
        collapsible
      />
    );
    fireEvent.click(screen.getByTitle('Dismiss'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows "Read more" for long collapsible content when collapsed', () => {
    render(
      <AnnouncementItem
        announcement={longAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.getByText('Read more')).toBeInTheDocument();
  });

  it('does not show "Read more" for short content', () => {
    render(
      <AnnouncementItem
        announcement={baseAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.queryByText('Read more')).not.toBeInTheDocument();
  });

  it('does not show toggle when not collapsible', () => {
    render(
      <AnnouncementItem
        announcement={longAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible={false}
      />
    );
    expect(screen.queryByText('Read more')).not.toBeInTheDocument();
  });

  it('calls onToggle when "Read more" clicked', () => {
    render(
      <AnnouncementItem
        announcement={longAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    fireEvent.click(screen.getByText('Read more'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows chevron down when collapsed with long content', () => {
    render(
      <AnnouncementItem
        announcement={longAnnouncement as never}
        isExpanded={false}
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('shows chevron up when expanded with long content', () => {
    render(
      <AnnouncementItem
        announcement={longAnnouncement as never}
        isExpanded
        onToggle={onToggle}
        collapsible
      />
    );
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
  });
});
