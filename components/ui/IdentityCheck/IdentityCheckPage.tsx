"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Particles } from "@/components/ui/Particles/Particles";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import {
  showProcessingModal,
  showClosableErrorModal,
  showCryptographicIdentityInfoModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";
import { getPublicMlKem1024Fingerprint } from "@/lib/getPublicMlKem1024Fingerprint";
import { useIsRtl } from "@/hooks/useIsRtl";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

interface IdentityCheckPageProps {
  onBack?: () => void;
}

const getCardSize = (windowWidth: number) => {
  if (windowWidth < 360) return { cardWidth: 312, cardPadding: "2rem 1.6rem" };
  if (windowWidth < 394) return { cardWidth: 356, cardPadding: "2.2rem 2rem" };
  return { cardWidth: 374, cardPadding: "2.25rem 2.2rem" };
};

const IdentityCheckPage: React.FC<IdentityCheckPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const isRTL = useIsRtl();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobileText();

  // Responsive width
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  const cardSize = getCardSize(windowWidth);

  const handleGetFingerprint = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    const processingMessage = `<p dir="${isRTL ? "rtl" : "ltr"}">${t(
      "please_wait"
    )}</p>`;
    showProcessingModal(t("getting_mlkem_key"), processingMessage);
    try {
      const [fingerprint, err] = await getPublicMlKem1024Fingerprint(email);
      Swal.close();
      if (err) {
        showClosableErrorModal(t, err.message);
      } else if (fingerprint) {
        const identityInfoMessage = `
          <p style="margin-bottom: 10px;" dir="${isRTL ? "rtl" : "ltr"}">
            ${t("identity_check_title")}
          </p>
          <p style="margin-bottom: 12px;" dir="${isRTL ? "rtl" : "ltr"}">
            ${email}
          </p>
        `;
        showCryptographicIdentityInfoModal(
          t,
          isRTL,
          t("cryptographic_identity_info_title"),
          identityInfoMessage,
          fingerprint
        );
      }
    } catch (err) {
      Swal.close();
      showClosableErrorModal(t, String(err));
    } finally {
      setLoading(false);
    }
  }, [email, t, isRTL]);

  // Return link click handler
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onBack) onBack();
  };

  const overlayBarHeight = isMobile ? 48 : 64;

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
            height: overlayBarHeight,
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
            height: overlayBarHeight,
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

      {/* Spacer for overlay */}
      <div style={{ height: overlayBarHeight }} />

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
          borderRadius: "var(--outer-card-radius)",
          border: "1px solid var(--background-adjacent-color)",
          padding: cardSize.cardPadding,
          margin: "64px 10px",
          transition: "border-color 0.3s, background 0.3s, color 0.3s",
        }}
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

        {/* Title */}
        <motion.h1
          className="text-4xl font-bold mb-2 text-[var(--foreground)] text-center"
          style={{ letterSpacing: "-0.01em" }}
        >
          {t("identity_check_form_title")}
        </motion.h1>

        {/* Subtitle (centered) */}
        <motion.p
          className="mb-7 text-center"
          style={{
            fontSize: "16px",
            color: "var(--muted-foreground)",
            lineHeight: 1.5,
            width: "100%",
            direction: isRTL ? "rtl" : "ltr",
          }}
        >
          {t("identity_check_form_subtitle")}
        </motion.p>

        {/* Form */}
        <motion.form
          className="flex flex-col w-full"
          onSubmit={e => {
            e.preventDefault();
            handleGetFingerprint();
          }}
          autoComplete="on"
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
          <ChronicleButton
            text={t("get_fingerprint_button")}
            onClick={handleGetFingerprint}
            width="100%"
            customBackground="var(--foreground)"
            customForeground="var(--background)"
            hoverColor="var(--theme-color)"
            hoverForeground="var(--foreground)"
            borderRadius="var(--general-rounding)"
            disabled={loading}
          />
        </motion.form>
      </div>
    </div>
  );
};

export default IdentityCheckPage;
