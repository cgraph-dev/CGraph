/**
 * CreateForum - Multi-step wizard for creating a MyBB-style forum
 *
 * Features:
 * - Step 1: Basic Info (name, slug, description)
 * - Step 2: Appearance (icon, banner, colors)
 * - Step 3: Settings (privacy, posting rules)
 * - Step 4: Confirmation
 */

import {
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useCreateForum } from './useCreateForum';
import { StepIndicator } from './StepIndicator';
import { BasicInfoStep } from './BasicInfoStep';
import { AppearanceStep } from './AppearanceStep';
import { SettingsStep } from './SettingsStep';
import { ConfirmStep } from './ConfirmStep';

export default function CreateForum() {
  const {
    step,
    formData,
    isSubmitting,
    error,
    isAuthenticated,
    user,
    handleNameChange,
    updateFormData,
    handleSubmit,
    goToNextStep,
    goToPrevStep,
    isStep1Valid,
    navigate,
  } = useCreateForum();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
          <h2 className="mb-2 text-2xl font-bold text-white">Login Required</h2>
          <p className="mb-4 text-gray-400">You need to be logged in to create a forum.</p>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <SparklesIcon className="h-10 w-10 text-white" />
            <h1 className="text-3xl font-bold text-white">Create Your Forum</h1>
          </div>
          <p className="text-primary-100">
            Build your own MyBB-style community with boards, threads, and full customization.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <StepIndicator currentStep={step} />

      {/* Form Content */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/20 p-4">
            <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-500" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {step === 1 && (
          <BasicInfoStep
            formData={formData}
            onNameChange={handleNameChange}
            onUpdateField={updateFormData}
          />
        )}

        {step === 2 && <AppearanceStep formData={formData} onUpdateField={updateFormData} />}

        {step === 3 && <SettingsStep formData={formData} onUpdateField={updateFormData} />}

        {step === 4 && (
          <ConfirmStep
            formData={formData}
            subscriptionTier={(user as { subscription_tier?: string })?.subscription_tier || 'free'}
          />
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPrevStep}
            className="flex items-center gap-2 rounded-lg bg-dark-700 px-6 py-3 text-white transition-colors hover:bg-dark-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {step > 1 ? 'Previous' : 'Cancel'}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goToNextStep}
              disabled={step === 1 && !isStep1Valid()}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Create Forum
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
