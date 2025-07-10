"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import useInputVerifier from "@/components/InputVerifier/InputVerifier";
import useSignInSignUpCryptography from "@/components/SignInSignUpCryptography/SignInSignUpCryptography";
import useStore from "@/store/store";
import LoginFormUI from "./LoginFormUI";
import { useRouter } from "next/navigation";

interface LoginFormContainerProps {
  initialMode?: "signin" | "signup";
  onBack?: () => void;
}

const LoginFormContainer: React.FC<LoginFormContainerProps> = ({
  initialMode = "signin",
  onBack,
}) => {
  const verifyInputs = useInputVerifier();
  const signInSignUpCryptography = useSignInSignUpCryptography();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);

  // Keep mode in sync with initialMode prop
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Store selectors
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const masterKey = useStore((state) => state.masterKey);
  const iterations = useStore((state) => state.iterations);
  
  const router = useRouter();

  // Redirect to dashboard on successful sign-in
  useEffect(() => {
    if (
      isLoggedIn &&
      masterKey instanceof Uint8Array &&
      masterKey.length === 272 &&
      iterations > 0 &&
      mode === "signin"
    ) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, masterKey, iterations, mode, router]);

  const handleModeChange = useCallback(
    (newMode: "signin" | "signup") => {
      setMode(newMode);
    },
    []
  );

  const handleSubmit = async (data: {
    mode: "signin" | "signup";
    email: string;
    password: string;
    confirmPassword?: string;
  }) => {
    setLoading(true);
    const validationResult = verifyInputs(
      data.mode,
      data.email,
      data.password,
      data.confirmPassword
    );
    if (!validationResult.success) {
      toast.error(validationResult.message);
      setLoading(false);
      return;
    }
    await signInSignUpCryptography(data.mode, data.email, data.password);
    setLoading(false);
  };

  return (
    <LoginFormUI
      mode={mode}
      onModeChange={handleModeChange}
      onSubmit={handleSubmit}
      loading={loading}
      onBack={onBack}
    />
  );
};

export default LoginFormContainer;
