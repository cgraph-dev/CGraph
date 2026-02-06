/**
 * NavigationButtons component - back/next buttons
 */

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  isLoading,
  onBack,
  onNext,
  onSkip,
}: NavigationButtonsProps) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-400 transition-colors hover:text-white"
        >
          Back
        </button>
      ) : (
        <button
          type="button"
          onClick={onSkip}
          className="px-6 py-2 text-gray-500 transition-colors hover:text-gray-400"
        >
          Skip
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Saving...
          </>
        ) : currentStep === totalSteps ? (
          <>
            Get Started
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </>
        ) : (
          <>
            Continue
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
