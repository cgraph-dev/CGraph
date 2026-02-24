/** @module auth-card tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy(
    {} as Record<
      string,
      (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
    >,
    {
      get: (_target, prop) => {
        return ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Tag = (typeof prop === 'string' ? prop : 'div') as keyof JSX.IntrinsicElements;
          return <Tag className={className as string}>{children}</Tag>;
        };
      },
    }
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/components/effects/auth-background', () => ({
  AuthBackground: () => <div data-testid="auth-background" />,
}));

vi.mock('@/modules/auth/components/auth-backgrounds', () => ({
  AuthBackground: () => <div data-testid="auth-background" />,
}));

vi.mock('../auth-logo', () => ({
  AuthLogo: ({ size }: { size: string }) => <div data-testid="auth-logo" data-size={size} />,
}));

vi.mock('@/modules/auth/components/auth-logo', () => ({
  AuthLogo: ({ size }: { size: string }) => <div data-testid="auth-logo" data-size={size} />,
}));

vi.mock('@/components/ui/glass-card', () => ({
  GlassCard: ({ children, variant }: React.PropsWithChildren<{ variant?: string }>) => (
    <div data-testid="glass-card" data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, variant }: React.PropsWithChildren<{ variant?: string }>) => (
    <div data-testid="glass-card" data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('../auth-card-header', () => ({
  AuthCardHeader: ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <div data-testid="auth-card-header">
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

vi.mock('@/modules/auth/components/auth-card-header', () => ({
  AuthCardHeader: ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <div data-testid="auth-card-header">
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

vi.mock('@/lib/animation-presets', () => ({
  springs: { ultraSmooth: { type: 'spring', stiffness: 100, damping: 15 } },
}));

import { AuthCard } from '../auth-card';

describe('AuthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <AuthCard variant="default">
        <p>Login form content</p>
      </AuthCard>
    );
    expect(screen.getByText('Login form content')).toBeInTheDocument();
  });

  it('renders default variant with glass card', () => {
    render(
      <AuthCard variant="default">
        <p>Content</p>
      </AuthCard>
    );
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(
      <AuthCard variant="compact">
        <p>Compact content</p>
      </AuthCard>
    );
    expect(screen.getByText('Compact content')).toBeInTheDocument();
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders split variant with background', () => {
    render(
      <AuthCard variant="split">
        <p>Split content</p>
      </AuthCard>
    );
    expect(screen.getByText('Split content')).toBeInTheDocument();
    expect(screen.getByTestId('auth-background')).toBeInTheDocument();
  });

  it('renders title and subtitle via header', () => {
    render(
      <AuthCard variant="default" title="Welcome" subtitle="Sign in to continue">
        <p>Form</p>
      </AuthCard>
    );
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
  });

  it('renders footer content', () => {
    render(
      <AuthCard variant="default" footer={<span>Footer link</span>}>
        <p>Form</p>
      </AuthCard>
    );
    expect(screen.getByText('Footer link')).toBeInTheDocument();
  });

  it('renders logo when showLogo is true', () => {
    render(
      <AuthCard variant="default" showLogo logoSize="lg">
        <p>Content</p>
      </AuthCard>
    );
    expect(screen.getByTestId('auth-logo')).toBeInTheDocument();
  });
});
