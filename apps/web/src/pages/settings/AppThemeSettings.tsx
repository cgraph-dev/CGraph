import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Download, Upload, Sparkles } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useAuthStore } from '@/stores/authStore';
import VisibilityBadge from '@/components/settings/VisibilityBadge';

/**
 * App Theme Settings Page
 *
 * Allows users to:
 * 1. Select app-wide theme (Matrix, Default, etc.)
 * 2. Preview themes before applying
 * 3. Access premium themes with subscription
 */
export default function AppThemeSettings() {
  const user = useAuthStore((state) => state.user);
  const [currentThemeId, setCurrentThemeId] = useState<string>('default');

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('cgraph-app-theme') || 'default';
    setCurrentThemeId(savedTheme);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setCurrentThemeId(themeId);
    localStorage.setItem('cgraph-app-theme', themeId);

    // Trigger theme application
    window.location.reload(); // Simple refresh to apply theme
  };

  const userIsPremium =
    user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'business';

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Palette className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">App Theme</h1>
          <VisibilityBadge visible="local" />
        </div>
        <p className="text-gray-400">
          Transform your entire CGraph experience with app-wide themes
        </p>
      </div>

      {/* Premium Banner (if not premium) */}
      {!userIsPremium && (
        <motion.div
          className="mb-6 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 text-purple-500" />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-white">Unlock Premium Themes</h3>
              <p className="mb-3 text-sm text-gray-300">
                Get access to exclusive themes like Matrix, Cyberpunk, and more with a premium
                subscription
              </p>
              <button className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600">
                Upgrade to Premium
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-2 font-semibold">🎨 Complete UI Transformation</h3>
          <p className="text-sm text-gray-400">
            App themes change the entire look and feel of CGraph
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-2 font-semibold">✨ Your Customizations Preserved</h3>
          <p className="text-sm text-gray-400">
            Avatar borders and chat bubbles work with any theme
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-2 font-semibold">🔒 Premium Exclusives</h3>
          <p className="text-sm text-gray-400">
            Matrix and special themes require premium subscription
          </p>
        </div>
      </div>

      {/* Theme Switcher */}
      <ThemeSwitcher
        currentThemeId={currentThemeId}
        onThemeChange={handleThemeChange}
        userIsPremium={userIsPremium}
      />

      {/* Additional Info */}
      <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800/30 p-6">
        <h3 className="mb-4 font-semibold">About App Themes</h3>

        <div className="space-y-4 text-sm text-gray-400">
          <div>
            <strong className="text-gray-300">What are app themes?</strong>
            <p>
              App themes transform the entire CGraph interface - colors, fonts, animations, and
              effects. They're different from your personal customizations (avatar borders, chat
              bubbles) which remain visible to others regardless of what theme you're using.
            </p>
          </div>

          <div>
            <strong className="text-gray-300">How do themes work with customizations?</strong>
            <p>
              Your personal customizations (from Theme Customization page) are your digital identity
              - they follow you everywhere and are visible to others. App themes only change how YOU
              see the interface.
            </p>
          </div>

          <div>
            <strong className="text-gray-300">Can I create custom themes?</strong>
            <p>
              Custom theme creation is coming soon! Premium users will be able to create and share
              their own complete app themes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
