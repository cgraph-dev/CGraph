import { useFormStatus } from 'react-dom';
import { Button } from './Button';

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
}

export function SubmitButton({ children, pendingText, className, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      isLoading={pending}
      className={className}
    >
      {pending ? (pendingText ?? children) : children}
    </Button>
  );
}
