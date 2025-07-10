"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import { useIsRtl } from "@/hooks/useIsRtl";
import { showClosableErrorModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import { toast } from "react-toastify";
import { X } from "lucide-react";

function decodePercentEncoded(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}
function extractKeyBase64(input: string): string {
  const keyMatch = input.match(/[?&]key=([^&]*)/);
  return keyMatch ? keyMatch[1] : "";
}
function isCustomBase64(str: string): boolean {
  return /^[A-Za-z0-9()=]+$/.test(str);
}
function reverseCustomBase64(str: string): string {
  return str.replace(/\(/g, "+").replace(/\)/g, "/");
}
function tryDecodeBase64(str: string): boolean {
  try {
    const normal = reverseCustomBase64(str);
    if (typeof window !== "undefined") {
      window.atob(normal);
    } else {
      Buffer.from(normal, "base64").toString("binary");
    }
    return true;
  } catch {
    return false;
  }
}
function interpolatePadding(width: number): string {
  const minW = 240, maxW = 800;
  const minPadding = [1.25, 1];
  const maxPadding = [2.5, 2];
  if (width <= minW) return "1.25rem 1rem";
  if (width >= maxW) return "2.5rem 2rem";
  const t = (width - minW) / (maxW - minW);
  const vPad = minPadding[0] + (maxPadding[0] - minPadding[0]) * t;
  const hPad = minPadding[1] + (maxPadding[1] - minPadding[1]) * t;
  return `${vPad}rem ${hPad}rem`;
}

interface ResponderFormInputModalProps {
  open: boolean;
  onClose: () => void;
  onResolved: (values: { publisherEmail: string; formID: string; decryptionKey: string }) => void;
  loading?: boolean;
}

const BUTTON_CONTAINER_MARGIN = "0.25em";

const ResponderFormInputModal: React.FC<ResponderFormInputModalProps> = ({
  open,
  onClose,
  onResolved,
  loading = false,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRtl();
  const [input, setInput] = useState("");
  const [hovered, setHovered] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Responsive padding state
  const [padding, setPadding] = useState(() =>
    typeof window !== "undefined"
      ? interpolatePadding(window.innerWidth)
      : "2.5rem 2rem"
  );

  useEffect(() => {
    function handleResize() {
      setPadding(interpolatePadding(window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent | React.MouseEvent) => {
      if (e) e.preventDefault?.();
      const tag = input.trim();
      if (!tag) return;
      try {
        const decoded = /%[0-9A-Fa-f]{2}/.test(tag) ? decodePercentEncoded(tag) : tag;
        const parts = decoded.split("/");
        if (parts.length < 2) throw new Error("invalid_tag");
        const publisherEmail = parts[0];
        const formAndKey = parts.slice(1).join("/");
        const formID = formAndKey.split("?")[0];
        const keyRaw = extractKeyBase64(decoded);

        if (!publisherEmail) throw new Error("invalid_email");
        if (!isCustomBase64(publisherEmail)) throw new Error("invalid_email");
        if (!tryDecodeBase64(publisherEmail)) throw new Error("invalid_email");
        if (!formID) throw new Error("missing_form_id");
        if (!keyRaw) throw new Error("invalid_key");
        if (!isCustomBase64(keyRaw)) throw new Error("invalid_key");
        if (!tryDecodeBase64(keyRaw)) throw new Error("invalid_key");

        onClose();
        onResolved({ publisherEmail, formID, decryptionKey: keyRaw });
      } catch (e: any) {
        let errorKey = e?.message || "invalid_tag";
        if (errorKey === "invalid_email") {
          toast.error(t("invalid_email"));
        } else if (errorKey === "invalid_key") {
          toast.error(t("invalid_key"));
        } else if (errorKey === "missing_form_id") {
          toast.error(t("missing_form_id"));
        } else {
          showClosableErrorModal(t, `<div>${t("invalid_tag")}</div>`);
        }
      }
    },
    [input, onResolved, t, onClose]
  );

  if (!open) return null;
  return (
    <ModalOverlay onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalCard
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          padding,
          margin: 10,
          width: "fit-content",
          minWidth: 320,
          maxWidth: "calc(100vw - 20px)",
          borderColor: hovered
            ? "var(--second-degree-lightened-background-adjacent-color)"
            : "var(--lightened-background-adjacent-color)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <ModalCloseIcon $isRtl={isRTL} onClick={onClose} tabIndex={0} aria-label={t("close")}>
          <X size={24} />
        </ModalCloseIcon>
        <ModalTitle>{t("responder_form_input_modal_title")}</ModalTitle>
        <ModalInscription>
          {t("responder_form_input_modal_inscription")}
        </ModalInscription>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            marginTop: "1.5rem",
          }}
          autoComplete="off"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <FloatingLabelInput
            label={t("responder_form_input_label")}
            value={input}
            onValueChange={setInput}
            disabled={loading}
            type="text"
            isRTL={isRTL}
            autoComplete="off"
            spellCheck={false}
          />
          <div style={{ marginTop: BUTTON_CONTAINER_MARGIN }}>
            <ChronicleButton
              text={loading ? t("loading") : t("responder_form_input_button")}
              onClick={handleSubmit}
              width="100%"
              customBackground="var(--foreground)"
              customForeground="var(--background)"
              hoverColor="var(--theme-color)"
              hoverForeground="var(--foreground)"
              borderRadius="var(--general-rounding)"
              disabled={loading}
            />
          </div>
        </form>
      </ModalCard>
    </ModalOverlay>
  );
};

export default ResponderFormInputModal;

// --- Styled Components ---
const ModalOverlay = styled.div`
  z-index: 1000;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalCard = styled.div`
  background: var(--card-background);
  border-radius: var(--general-rounding);
  border: 1.5px solid var(--lightened-background-adjacent-color);
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.08);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: border-color 0.3s;
  /* width, minWidth, maxWidth, margin, padding handled inline */
`;

const ModalCloseIcon = styled.button<{ $isRtl: boolean }>`
  position: absolute;
  top: 18px;
  ${props => props.$isRtl ? "left: 18px;" : "right: 18px;"}
  background: none;
  border: none;
  color: var(--input-outline);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  z-index: 2;

  &:hover {
    color: var(--theme-red);
  }
`;

const ModalTitle = styled.h2`
  font-size: 1.27rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 0.6rem 0;
  text-align: center;
  letter-spacing: -0.01em;
`;

const ModalInscription = styled.div`
  color: var(--muted-foreground);
  font-size: 1.025rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  line-height: 1.5;
`;
