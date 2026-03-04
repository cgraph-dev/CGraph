/**
 * StepIndicator component - shows wizard progress
 */

import { WIZARD_STEPS } from './constants';

interface StepIndicatorProps {
  currentStep: number;
}

/**
 * unknown for the forums module.
 */
/**
 * Step Indicator component.
 */
export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="border-b border-white/[0.06] bg-white/[0.04]">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                  currentStep === s.num
                    ? 'bg-primary-600 text-white'
                    : currentStep > s.num
                      ? 'bg-green-600 text-white'
                      : 'bg-white/[0.06] text-gray-400'
                }`}
              >
                <s.icon className="h-5 w-5" />
                <span className="hidden font-medium sm:inline">{s.label}</span>
              </div>
              {i < 3 && (
                <div
                  className={`mx-2 h-0.5 w-8 ${
                    currentStep > s.num ? 'bg-green-600' : 'bg-white/[0.08]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
