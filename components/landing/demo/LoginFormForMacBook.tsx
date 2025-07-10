"use client"
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import { AnimatePresence, motion } from "framer-motion";

export interface LoginFormUIProps {
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
  onSubmit: (data: { mode: "signin" | "signup"; email: string; password: string; confirmPassword?: string; }) => void;
  loading?: boolean;
}

const ANIMATION_DURATION = 0.3; // seconds
const formVariants = {
  initial: { opacity: 1, filter: "blur(0px)", height: "auto" },
  blurOut: {
    opacity: 0,
    filter: "blur(12px)",
    height: 0,
    transition: { duration: ANIMATION_DURATION, ease: "easeInOut" },
  },
  blurIn: {
    opacity: 1,
    filter: "blur(0px)",
    height: "auto",
    transition: { duration: ANIMATION_DURATION, ease: "easeInOut" },
  },
};

const LoginFormUI: React.FC<LoginFormUIProps> = ({
  mode,
  onModeChange,
  onSubmit,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isRTL, setIsRTL] = useState(false);
  const [displayMode, setDisplayMode] = useState<"signin" | "signup">(mode);
  const [showContent, setShowContent] = useState(true);
  const nextModeRef = useRef<"signin" | "signup">(mode);
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Card size and padding state

  useEffect(() => {
    setIsRTL(i18n.language === "he");
  }, [i18n.language]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirm("");
  }, [displayMode]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      onSubmit({
        mode: displayMode,
        email,
        password,
        ...(displayMode === "signup" ? { confirmPassword: confirm } : {}),
      });
    },
    [loading, onSubmit, displayMode, email, password, confirm]
  );

  const handleModeSwitch = useCallback(
    (targetMode: "signin" | "signup") => {
      if (loading || targetMode === displayMode) return;
      setShowContent(false);
      nextModeRef.current = targetMode;
    },
    [loading, displayMode]
  );

  const handleExited = useCallback(() => {
    setDisplayMode(nextModeRef.current);
    setShowContent(true);
    if (nextModeRef.current !== mode) {
      onModeChange(nextModeRef.current);
    }
  }, [mode, onModeChange]);

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      style={{ background: "transparent" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Glass Card */}
        <div
        className="relative z-10 w-full rounded-2xl flex flex-col items-center justify-center"
        style={{
            maxWidth: "400px",
            background: "var(--card-background)",
            border:
            isHovered
                ? "1px solid var(--lightened-background-adjacent-color)"
                : "1px solid var(--background-adjacent-color)",
            padding: "1.6rem 1.6rem",
            transition: "border-color 0.3s, background 0.3s, color 0.3s",
            borderRadius: "var(--general-rounding)",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        >
        {/* Logo */}
        <div
          className="flex items-center justify-center mb-4 mx-auto"
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "var(--general-rounding)",
            background: "var(--foreground)",
            cursor: "pointer",
            overflow: "hidden",
            border: "1px solid var(--background-adjacent-color)",
            transition: "border-color 0.3s, background 0.3s",
            flexShrink: 0,
            padding: "3px",
            boxSizing: "border-box",
          }}
          onClick={() => router.push("/")}
          tabIndex={0}
        >
          <img
            src="/icon.webp"
            alt="Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
            }}
            draggable={false}
          />
        </div>
        {/* AnimatePresence for ALL text and form */}
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={handleExited}
        >
          {showContent && (
            <React.Fragment key={displayMode}>
              {/* Title */}
              <motion.h1
                key={`title-${displayMode}`}
                className="font-bold mb-1.5 text-[var(--foreground)] text-center"
                initial="blurOut"
                animate="blurIn"
                exit="blurOut"
                variants={formVariants}
                transition={{
                  duration: ANIMATION_DURATION,
                  ease: "easeInOut",
                }}
                style={{
                  letterSpacing: "-0.01em",
                  fontSize: "2rem",
                  lineHeight: 1,
                }}
              >
                {displayMode === "signin" ? t("log_in_top") : t("register")}
              </motion.h1>
              {/* Subtitle */}
              <motion.p
                key={`subtitle-${displayMode}`}
                className="mb-5 text-center"
                style={{
                  fontSize: "16px",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.5,
                }}
                initial="blurOut"
                animate="blurIn"
                exit="blurOut"
                variants={formVariants}
                transition={{
                  duration: ANIMATION_DURATION,
                  ease: "easeInOut",
                }}
              >
                {displayMode === "signin"
                  ? t("sign_in_to_your_account")
                  : t("create_an_account")}
              </motion.p>
              {/* Form */}
              <motion.form
                key={`form-${displayMode}`}
                className="flex flex-col w-full"
                onSubmit={handleSubmit}
                autoComplete="on"
                initial="blurOut"
                animate="blurIn"
                exit="blurOut"
                variants={formVariants}
                style={{ minHeight: "0" }}
                transition={{
                  duration: ANIMATION_DURATION,
                  ease: "easeInOut",
                }}
              >
                <FloatingLabelInput
                  label={t("email")}
                  value={email}
                  onValueChange={setEmail}
                  autoComplete="email"
                  disabled={loading}
                  type="email"
                  isRTL={isRTL}
                />
                <FloatingLabelInput
                  label={t("password")}
                  value={password}
                  onValueChange={setPassword}
                  autoComplete={
                    displayMode === "signin"
                      ? "current-password"
                      : "new-password"
                  }
                  disabled={loading}
                  type="password"
                  isRTL={isRTL}
                />
                {displayMode === "signup" && (
                  <FloatingLabelInput
                    label={t("confirm_password")}
                    value={confirm}
                    onValueChange={setConfirm}
                    autoComplete="new-password"
                    disabled={loading}
                    type="password"
                    isRTL={isRTL}
                  />
                )}
                <ChronicleButton
                  text={
                    displayMode === "signin"
                      ? t("login_button_label")
                      : t("register_button_label")
                  }
                  onClick={handleSubmit}
                  width="100%"
                  customBackground="var(--foreground)"
                  customForeground="var(--background)"
                  hoverColor="var(--theme-color)"
                  hoverForeground="var(--foreground)"
                  borderRadius="var(--general-rounding)"
                  disabled={loading}
                />
              </motion.form>
              {/* Switch link */}
              <motion.div
                key={`switch-${displayMode}`}
                className="w-full text-center mt-5"
                initial="blurOut"
                animate="blurIn"
                exit="blurOut"
                variants={formVariants}
                transition={{
                  duration: ANIMATION_DURATION,
                  ease: "easeInOut",
                }}
              >
                {displayMode === "signin" ? (
                  <span 
                    style={{
                    fontSize: "15px",
                    color: "var(--muted-foreground)",
                    lineHeight: 1.5,
                    }}
                    className="text-sm text-[var(--muted-foreground)]">
                    {t("no_account")}{" "}
                    <span
                      className="underline cursor-pointer text-[var(--foreground)] hover:text-[var(--theme-color)] ml-1"
                      style={{ transition: "color 0.3s" }}
                      tabIndex={0}
                      onClick={() => handleModeSwitch("signup")}
                    >
                      {t("create_one")}
                    </span>
                  </span>
                ) : (
                  <span 
                    style={{
                    fontSize: "15px",
                    color: "var(--muted-foreground)",
                    lineHeight: 1.5,
                    }}
                    className="text-sm text-[var(--muted-foreground)]">
                    {t("already_have_account")}{" "}
                    <span
                      className="underline cursor-pointer text-[var(--foreground)] hover:text-[var(--theme-color)] ml-1"
                      style={{ transition: "color 0.3s" }}
                      tabIndex={0}
                      onClick={() => handleModeSwitch("signin")}
                    >
                      {t("log_in_bottom")}
                    </span>
                  </span>
                )}
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginFormUI;
