/**
 * ProgressIndicator component
 * @module pages/settings/two-factor-setup
 */

interface ProgressIndicatorProps {
  stepIndex: number;
}

/**
 * unknown for the settings module.
 */
/**
 * Progress Indicator component.
 */
export function ProgressIndicator({ stepIndex }: ProgressIndicatorProps) {
  return (
    <div className="mb-8 flex justify-center gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= stepIndex ? 'w-8 bg-primary-500' : 'w-4 bg-white/[0.08]'
          }`}
        />
      ))}
    </div>
  );
}
