import { useCallback } from 'react';

export default function ValidatePassword(mountToast) {
  const isPasswordValid = useCallback((password) => {
    if (!password || !password.trim()) {
      mountToast('Password is required.', 'error');
      return false;
    }

    const errors = [];

    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('a lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('a number');
    }
    if (!/[\W_]/.test(password)) {
      errors.push('a special character');
    }

    if (errors.length > 0) {
      mountToast(
        `Password must contain ${errors.join(', ')}.`,
        'error'
      );
      return false;
    }

    return true;
  }, [mountToast]);

  return { isPasswordValid };
}
