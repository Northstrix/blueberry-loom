"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Particles } from "@/components/ui/Particles/Particles";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobileText } from "@/hooks/useIsMobileText";

export interface LoginFormUIProps {
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
  onSubmit: (data: {
    mode: "signin" | "signup";
    email: string;
    password: string;
    confirmPassword?: string;
  }) => void;
  loading?: boolean;
  onBack?: () => void;
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
const getCardSize = (windowWidth: number) => {
  if (windowWidth < 360) return { cardWidth: 312, cardPadding: "2rem 1.6rem" };
  if (windowWidth < 394) return { cardWidth: 356, cardPadding: "2.2rem 2rem" };
  return { cardWidth: 374, cardPadding: "2.25rem 2.2rem" };
};

const LoginFormUI: React.FC<LoginFormUIProps> = ({
  mode,
  onModeChange,
  onSubmit,
  loading = false,
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isRTL, setIsRTL] = useState(false);
  const [displayMode, setDisplayMode] = useState<"signin" | "signup">(mode);
  const [showContent, setShowContent] = useState(true);
  const nextModeRef = useRef<"signin" | "signup">(mode);
  const isMobile = useIsMobileText();
  const [hovered, setHovered] = useState(false);
  const [cardSize, setCardSize] = useState(() =>
    typeof window !== "undefined"
      ? getCardSize(window.innerWidth)
      : { cardWidth: 374, cardPadding: "2.25rem 2.2rem" }
  );
  const formRef = useRef<HTMLFormElement>(null);

  const handleResize = useCallback(() => {
    const { cardWidth, cardPadding } = getCardSize(window.innerWidth);
    setCardSize((prev) => {
      if (
        prev.cardWidth !== cardWidth ||
        prev.cardPadding !== cardPadding
      ) {
        return { cardWidth, cardPadding };
      }
      return prev;
    });
  }, []);

  // Handle Enter key press for the current mode using native event
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        !loading &&
        document.activeElement &&
        formRef.current &&
        formRef.current.contains(document.activeElement)
      ) {
        e.preventDefault();
        formRef.current?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, displayMode]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    setIsRTL(i18n.language === "he");
  }, [i18n.language]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirm("");
  }, [displayMode]);

  // Keep displayMode in sync with mode prop
  useEffect(() => {
    setDisplayMode(mode);
    nextModeRef.current = mode;
  }, [mode]);

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

  // Handle the return link
  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (onBack) {
      onBack();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden w-full"
      style={{ background: "var(--background)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Return Overlay Bar */}
      {isRTL ? (
        // RTL version
        <div className="absolute top-0 left-0 z-50 flex items-center justify-start w-full"
          style={{
            height: isMobile ? 48 : 64,
            marginRight: isMobile ? 10 : 24,
            pointerEvents: "none",
          }}>
          <a
            href="/"
            tabIndex={0}
            aria-label={t("return")}
            className={`flex items-center h-full font-semibold ${
              isMobile ? "text-base" : "text-xl"
            } text-[var(--foreground)] no-underline transition-colors duration-300 cursor-pointer pointer-events-auto group`}
            style={{ width: "auto" }}
            onClick={handleHomeClick}
            dir="ltr"
          >
            <span
              className="items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
            >
              {t("return")}
            </span>
            <span
              className="items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
              style={{
                marginRight: isMobile ? 2.5 : 4,
                display: "flex-end",
                alignItems: "center",
              }}
            >
              <ChevronRight
                size={isMobile ? 20 : 24}
                stroke="currentColor"
                strokeWidth={isMobile ? 2 : 2.25}
                className="transition-colors duration-300"
              />
            </span>
          </a>
        </div>
      ) : (
        // LTR version
        <div className="absolute top-0 left-0 z-50 flex items-center"
          style={{
            height: isMobile ? 48 : 64,
            marginLeft: isMobile ? 10 : 24,
            marginRight: isMobile ? 10 : 24,
            pointerEvents: "none",
          }}>
          <a
            href="/"
            tabIndex={0}
            aria-label={t("return")}
            className={`flex items-center h-full font-semibold ${
              isMobile ? "text-base" : "text-xl"
            } text-[var(--foreground)] no-underline transition-colors duration-300 cursor-pointer pointer-events-auto group`}
            style={{ width: "auto" }}
            onClick={handleHomeClick}
          >
            <span
              className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
              style={{
                marginRight: isMobile ? 2.5 : 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft
                size={isMobile ? 20 : 24}
                stroke="currentColor"
                strokeWidth={isMobile ? 2 : 2.25}
                className="transition-colors duration-300"
              />
            </span>
            <span
              className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
            >
              {t("return")}
            </span>
          </a>
        </div>
      )}

      {/* Particles BG */}
      <div className="w-screen h-screen absolute">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#0a0a0a_50%)] z-10" />
        <Particles quantity={600} />
      </div>
      {/* Glass Card */}
      <div
        className="relative z-10 w-full flex flex-col items-center"
        style={{
          maxWidth: `${cardSize.cardWidth}px`,
          background: "var(--card-background)",
          border: hovered
            ? "1px solid var(--lightened-background-adjacent-color)"
            : "1px solid var(--background-adjacent-color)",
          borderRadius: "var(--outer-card-radius)",
          padding: cardSize.cardPadding,
          margin: "64px 10px",
          transition: "border-color 0.3s, background 0.3s, color 0.3s",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center mb-6 mx-auto"
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
          onClick={onBack}
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
                className="text-4xl font-bold mb-2 text-[var(--foreground)] text-center"
                style={{ letterSpacing: "-0.01em" }}
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
                  ? t("log_in_top")
                  : t("register")}
              </motion.h1>
              {/* Subtitle */}
              <motion.p
                key={`subtitle-${displayMode}`}
                className="mb-7 text-center"
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
                ref={formRef}
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
                  <span className="text-sm text-[var(--muted-foreground)]">
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
                  <span className="text-sm text-[var(--muted-foreground)]">
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
