"use client";
import React, { useEffect, useState } from "react";
import PingPongLoader from "@/components/ui/PingPongLoader/PingPongLoader";
import { showProcessingModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import FormRenderer from "@/components/ui/FormRenderer/FormRenderer";
import { useShowError } from "@/hooks/useShowError";
import { useFormTemplateData } from "@/hooks/useFormTemplateData";
import { useDeviceOS, useLeaveDetection, useWindowSize, useOrientation } from "react-haiku";
import { MlKem1024 } from "mlkem";
import { doc, updateDoc, increment, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { padToMultipleAsUint8Array } from "@/hooks/usePadStringToMultiple";
import { silentlyEncryptDataWithTwoCiphersCBCnoPadding } from '@/app/cryptographicPrimitives/twoCiphersSilentMode';
import { useSingleEffect } from 'react-haiku';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsRtl } from "@/hooks/useIsRtl";
import { useIsMobileText } from "@/hooks/useIsMobileText";

// --- RTL detection ---
const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
function detectRTL(str: string) {
  return !!str && RTL_REGEX.test(str);
}
function getDir(str: string | undefined) {
  return detectRTL(str || "") ? "rtl" : "ltr";
}
function getAlign(str: string | undefined) {
  return detectRTL(str || "") ? "right" : "left";
}

// --- Inline max width function ---
function useFormMaxWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  if (width >= 900) return 740;
  if (width >= 800) return 715;
  if (width >= 720) return 654;
  if (width >= 680) return 612;
  if (width >= 640) return 580;
  if (width >= 600) return 524;
  if (width >= 512) return 460;
  if (width >= 464) return 418;
  if (width >= 400) return 380;
  if (width >= 360) return 360;
  return 740;
}

// Helper to encode Uint8Array to base64
function uint8ToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

export interface RespondentFormRendererProps {
  publisherEmail: string;
  formID: string;
  decryptionKey: string;
  onError: (error?: unknown) => void;
  onReturnToHome: () => void;
}

const OVERLAY_BAR_HEIGHT_MOBILE = 48;
const OVERLAY_BAR_HEIGHT_DESKTOP = 64;

const RespondentFormRenderer: React.FC<RespondentFormRendererProps> = ({
  publisherEmail,
  formID,
  decryptionKey,
  onError,
  onReturnToHome,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const showError = useShowError(setLoading);
  const {
    formSchema,
    publicKeyFingerprint,
    publicKey,
    author,
    meta,
    fetchData,
  } = useFormTemplateData({
    publisherEmail,
    formID,
    decryptionKey,
    showError: (key, extra, errorObj, isCatch) => {
      if (typeof errorObj === "string" && errorObj.trim()) {
        onError(errorObj);
      } else if (errorObj && typeof errorObj === "object" && "message" in errorObj && typeof (errorObj as any).message === "string") {
        onError((errorObj as any).message);
      } else if (typeof key === "string" && key.trim()) {
        onError(key);
      } else {
        onError();
      }
    },
    t,
    setLoading,
  });

  const maxWidth = useFormMaxWidth();
  const deviceOS = useDeviceOS();
  const { width, height } = useWindowSize();
  const orientation = useOrientation();
  const [leaveCount, setLeaveCount] = useState(0);
  useLeaveDetection(() => setLeaveCount((count) => count + 1));
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const isRTL = useIsRtl();
  const isMobile = useIsMobileText();
  const overlayBarHeight = isMobile ? OVERLAY_BAR_HEIGHT_MOBILE : OVERLAY_BAR_HEIGHT_DESKTOP;

  useSingleEffect(() => {
    fetchData();
    // eslint-disable-next-line
  });

  // Encapsulation logic
  interface EncapsulatedSecret {
    ct: Uint8Array;
    ssS: Uint8Array;
  }
  const encapsulateSecret = async (pkR: Uint8Array): Promise<EncapsulatedSecret | undefined> => {
    try {
      const sender = new MlKem1024();
      const [ct, ssS] = await sender.encap(pkR);
      return { ct, ssS };
    } catch (err) {
      console.error("Failed to encapsulate secret:", (err as Error).message);
    }
  };

  async function submitResponse(encoded: string) {
    if (!publicKey) return;
    const processingTitle = meta.submissionTitle || t("submitting-your-response");
    const processingMessage = `<p dir="${getDir(meta.submissionInscription)}" style="text-align:center">${meta.submissionInscription || t("please_wait")}</p>`;
    showProcessingModal(processingTitle, processingMessage);

    const encapsulatedSecret1 = await encapsulateSecret(publicKey);
    const encapsulatedSecret2 = await encapsulateSecret(publicKey);
    if (!encapsulatedSecret1 || !encapsulatedSecret2) return;

    const concatenatedSsS = new Uint8Array(encapsulatedSecret1.ssS.length + encapsulatedSecret2.ssS.length);
    concatenatedSsS.set(encapsulatedSecret1.ssS, 0);
    concatenatedSsS.set(encapsulatedSecret2.ssS, encapsulatedSecret1.ssS.length);

    const paddedFormResponseStringAsUint8Array = padToMultipleAsUint8Array(encoded);
    const encryptedFormResponse = await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
      paddedFormResponseStringAsUint8Array,
      concatenatedSsS,
      125
    );
    const encryptedFormResponseBase64 = uint8ToBase64(encryptedFormResponse);
    const mlkemCiphertext1Base64 = uint8ToBase64(encapsulatedSecret1.ct);
    const mlkemCiphertext2Base64 = uint8ToBase64(encapsulatedSecret2.ct);

    if (!author || !formID) return;
    try {
      const formDocRef = doc(db, `data/${author}/forms/${formID}`);
      await updateDoc(formDocRef, { responses: increment(1) });

      const docRef = doc(collection(db, `data/${author}/receivedResponses/encrypted/${formID}`));
      const tagData = {
        encryptedFormResponse: encryptedFormResponseBase64,
        mlkemCiphertext1: mlkemCiphertext1Base64,
        mlkemCiphertext2: mlkemCiphertext2Base64,
        metrics: {
          deviceOS,
          windowWidth: width,
          windowHeight: height,
          orientation,
          leaveCount,
        },
        submittedAt: serverTimestamp(),
      };
      await setDoc(docRef, tagData);

      await Swal.close();
      setSubmissionSuccess(true);
    } catch (e) {
      console.error(e);
      showError("k", undefined, e, true);
    }
  }

  function handleNewSubmission() {
    setSubmissionSuccess(false);
    setFormKey((k) => k + 1);
  }

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onReturnToHome();
  };

  const overlayBar = isRTL ? (
    <div
      className="absolute top-0 left-0 z-50 flex items-center justify-start w-full"
      style={{
        height: overlayBarHeight,
        marginRight: isMobile ? 10 : 24,
        pointerEvents: "none",
      }}
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
    </div>
  ) : (
    <div
      className="absolute top-0 left-0 z-50 flex items-center"
      style={{
        height: overlayBarHeight,
        marginLeft: isMobile ? 10 : 24,
        marginRight: isMobile ? 10 : 24,
        pointerEvents: "none",
      }}
    >
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
        <span className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]">
          {t("return")}
        </span>
      </a>
    </div>
  );

  if (loading) {
    return (
      <div
        className="relative"
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {overlayBar}
        <div style={{ height: overlayBarHeight }} />
        <PingPongLoader />
      </div>
    );
  }

  if (!formSchema || !publicKeyFingerprint || !publicKey || !author) return null;

  if (submissionSuccess) {
    const submissionSuccessStr = meta.submissionSuccess || t("form_submitted_successfully");
    const submissionInscriptionStr = meta.submissionInscription || t("submit_another_response");
    const inscriptionDir = getDir(submissionInscriptionStr);
    const inscriptionAlign = getAlign(submissionInscriptionStr);

    return (
      <div
        className="relative"
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--foreground)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {overlayBar}
        <div style={{ height: overlayBarHeight }} />
        <section
          style={{
            maxWidth,
            width: "100%",
            margin: "40px auto 0 auto",
            padding: "2.25rem 2.2rem",
            background: "var(--card-background)",
            borderRadius: "var(--general-rounding)",
            border: "1px solid var(--background-adjacent-color)",
            boxSizing: "border-box",
            textAlign: inscriptionAlign,
            direction: inscriptionDir,
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              marginBottom: "0.5rem",
              color: "var(--foreground)",
              textAlign: inscriptionAlign,
              direction: inscriptionDir,
            }}
          >
            {submissionSuccessStr}
          </h1>
          <div
            style={{
              fontSize: "1.1rem",
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
              marginTop: "0.7rem",
              display: "inline-block",
              textAlign: inscriptionAlign,
              direction: inscriptionDir,
              width: "100%",
            }}
            tabIndex={0}
            role="button"
            onClick={handleNewSubmission}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") handleNewSubmission();
            }}
          >
            {t("submit_another_response")}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        color: "var(--foreground)",
      }}
    >
      {overlayBar}
      <div style={{ height: overlayBarHeight }} />
      <div
        style={{
          maxWidth,
          width: "100%",
          margin: "40px auto 0 auto",
          padding: "0 10px",
          background: "none",
        }}
      >
        <FormRenderer
          key={formKey}
          schema={formSchema}
          onSubmit={submitResponse}
          author={author}
          fingerprint={publicKeyFingerprint}
        />
      </div>
    </div>
  );
};

export default RespondentFormRenderer;
