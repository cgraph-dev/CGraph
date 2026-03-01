/**
 * unknown.
 * useOnboarding hook - state and logic for onboarding flow
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { DEFAULT_PROFILE_DATA, ONBOARDING_STEPS } from './constants';
import type { ProfileData, ProfileUpdatePayload } from './types';

const logger = createLogger('Onboarding');

/**
 * Hook for managing onboarding.
 */
export function useOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);

  const [profileData, setProfileData] = useState<ProfileData>({
    ...DEFAULT_PROFILE_DATA,
    displayName: user?.displayName || user?.username || '',
    avatarUrl: user?.avatarUrl || null,
  });

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
         
        setAvatarPreview(reader.result as string); // type assertion: FileReader result is always string when readAsDataURL
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep < ONBOARDING_STEPS.length) {
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
          const response = await api.post('/api/v1/me/avatar', formData);
          avatarUrl = response.data.avatar_url;
        }

        // Update profile via API
         
        await api.put('/api/v1/me', {
          display_name: profileData.displayName,
          bio: profileData.bio,
          avatar_url: avatarUrl,
        } as ProfileUpdatePayload); // safe downcast – structural boundary

        // Update local user state
        updateUser({
          displayName: profileData.displayName,
          avatarUrl: avatarUrl,
        });

        // Update notification preferences
        await api.put('/api/v1/settings/notifications', {
          messages: profileData.notifyMessages,
          mentions: profileData.notifyMentions,
          friend_requests: profileData.notifyFriendRequests,
        });

        // Mark onboarding complete
        await api.post('/api/v1/me/onboarding/complete');

        navigate('/messages');
      } catch (error) {
        logger.error('Onboarding error:', error);
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

  const updateProfileData = useCallback(
    <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
      setProfileData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return {
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
    totalSteps: ONBOARDING_STEPS.length,
  };
}
