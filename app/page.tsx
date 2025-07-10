"use client";
import React, { useEffect, useState, useCallback } from "react";
import LandingPageWrapper from "@/components/landing/LandingPageWrapper";
import LoginFormContainer from "@/components/ui/LoginForm/LoginFormContainer";
import IdentityCheckPage from "@/components/ui/IdentityCheck/IdentityCheckPage";
import PingPongLoader from "@/components/ui/PingPongLoader/PingPongLoader";
import RespondentFormRenderer from "@/components/ui/RespondentFormRenderer/RespondentFormRenderer";
import { useTranslation } from "react-i18next";
import { showClosableErrorModal } from "@/components/ui/Swal2Modals/Swal2Modals";

export default function Page() {
  const { t, i18n } = useTranslation();
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const [view, setView] = useState<
    "landing" | "login" | "identity" | "respondent-form-loading" | "respondent-form"
  >("landing");
  const [loginMode, setLoginMode] = useState<"signin" | "signup">("signin");
  const [respondentFormValues, setRespondentFormValues] = useState<{
    publisherEmail: string;
    formID: string;
    decryptionKey: string;
  } | null>(null);

  const isRtl = i18n.dir() === "rtl";

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleShowLogin = useCallback((mode: "signin" | "signup" = "signin") => {
    setLoginMode(mode);
    setView("login");
  }, []);

  const handleShowIdentityCheck = useCallback(() => {
    setView("identity");
  }, []);

  const handleBackToLanding = useCallback(() => {
    setView("landing");
    setRespondentFormValues(null);
  }, []);

  const handleRespondentFormResolved = useCallback(
    (values: { publisherEmail: string; formID: string; decryptionKey: string }) => {
      setRespondentFormValues(values);
      setView("respondent-form-loading");
    },
    []
  );

  useEffect(() => {
    if (view === "respondent-form-loading" && respondentFormValues) {
      const timeout = setTimeout(() => setView("respondent-form"), 500);
      return () => clearTimeout(timeout);
    }
  }, [view, respondentFormValues]);

  // Handler for error in RespondentFormRenderer
  const handleFormLoadError = useCallback(
    async (error?: unknown) => {
      let errorMessage = "";
      if (typeof error === "string" && error.trim()) {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
        errorMessage = (error as any).message;
      }
      if (errorMessage) {
        await showClosableErrorModal(
          t,
          `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${errorMessage}</p>`
        );
      } else {
        await showClosableErrorModal(
          t,
          `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("something_went_wrong_line1")}</p>
           <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
        );
      }
      setView("landing");
      setRespondentFormValues(null);
    },
    [t, isRtl]
  );

  if (windowWidth === null) return null;

  // Only render the current view
  switch (view) {
    case "landing":
      return (
        <LandingPageWrapper
          windowWidth={windowWidth}
          onShowLogin={handleShowLogin}
          onShowIdentityCheck={handleShowIdentityCheck}
          onRespondentFormResolved={handleRespondentFormResolved}
        />
      );
    case "login":
      return (
        <LoginFormContainer initialMode={loginMode} onBack={handleBackToLanding} />
      );
    case "identity":
      return (
        <IdentityCheckPage onBack={handleBackToLanding} />
      );
    case "respondent-form-loading":
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--background)",
          }}
        >
          <PingPongLoader />
        </div>
      );
    case "respondent-form":
      if (respondentFormValues) {
        return (
          <RespondentFormRenderer
            publisherEmail={respondentFormValues.publisherEmail}
            formID={respondentFormValues.formID}
            decryptionKey={respondentFormValues.decryptionKey}
            onError={handleFormLoadError}
            onReturnToHome={handleBackToLanding}
          />
        );
      }
      return null;
    default:
      return null;
  }
}
