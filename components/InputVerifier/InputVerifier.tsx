'use client';

import { useTranslation } from 'react-i18next';

interface InputVerifierResult {
  success: boolean;
  message: string;
}

const useInputVerifier = () => {
  const { t } = useTranslation();

  return (mode: 'signin' | 'signup', email: string, password: string, confirmPassword?: string): InputVerifierResult => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { success: false, message: t('email-cant-be-empty-error') };
    }
    if (!emailRegex.test(email)) {
      return { success: false, message: t('invalid-email-error') };
    }

    // Password validation
    if (!password) {
      return { success: false, message: t('password-cant-be-empty-error') };
    }
    if (password.length < 12) {
      return { success: false, message: t('password-too-short-error') };
    }

    // Confirm password validation (for signup)
    if (mode === 'signup' && password !== confirmPassword) {
      return { success: false, message: t('passwords-dont-match-error') };
    }

    return { success: true, message: 'success' };
  };
};

export default useInputVerifier;
