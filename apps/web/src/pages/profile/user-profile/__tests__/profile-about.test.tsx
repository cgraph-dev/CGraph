/** @module profile-about tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileAbout } from '../profile-about';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {} as Record<
      string,
      (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
    >,
    {
      get:
        (_target, prop) =>
        ({ children, className, ..._rest }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Tag = (
            typeof prop === 'string' ? prop : 'div'
          ) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any;
          // Pass through common HTML attributes
          const passthrough: Record<string, unknown> = { className: className as string };
          for (const k of ['placeholder', 'value', 'onChange', 'rows', 'maxLength'] as const) {
            if (k in _rest) passthrough[k] = _rest[k as string];
          }
          return <Tag {...passthrough}>{children}</Tag>;
        },
    }
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

describe('ProfileAbout', () => {
  it('returns null when no bio and not editing own profile', () => {
    const { container } = render(
      <ProfileAbout isOwnProfile={false} editMode={false} editedBio="" onBioChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders bio text in view mode', () => {
    render(
      <ProfileAbout
        bio="Hello world"
        isOwnProfile={false}
        editMode={false}
        editedBio=""
        onBioChange={vi.fn()}
      />
    );
    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });

  it('shows textarea in edit mode for own profile', () => {
    render(
      <ProfileAbout
        bio="Old bio"
        isOwnProfile={true}
        editMode={true}
        editedBio="New bio"
        onBioChange={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText('Tell us about yourself...');
    expect(textarea).toBeTruthy();
    expect((textarea as HTMLTextAreaElement).value).toBe('New bio');
  });

  it('shows character count in edit mode', () => {
    render(
      <ProfileAbout
        bio=""
        isOwnProfile={true}
        editMode={true}
        editedBio="Hello"
        onBioChange={vi.fn()}
      />
    );
    expect(screen.getByText('5 / 500 characters')).toBeTruthy();
  });

  it('calls onBioChange when typing', () => {
    const onBioChange = vi.fn();
    render(
      <ProfileAbout
        bio=""
        isOwnProfile={true}
        editMode={true}
        editedBio=""
        onBioChange={onBioChange}
      />
    );
    const textarea = screen.getByPlaceholderText('Tell us about yourself...');
    fireEvent.change(textarea, { target: { value: 'Updated' } });
    expect(onBioChange).toHaveBeenCalledWith('Updated');
  });

  it('shows edit hint for own profile in edit mode', () => {
    render(
      <ProfileAbout
        bio="Bio"
        isOwnProfile={true}
        editMode={true}
        editedBio="Bio"
        onBioChange={vi.fn()}
      />
    );
    expect(screen.getByText('(Click to edit)')).toBeTruthy();
  });

  it('shows section even without bio when own profile in edit mode', () => {
    render(<ProfileAbout isOwnProfile={true} editMode={true} editedBio="" onBioChange={vi.fn()} />);
    expect(screen.getByText('About')).toBeTruthy();
  });
});
