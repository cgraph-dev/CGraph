/**
 * SaveButton sub-component for effects customization.
 * Displays a gradient save button with a spinner while saving.
 *
 * @module pages/customize/effects-customization
 */

interface SaveButtonProps {
  isSaving: boolean;
  onClick: () => void;
}

/**
 * unknown for the customize module.
 */
/**
 * Save Button component.
 */
export function SaveButton({ isSaving, onClick }: SaveButtonProps) {
  return (
    <div className="flex justify-end border-t border-white/10 pt-4">
      <button
        onClick={onClick}
        disabled={isSaving}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </>
        ) : (
          'Save Effects Settings'
        )}
      </button>
    </div>
  );
}
