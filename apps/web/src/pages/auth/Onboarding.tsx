/**
 * Onboarding Page
 *
 * First-time user experience with progressive profile setup.
 * Features step-by-step wizard with animated transitions.
 *
 * Steps:
 * 1. Welcome & Avatar upload
 * 2. Profile customization
 * 3. Notification preferences
 * 4. Feature highlights tour
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';

// Re-export user type for profile updates
type ProfileUpdatePayload = {
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
};

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ProfileData {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  notifyMessages: boolean;
  notifyMentions: boolean;
  notifyFriendRequests: boolean;
  theme: 'dark' | 'light' | 'system';
}

// =============================================================================
// STEP DATA
// =============================================================================

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to CGraph',
    description: "Let's set up your profile to get you started",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Personalize Your Profile',
    description: 'Tell us a bit about yourself',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Stay Connected',
    description: 'Choose how you want to be notified',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "You're All Set!",
    description: 'Explore the features that make CGraph special',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const features = [
  { icon: '💬', title: 'Encrypted Messaging', description: 'End-to-end encrypted private conversations' },
  { icon: '👥', title: 'Groups & Channels', description: 'Create communities with Discord-style servers' },
  { icon: '📋', title: 'Forums', description: 'Reddit-style discussions with karma system' },
  { icon: '🏆', title: 'Achievements', description: 'Earn XP, unlock titles, and climb leaderboards' },
  { icon: '🎨', title: 'Customization', description: 'Personalize your profile and chat bubbles' },
  { icon: '📞', title: 'Voice & Video', description: 'Crystal-clear calls with screen sharing' },
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);

  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || user?.username || '',
    bio: '',
    avatarUrl: user?.avatarUrl || null,
    notifyMessages: true,
    notifyMentions: true,
    notifyFriendRequests: true,
    theme: 'dark',
  });

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - save everything and navigate
      setIsLoading(true);
      try {
        // Upload avatar if changed
        let avatarUrl = profileData.avatarUrl;
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          const response = await api.post('/api/v1/users/avatar', formData);
          avatarUrl = response.data.avatar_url;
        }

        // Update profile via API
        await api.patch('/api/v1/users/profile', {
          display_name: profileData.displayName,
          bio: profileData.bio,
          avatar_url: avatarUrl,
        } as ProfileUpdatePayload);
        // Update local user state
        updateUser({
          displayName: profileData.displayName,
          avatarUrl: avatarUrl,
        });

        // Update notification preferences
        await api.patch('/api/v1/users/settings/notifications', {
          messages: profileData.notifyMessages,
          mentions: profileData.notifyMentions,
          friend_requests: profileData.notifyFriendRequests,
        });

        // Mark onboarding complete
        await api.post('/api/v1/users/onboarding/complete');

        navigate('/messages');
      } catch (error) {
        console.error('Onboarding error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentStep, profileData, avatarFile, updateUser, navigate]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Avatar Upload */}
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <label className="relative cursor-pointer group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-500/30 
                              group-hover:border-primary-500 transition-all duration-300
                              shadow-glow-sm group-hover:shadow-glow-md">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-600 
                                  flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {profileData.displayName.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full 
                              flex items-center justify-center shadow-lg
                              group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="mt-4 text-gray-400 text-sm">Click to upload your avatar</p>
            </motion.div>

            {/* Display Name */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profileData.displayName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="How should we call you?"
                className="w-full px-4 py-3 bg-dark-800/50 border border-dark-600 rounded-lg
                         text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1
                         focus:ring-primary-500 transition-all duration-200"
              />
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Bio */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 bg-dark-800/50 border border-dark-600 rounded-lg
                         text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1
                         focus:ring-primary-500 transition-all duration-200 resize-none"
              />
              <p className="mt-1 text-xs text-gray-500 text-right">
                {profileData.bio.length}/200
              </p>
            </motion.div>

            {/* Theme Selection */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Theme Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['dark', 'light', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setProfileData((prev) => ({ ...prev, theme }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      profileData.theme === theme
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 bg-dark-800/30 hover:border-dark-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {theme === 'dark' && (
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      {theme === 'light' && (
                        <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {theme === 'system' && (
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-gray-300 capitalize">{theme}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {[
              { key: 'notifyMessages' as const, label: 'Direct Messages', desc: 'New messages from friends' },
              { key: 'notifyMentions' as const, label: 'Mentions', desc: 'When someone @mentions you' },
              { key: 'notifyFriendRequests' as const, label: 'Friend Requests', desc: 'New friend requests' },
            ].map(({ key, label, desc }) => (
              <motion.div
                key={key}
                variants={itemVariants}
                className="flex items-center justify-between p-4 bg-dark-800/30 rounded-xl
                         border border-dark-600 hover:border-dark-500 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-white">{label}</h4>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProfileData((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    profileData[key]
                      ? 'bg-primary-500'
                      : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
                              transition-transform duration-200 ${
                                profileData[key]
                                  ? 'translate-x-6'
                                  : 'translate-x-0'
                              }`}
                  />
                </button>
              </motion.div>
            ))}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.p variants={itemVariants} className="text-center text-gray-300 mb-8">
              Here&apos;s what you can do with CGraph:
            </motion.p>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  custom={index}
                  className="p-4 bg-dark-800/30 rounded-xl border border-dark-600
                           hover:border-primary-500/50 hover:bg-dark-800/50
                           transition-all duration-200 group"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <h4 className="mt-2 font-medium text-white group-hover:text-primary-400 
                               transition-colors">
                    {feature.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 
                  flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full 
                      bg-gradient-radial from-primary-500/10 to-transparent rounded-full" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full 
                      bg-gradient-radial from-purple-500/10 to-transparent rounded-full" />
      </div>

      <GlassCard
        variant="frosted"
        className="w-full max-w-lg relative z-10"
        hover3D={false}
      >
        <div className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-10 h-10 rounded-full 
                            transition-all duration-300 ${
                              step.id === currentStep
                                ? 'bg-primary-500 text-white shadow-glow-sm'
                                : step.id < currentStep
                                ? 'bg-primary-500/30 text-primary-400'
                                : 'bg-dark-700 text-gray-500'
                            }`}
                >
                  {step.id < currentStep ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Header */}
          <div className="text-center mb-8">
            <motion.div
              key={`icon-${currentStep}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                       bg-gradient-to-br from-primary-500 to-purple-600 text-white mb-4"
            >
              {steps[currentStep - 1]?.icon}
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`header-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-2xl font-bold text-white">
                  {steps[currentStep - 1]?.title}
                </h2>
                <p className="mt-2 text-gray-400">
                  {steps[currentStep - 1]?.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentStep}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="min-h-[300px]"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                Skip
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-purple-600 
                       text-white font-medium rounded-xl shadow-lg shadow-primary-500/25
                       hover:shadow-primary-500/40 hover:scale-[1.02]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : currentStep === 4 ? (
                <>
                  Get Started
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                <>
                  Continue
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
