/**
 * Form submit button with loading state.
 * @module
 */
import { useFormStatus } from 'react-dom';
import { Button } from './button';

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * unknown for the ui module.
 */
/**
 * Submit Button component.
 */
export function SubmitButton({ children, pendingText, className, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} isLoading={pending} className={className}>
      {pending ? (pendingText ?? children) : children}
    </Button>
  );
}
