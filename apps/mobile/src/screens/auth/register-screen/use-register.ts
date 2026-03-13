import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/stores';

/** Description. */
/** Hook for register. */
export function useRegister() {
  const { register } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      const missing: string[] = [];
      if (!hasLowercase) missing.push('lowercase letter');
      if (!hasUppercase) missing.push('uppercase letter');
      if (!hasNumber) missing.push('number');
      if (!hasSpecial) missing.push('special character (!@#$%^&*)');
      Alert.alert('Password Requirements', `Password must contain: ${missing.join(', ')}`);
      return;
    }

    if (username.trim() && username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, username.trim() || null, password);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const err = error as {
        response?: {
          data?: {
            error?: string | { message?: string };
            message?: string;
            details?: Record<string, string[]>;
          };
        };
        message?: string;
      };

      let errorMessage = 'Could not create account';

      if (err.response?.data) {
        const { data } = err.response;
        if (data.details && typeof data.details === 'object') {
          const errorMessages: string[] = [];
          for (const [field, messages] of Object.entries(data.details)) {
            if (Array.isArray(messages) && messages.length > 0) {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
              errorMessages.push(`${fieldName}: ${messages[0]}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        } else if (typeof data.error === 'object' && data.error?.message) {
          errorMessage = data.error.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }

      if (__DEV__) {
        console.warn(
          'Registration error:',
          JSON.stringify(err.response?.data || err.message, null, 2)
        );
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    username,
    setUsername: (text: string) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, '')),
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    agreedToTerms,
    setAgreedToTerms,
    isLoading,
    focusedField,
    setFocusedField,
    handleRegister,
  };
}
