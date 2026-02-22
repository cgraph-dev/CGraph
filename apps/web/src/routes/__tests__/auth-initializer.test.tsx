import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ---------------------------------------------------------------------------
// vi.hoisted – variables available inside hoisted vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockCheckAuth,
  mockFetchGamificationData,
  mockSyncWithServer,
  mockFetchCustomizations,
  mockApplyTheme,
  authState,
  themeState,
} = vi.hoisted(() => {
  const mockCheckAuth = vi.fn().mockResolvedValue(undefined);
  const mockFetchGamificationData = vi.fn().mockResolvedValue(undefined);
  const mockSyncWithServer = vi.fn().mockResolvedValue(undefined);
  const mockFetchCustomizations = vi.fn().mockResolvedValue(undefined);
  const mockApplyTheme = vi.fn();

  const authState = {
    isAuthenticated: false,
    user: null as { id: string } | null,
    checkAuth: mockCheckAuth,
  };

  const themeState = {
    theme: { colorPreset: 'emerald' },
    syncWithServer: mockSyncWithServer,
  };

  return {
    mockCheckAuth,
    mockFetchGamificationData,
    mockSyncWithServer,
    mockFetchCustomizations,
    mockApplyTheme,
    authState,
    themeState,
  };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn((selector: (s: typeof authState) => unknown) => selector(authState)),
}));

vi.mock('@/modules/gamification/store', () => ({
  useGamificationStore: vi.fn(
    (selector: (s: { fetchGamificationData: typeof mockFetchGamificationData }) => unknown) =>
      selector({ fetchGamificationData: mockFetchGamificationData })
  ),
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn((selector: (s: typeof themeState) => unknown) => selector(themeState)),
  THEME_COLORS: {
    emerald: {
      primary: '#00ff88',
      secondary: '#00ccff',
      glow: 'rgba(0,255,136,0.3)',
      gradient: 'linear-gradient(135deg, #00ff88, #00ccff)',
    },
    ruby: {
      primary: '#ff0044',
      secondary: '#ff4488',
      glow: 'rgba(255,0,68,0.3)',
      gradient: 'linear-gradient(135deg, #ff0044, #ff4488)',
    },
  },
}));

vi.mock('@/modules/settings/store/customization', () => ({
  useCustomizationStore: vi.fn(
    (selector: (s: { fetchCustomizations: typeof mockFetchCustomizations }) => unknown) =>
      selector({ fetchCustomizations: mockFetchCustomizations })
  ),
}));

vi.mock('@/themes/ThemeRegistry', () => ({
  ThemeRegistry: { applyTheme: mockApplyTheme },
}));

vi.mock('@/modules/settings/hooks/useCustomizationApplication', () => ({
  useCustomizationApplication: vi.fn(),
}));

// Import component AFTER mocks
import { AuthInitializer } from '../auth-initializer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderInitializer(children: React.ReactNode = <div data-testid="app">App</div>) {
  return render(<AuthInitializer>{children}</AuthInitializer>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthInitializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = false;
    authState.user = null;
    authState.checkAuth = mockCheckAuth;
    themeState.theme = { colorPreset: 'emerald' };
    themeState.syncWithServer = mockSyncWithServer;
    // localStorage mock
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  });

  // --- Rendering ---

  it('renders children immediately', () => {
    renderInitializer();
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  it('renders arbitrary child content', () => {
    renderInitializer(<span data-testid="custom">Custom</span>);
    expect(screen.getByTestId('custom')).toHaveTextContent('Custom');
  });

  it('never blocks rendering (children visible even before auth resolves)', () => {
    mockCheckAuth.mockReturnValue(new Promise(() => {})); // never resolves
    renderInitializer();
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  // --- Auth initialization ---

  it('calls checkAuth on mount', () => {
    renderInitializer();
    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
  });

  it('handles checkAuth rejection gracefully', async () => {
    mockCheckAuth.mockRejectedValueOnce(new Error('network'));
    renderInitializer();
    // Should not throw — children still render
    await waitFor(() => expect(mockCheckAuth).toHaveBeenCalled());
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  // --- Authenticated state ---

  it('fetches gamification data when authenticated', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'u1' };
    renderInitializer();
    await waitFor(() => expect(mockFetchGamificationData).toHaveBeenCalledTimes(1));
  });

  it('fetches customizations when authenticated', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'u1' };
    renderInitializer();
    await waitFor(() => expect(mockFetchCustomizations).toHaveBeenCalledTimes(1));
  });

  it('syncs theme with server when authenticated with userId', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'u1' };
    renderInitializer();
    await waitFor(() => expect(mockSyncWithServer).toHaveBeenCalledWith('u1'));
  });

  it('handles gamification fetch failure gracefully', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'u1' };
    mockFetchGamificationData.mockRejectedValueOnce(new Error('fail'));
    renderInitializer();
    await waitFor(() => expect(mockFetchGamificationData).toHaveBeenCalled());
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  it('handles theme sync failure gracefully', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'u1' };
    mockSyncWithServer.mockRejectedValueOnce(new Error('fail'));
    renderInitializer();
    await waitFor(() => expect(mockSyncWithServer).toHaveBeenCalled());
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  // --- Unauthenticated state ---

  it('does not fetch gamification data when unauthenticated', () => {
    renderInitializer();
    expect(mockFetchGamificationData).not.toHaveBeenCalled();
  });

  it('does not fetch customizations when unauthenticated', () => {
    renderInitializer();
    expect(mockFetchCustomizations).not.toHaveBeenCalled();
  });

  it('does not sync theme with server when unauthenticated', () => {
    renderInitializer();
    expect(mockSyncWithServer).not.toHaveBeenCalled();
  });

  // --- Theme initialization ---

  it('applies app theme from localStorage on mount', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('cyberpunk');
    renderInitializer();
    expect(mockApplyTheme).toHaveBeenCalledWith('cyberpunk');
  });

  it('applies default theme when no localStorage value', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    renderInitializer();
    expect(mockApplyTheme).toHaveBeenCalledWith('default');
  });

  it('sets CSS custom properties from THEME_COLORS for colorPreset', () => {
    renderInitializer();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--user-theme-primary')).toBe('#00ff88');
    expect(root.style.getPropertyValue('--user-theme-secondary')).toBe('#00ccff');
    expect(root.style.getPropertyValue('--user-theme-glow')).toBe('rgba(0,255,136,0.3)');
    expect(root.style.getPropertyValue('--user-theme-gradient')).toBe(
      'linear-gradient(135deg, #00ff88, #00ccff)'
    );
  });

  it('does not set CSS properties for unknown colorPreset', () => {
    themeState.theme.colorPreset = 'unknown-preset';
    const root = document.documentElement;
    // Clear any previous values
    root.style.removeProperty('--user-theme-primary');
    renderInitializer();
    // The code only sets properties when colors exist, so previous value should remain cleared
    expect(root.style.getPropertyValue('--user-theme-primary')).toBe('');
  });

  it('applies customization hook on mount', async () => {
    const { useCustomizationApplication } =
      await import('@/modules/settings/hooks/useCustomizationApplication');
    renderInitializer();
    expect(useCustomizationApplication).toHaveBeenCalled();
  });
});
