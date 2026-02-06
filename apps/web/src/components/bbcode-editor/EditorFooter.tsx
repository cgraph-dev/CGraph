/**
 * Editor Footer
 *
 * Footer with character count and validation warnings.
 */

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface EditorFooterProps {
  showCharCount: boolean;
  charCount: number;
  maxLength?: number;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export function EditorFooter({
  showCharCount,
  charCount,
  maxLength,
  validation,
}: EditorFooterProps) {
  if (!showCharCount && validation.valid) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-dark-500 bg-dark-700/50 px-4 py-2 text-xs">
      {/* Validation errors */}
      {!validation.valid && (
        <div className="flex items-center gap-2 text-yellow-400">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>{validation.errors[0]}</span>
        </div>
      )}

      {/* Character count */}
      {showCharCount && (
        <div
          className={cn(
            'ml-auto',
            maxLength && charCount > maxLength ? 'text-red-400' : 'text-gray-500'
          )}
        >
          {charCount}
          {maxLength && ` / ${maxLength}`}
        </div>
      )}
    </div>
  );
}
