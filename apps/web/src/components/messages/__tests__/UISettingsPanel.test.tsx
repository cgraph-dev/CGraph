import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { UISettingsPanel } from '../UISettingsPanel';
import type { UIPreferences } from '../MessageBubble';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      onClick,
      ...props
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock GlassCard
vi.mock('@/components/ui/GlassCard', () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

// Mock HapticFeedback
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@heroicons/react/24/outline')>();
  return {
    ...actual,
    SparklesIcon: () => <span data-testid="sparkles-icon">✨</span>,
  };
});

describe('UISettingsPanel', () => {
  const defaultUIPreferences: UIPreferences = {
    glassEffect: 'crystal',
    animationIntensity: 'medium',
    showParticles: true,
    enableGlow: true,
    enable3D: true,
    enableHaptic: true,
    voiceVisualizerTheme: 'matrix-green',
    messageEntranceAnimation: 'slide',
  };

  let setUiPreferences: ReturnType<typeof vi.fn>;
  let updatePreference: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setUiPreferences = vi.fn();
    updatePreference = vi.fn();
  });

  it('renders the settings panel with title', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    expect(screen.getByText('Next Gen UI Customization')).toBeInTheDocument();
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  it('renders all glass effect options', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    const glassSelect = screen.getByDisplayValue('Crystal');
    expect(glassSelect).toBeInTheDocument();

    // Check all options are present
    expect(screen.getByRole('option', { name: 'Default' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Frosted' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Crystal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Neon' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Holographic' })).toBeInTheDocument();
  });

  it('renders animation intensity options', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    expect(screen.getByRole('option', { name: 'Low (Performance)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'High (Beautiful)' })).toBeInTheDocument();
  });

  it('calls updatePreference when glass effect changes', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    const glassSelect = screen.getByDisplayValue('Crystal');
    fireEvent.change(glassSelect, { target: { value: 'neon' } });

    expect(updatePreference).toHaveBeenCalledWith('glassEffect', 'neon');
  });

  it('calls updatePreference when animation intensity changes', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    // Find the animation intensity select by its value
    const animationSelect = screen.getByDisplayValue('Medium');
    fireEvent.change(animationSelect, { target: { value: 'high' } });

    expect(updatePreference).toHaveBeenCalledWith('animationIntensity', 'high');
  });

  it('renders toggle buttons for particles, glow, 3D, and haptic', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    expect(screen.getByText('Particles')).toBeInTheDocument();
    expect(screen.getByText('Glow Effects')).toBeInTheDocument();
    expect(screen.getByText('3D Effects')).toBeInTheDocument();
    expect(screen.getByText('Haptic')).toBeInTheDocument();
  });

  it('toggles particles when Particles button is clicked', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    const particlesButton = screen.getByText('Particles');
    fireEvent.click(particlesButton);

    expect(setUiPreferences).toHaveBeenCalled();
  });

  it('renders voice theme options', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    expect(screen.getByRole('option', { name: 'Matrix Green' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cyber Blue' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Neon Pink' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Amber' })).toBeInTheDocument();
  });

  it('renders message animation options', () => {
    render(
      <UISettingsPanel
        uiPreferences={defaultUIPreferences}
        setUiPreferences={setUiPreferences}
        updatePreference={updatePreference}
      />
    );

    expect(screen.getByRole('option', { name: 'Slide' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Scale' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fade' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bounce' })).toBeInTheDocument();
  });
});
