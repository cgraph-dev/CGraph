/**
 * Onboarding Page - main component
 *
 * First-time user experience with progressive profile setup.
 * Features step-by-step wizard with animated transitions.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { useOnboarding } from './useOnboarding';
import { ProgressBar } from './progress-bar';
import { StepHeader } from './step-header';
import { WelcomeStep } from './welcome-step';
import { ProfileStep } from './profile-step';
import { NotificationsStep } from './notifications-step';
import { FeaturesStep } from './features-step';
import { NavigationButtons } from './navigation-buttons';
import { pageVariants } from './animations';
import type { NotificationKey } from './types';
import { tweens } from '@/lib/animation-presets';

/**
 * Onboarding component.
 */
export default function Onboarding() {
  const {
    currentStep,
    isLoading,
    avatarPreview,
    profileData,
    handleAvatarChange,
    handleNext,
    handleBack,
    handleSkip,
    updateProfileData,
    setProfileData,
    totalSteps,
  } = useOnboarding();

  const handleNotificationToggle = (key: NotificationKey) => {
    setProfileData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            avatarPreview={avatarPreview}
            displayName={profileData.displayName}
            onAvatarChange={handleAvatarChange}
            onDisplayNameChange={(name) => updateProfileData('displayName', name)}
          />
        );
      case 2:
        return (
          <ProfileStep
            bio={profileData.bio}
            theme={profileData.theme}
            onBioChange={(bio) => updateProfileData('bio', bio)}
            onThemeChange={(theme) => updateProfileData('theme', theme)}
          />
        );
      case 3:
        return <NotificationsStep profileData={profileData} onToggle={handleNotificationToggle} />;
      case 4:
        return <FeaturesStep />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial absolute -right-1/2 -top-1/2 h-full w-full rounded-full from-primary-500/10 to-transparent" />
        <div className="bg-gradient-radial absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full from-purple-500/10 to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-lg" hover3D={false}>
        <div className="p-8">
          <ProgressBar currentStep={currentStep} />
          <StepHeader currentStep={currentStep} />

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentStep}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tweens.standard}
              className="min-h-[300px]"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={totalSteps}
            isLoading={isLoading}
            onBack={handleBack}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        </div>
      </GlassCard>
    </div>
  );
}
