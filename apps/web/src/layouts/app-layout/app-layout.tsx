/**
 * AppLayout Component - Main application shell with sidebar and content area
 * @module layouts/app-layout
 */
import { ToastContainer } from '@/shared/components/ui';
import ShaderBackground from '@/components/shaders/shader-background';
import { pageTransitions, buttonVariantsSubtle } from '@/lib/animations/transitions';
import { useAppLayout } from './hooks';
import { navItems } from './constants';
import Sidebar from './sidebar';
import { AnimatedOutlet } from './animated-outlet';

// Reserved for future animation enhancements
void pageTransitions;
void buttonVariantsSubtle;

export default function AppLayout() {
  const {
    location,
    user,
    theme,
    backgroundSettings,
    shaderColors,
    handleLogout,
    totalUnread,
    unreadCount,
  } = useAppLayout();

  return (
    <div
      className="relative flex h-screen text-white"
      style={{ background: theme.colors.background }}
    >
      {/* Dynamic Background Effect */}
      {backgroundSettings.effect === 'shader' && (
        <ShaderBackground
          variant={backgroundSettings.variant}
          color1={shaderColors.color1}
          color2={shaderColors.color2}
          color3={shaderColors.color3}
          speed={0.6}
          intensity={backgroundSettings.intensity}
          interactive={false}
          className="fixed inset-0 -z-10"
        />
      )}

      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        user={user}
        location={location}
        handleLogout={handleLogout}
        totalUnread={totalUnread}
        unreadCount={unreadCount}
        navItems={navItems}
      />

      {/* Main Content */}
      <main
        id="main-content"
        className="z-10 flex flex-1 overflow-hidden"
        role="main"
        style={{
          background:
            backgroundSettings.effect !== 'none'
              ? `${theme.colors.background}dd` // Semi-transparent overlay
              : undefined,
        }}
      >
        <AnimatedOutlet />
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
