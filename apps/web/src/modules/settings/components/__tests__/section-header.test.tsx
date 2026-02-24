/**
 * @file Tests for SectionHeader component (appearance-settings)
 * @module settings/components/appearance-settings/section-header
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SectionHeader } from '../appearance-settings/section-header';

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader icon={<span>🎨</span>} title="Theme" />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<SectionHeader icon={<span data-testid="icon">🎨</span>} title="Theme" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<SectionHeader icon={<span>🎨</span>} title="Theme" description="Choose your theme" />);
    expect(screen.getByText('Choose your theme')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<SectionHeader icon={<span>🎨</span>} title="Theme" />);
    const desc = document.querySelector('p');
    expect(desc).not.toBeInTheDocument();
  });

  it('renders title as h3 element', () => {
    render(<SectionHeader icon={<span>🎨</span>} title="Fonts" />);
    const heading = screen.getByText('Fonts');
    expect(heading.tagName).toBe('H3');
  });

  it('renders with proper layout', () => {
    const { container } = render(<SectionHeader icon={<span>🎨</span>} title="Theme" />);
    expect(container.querySelector('.flex.items-center')).toBeInTheDocument();
  });

  it('renders different titles', () => {
    render(<SectionHeader icon={<span>🔤</span>} title="Typography" />);
    expect(screen.getByText('Typography')).toBeInTheDocument();
  });

  it('renders complex icon elements', () => {
    render(
      <SectionHeader
        icon={
          <div data-testid="complex-icon">
            <span>📊</span>
          </div>
        }
        title="Stats"
      />
    );
    expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
  });
});
