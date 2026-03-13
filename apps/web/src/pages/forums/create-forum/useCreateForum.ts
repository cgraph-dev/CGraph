/**
 * useCreateForum hook - state and handlers for forum creation wizard
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import { forumLogger as logger } from '@/lib/logger';
import { DEFAULT_FORM_DATA, NAME_MIN_LENGTH, NAME_MAX_LENGTH } from './constants';
import type { ForumFormData } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing create forum.
 */
export function useCreateForum() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { createForum } = useForumStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ForumFormData>(DEFAULT_FORM_DATA);

  // Auto-generate slug from name
  const handleNameChange = useCallback((inputName: string) => {
    const sanitizedName = inputName.replace(/[^a-zA-Z0-9_]/g, '');
    const slug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    setFormData((prev) => ({ ...prev, name: sanitizedName, slug }));
  }, []);

  // Update form field
  const updateFormData = useCallback(
    <K extends keyof ForumFormData>(key: K, value: ForumFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Validate form data
  const validateForm = useCallback((): string | null => {
    if (!formData.name || formData.name.length < NAME_MIN_LENGTH) {
      return `Forum name must be at least ${NAME_MIN_LENGTH} characters long`;
    }
    if (formData.name.length > NAME_MAX_LENGTH) {
      return `Forum name must be at most ${NAME_MAX_LENGTH} characters long`;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
      return 'Forum name can only contain letters, numbers, and underscores';
    }
    if (!formData.slug) {
      return 'Forum URL slug is required';
    }
    return null;
  }, [formData.name, formData.slug]);

  // Check if step 1 is valid for navigation
  const isStep1Valid = useCallback(() => {
    return (
      formData.name &&
      formData.slug &&
      formData.name.length >= NAME_MIN_LENGTH &&
      formData.name.length <= NAME_MAX_LENGTH &&
      /^[a-zA-Z0-9_]+$/.test(formData.name)
    );
  }, [formData.name, formData.slug]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a forum');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.log('[CreateForum] Submitting:', {
        name: formData.name,
        description: formData.description,
        isNsfw: formData.isNsfw,
        isPrivate: !formData.isPublic,
      });

      const forum = await createForum({
        name: formData.name,
        description: formData.description,
        isNsfw: formData.isNsfw,
        isPrivate: !formData.isPublic,
      });

      logger.log('[CreateForum] Success:', forum);
      navigate(`/forums/${forum.slug}`);
    } catch (err: unknown) {
      logger.error('[CreateForum] Error:', err);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const errorObj = err as {
        response?: {
          data?: {
            error?:
              | string
              | {
                  message?: string;
                  details?: Record<string, string[]>;
                  code?: string;
                };
            message?: string;
          };
        };
        message?: string;
      };

      let message = 'Failed to create forum. Please try again.';
      const errorData = errorObj.response?.data?.error;

      if (typeof errorData === 'string') {
        message = errorData;
        if (errorObj.response?.data?.message) {
          message += `: ${errorObj.response.data.message}`;
        }
      } else if (errorData && typeof errorData === 'object') {
        if (errorData.message) {
          message = errorData.message;
        }
        if (errorData.details && typeof errorData.details === 'object') {
          const detailMessages = Object.entries(errorData.details)
            .map(([field, msgs]) => {
              const fieldName = field.replace(/_/g, ' ');
              const msgArray = Array.isArray(msgs) ? msgs : [String(msgs)];
              return `${fieldName}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          if (detailMessages) {
            message = detailMessages;
          }
        }
      } else if (errorObj.response?.data?.message) {
        message = errorObj.response.data.message;
      } else if (errorObj.message) {
        message = errorObj.message;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, validateForm, formData, createForum, navigate]);

  // Navigation
  const goToNextStep = useCallback(() => {
    if (step < 4) setStep((s) => s + 1);
  }, [step]);

  const goToPrevStep = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
    else navigate('/forums');
  }, [step, navigate]);

  return {
    // State
    step,
    formData,
    isSubmitting,
    error,
    isAuthenticated,
    user,
    // Handlers
    handleNameChange,
    updateFormData,
    setFormData,
    handleSubmit,
    goToNextStep,
    goToPrevStep,
    isStep1Valid,
    // Navigation
    navigate,
  };
}
