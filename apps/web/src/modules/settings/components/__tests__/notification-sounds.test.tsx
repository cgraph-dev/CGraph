/**
 * @file notification-sounds.test.tsx
 * @description Tests for NotificationSoundSettings component — configure
 *   notification sounds for messages, mentions, calls, etc.
 * @module settings/components/__tests__/NotificationSoundSettings
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { snappy: {}, bouncy: {}, gentle: {} },
  entranceVariants: { fadeUp: { initial: {}, animate: {} } },
  loop: () => ({}),
  loopWithDelay: () => ({}),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SpeakerWaveIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="speaker-icon" {...p} />,
  PlayIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="play-icon" {...p} />,
}));

import { NotificationSoundSettings } from '../notification-sound-settings';

// ── Tests ──────────────────────────────────────────────────────────────
describe('NotificationSoundSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the heading', () => {
    render(<NotificationSoundSettings />);
    expect(screen.getByText('Notification Sounds')).toBeInTheDocument();
  });

  it('renders all 5 sound categories', () => {
    render(<NotificationSoundSettings />);
    expect(screen.getByText('New Message')).toBeInTheDocument();
    expect(screen.getByText('Mention')).toBeInTheDocument();
    expect(screen.getByText('Incoming Call')).toBeInTheDocument();
    expect(screen.getByText('Friend Request')).toBeInTheDocument();
    expect(screen.getByText('User Joined')).toBeInTheDocument();
  });

  it('renders category descriptions', () => {
    render(<NotificationSoundSettings />);
    expect(screen.getByText('When you receive a new message')).toBeInTheDocument();
  });

  it('renders volume slider with default 70%', () => {
    render(<NotificationSoundSettings />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('70');
  });

  it('displays volume percentage', () => {
    render(<NotificationSoundSettings />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('updates volume when slider changes', () => {
    render(<NotificationSoundSettings />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders 5 select dropdowns', () => {
    render(<NotificationSoundSettings />);
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
  });

  it('has "Default" selected initially for all categories', () => {
    render(<NotificationSoundSettings />);
    const selects = screen.getAllByRole('combobox');
    selects.forEach((select) => {
      expect(select).toHaveValue('default');
    });
  });

  it('persists sound change to localStorage', () => {
    render(<NotificationSoundSettings />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0]!, { target: { value: 'chime' } });
    const stored = JSON.parse(localStorage.getItem('notification_sounds') || '{}');
    expect(stored.message).toBe('chime');
  });

  it('renders preview buttons for each category', () => {
    render(<NotificationSoundSettings />);
    const previewBtns = screen.getAllByTitle('Preview');
    expect(previewBtns).toHaveLength(5);
  });
});
