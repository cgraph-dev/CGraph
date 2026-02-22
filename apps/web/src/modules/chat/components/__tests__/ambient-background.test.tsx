import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AmbientBackground } from '../ambient-background';
import type { UIPreferences } from '../message-bubble';

const defaultUIPreferences: UIPreferences = {
  glassEffect: 'crystal',
  animationIntensity: 'medium',
  showParticles: true,
  enableGlow: true,
  enable3D: true,
  enableHaptic: false,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'slide',
};

describe('AmbientBackground', () => {
  it('renders particles when showParticles is true', () => {
    const { container } = render(<AmbientBackground uiPreferences={defaultUIPreferences} />);

    // Should render the container div
    const wrapper = container.firstChild;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('pointer-events-none', 'absolute', 'inset-0');
  });

  it('renders nothing when showParticles is false', () => {
    const prefs: UIPreferences = {
      ...defaultUIPreferences,
      showParticles: false,
    };

    const { container } = render(<AmbientBackground uiPreferences={prefs} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders fewer particles when animationIntensity is low', () => {
    const prefs: UIPreferences = {
      ...defaultUIPreferences,
      animationIntensity: 'low',
    };

    const { container } = render(<AmbientBackground uiPreferences={prefs} />);
    const wrapper = container.firstChild as HTMLElement;

    // Low intensity should have 5 particles
    expect(wrapper.childElementCount).toBe(5);
  });

  it('renders more particles when animationIntensity is high', () => {
    const prefs: UIPreferences = {
      ...defaultUIPreferences,
      animationIntensity: 'high',
    };

    const { container } = render(<AmbientBackground uiPreferences={prefs} />);
    const wrapper = container.firstChild as HTMLElement;

    // High intensity should have 15 particles
    expect(wrapper.childElementCount).toBe(15);
  });

  it('renders medium particles when animationIntensity is medium', () => {
    const prefs: UIPreferences = {
      ...defaultUIPreferences,
      animationIntensity: 'medium',
    };

    const { container } = render(<AmbientBackground uiPreferences={prefs} />);
    const wrapper = container.firstChild as HTMLElement;

    // Medium intensity should have 10 particles
    expect(wrapper.childElementCount).toBe(10);
  });
});
