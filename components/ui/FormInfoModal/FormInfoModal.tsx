"use client";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { RetrievedForm } from "@/types/retrievedForm";
import Badge from "@/components/ui/Badge/Badge";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import { useTranslation } from "react-i18next";
import { formatDate as formatDateUtil } from "@/utils/formatDate";
import { auth } from "@/app/lib/firebase";
import {
  showAuthenticationErrorModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";
import { useRouter } from "next/navigation";
import { useIsRtl } from "@/hooks/useIsRtl";

// --- Meta Parsing ---
function decodeBase64Unicode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}
function parseMetaFromDecryptedTemplate(template: string | null) {
  if (!template) return {};
  const metaMatch = template.match(/^META\(([^)]*)\)/);
  if (!metaMatch) return {};
  const metaParts = metaMatch[1].split(":");
  return {
    title: metaParts[0] ? decodeBase64Unicode(metaParts[0]) : "",
    description: metaParts[1] ? decodeBase64Unicode(metaParts[1]) : "",
    submissionTitle: metaParts[2] ? decodeBase64Unicode(metaParts[2]) : "",
    submissionInscription: metaParts[3] ? decodeBase64Unicode(metaParts[3]) : "",
    submissionSuccess: metaParts[4] ? decodeBase64Unicode(metaParts[4]) : "",
    accentColor: metaParts[5] ? decodeBase64Unicode(metaParts[5]) : undefined,
    textColor: metaParts[6] ? decodeBase64Unicode(metaParts[6]) : undefined,
  };
}

function formatNumberWithCommas(value: number): string {
  return value.toLocaleString("en-US");
}

function formatResponseRate(responses: number, visits: number): string {
  if (!visits || visits === 0) return "0.00%";
  const rate = (responses / visits) * 100;
  return `${rate.toFixed(2)}%`;
}

function getStatusText(form: RetrievedForm, t: any) {
  if (form.encryptedFormTemplateStatus === "absent")
    return { ok: false, text: t("error_template_absent") };
  if (form.encryptedFormTemplateStatus === "corrupt")
    return { ok: false, text: t("error_template_corrupt") };
  if (form.encryptedEncryptionKeyStatus === "absent")
    return { ok: false, text: t("error_key_absent") };
  if (form.encryptedEncryptionKeyStatus === "corrupt")
    return { ok: false, text: t("error_key_corrupt") };
  if (form.decryptedFormKeyIntegrity === false)
    return { ok: false, text: t("error_key_integrity") };
  if (form.decryptedFormTemplateIntegrity === false)
    return { ok: false, text: t("error_template_integrity") };
  if (form.decryptedFormTemplatePaddingValid === false)
    return { ok: false, text: t("error_padding_invalid") };
  return { ok: true, text: t("form_integrity_verified") };
}

interface FormInfoModalProps {
  open: boolean;
  onClose: () => void;
  form: RetrievedForm | null;
  onViewResponses: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onOpenInEditor: (id: string) => void;
}

const FormInfoModal: React.FC<FormInfoModalProps> = ({
  open,
  onClose,
  form,
  onViewResponses,
  onDelete,
  onPublish,
  onOpenInEditor,
}) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRtl = useIsRtl();
  const ref = useRef<HTMLDivElement>(null);
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const userEmail = user?.email || "";

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !form) return null;

  const meta = parseMetaFromDecryptedTemplate(form.decryptedTemplate);
  const status = getStatusText(form, t);
  const isPublic = !!form.isPublic;
  const badgeText = isPublic ? t("public") : t("private");
  const badgeColor = isPublic ? "var(--theme-color)" : "var(--subtle-color)";
  const badgeBackground = isPublic
    ? "rgba(0,160,216,0.08)"
    : "rgba(112,112,112,0.13)";
  const accentColor = meta.accentColor || "#00db00";
  const language = i18n.language || "en";

  // Dates
  const createdAt = form.createdAt?.toDate ? form.createdAt.toDate() : null;
  const publicationDate = form.publicationDate?.toDate
    ? form.publicationDate.toDate()
    : null;

  // Metrics
  const visits = form.visits ?? 0;
  const responses = form.responses ?? 0;
  const visitsDisplay = isPublic ? formatNumberWithCommas(visits) : "--";
  const responsesDisplay = isPublic ? formatNumberWithCommas(responses) : "--";
  const responseRateDisplay =
    isPublic && visits > 0
      ? formatResponseRate(responses, visits)
      : "--";

let shareableLink = "";

function getAppRootUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function encodeUint8ArrayToBase64(arr: Uint8Array | null): string {
  if (!arr) return "";
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

// Custom base64 encode with replacements
function encodeBase64Custom(input: string): string {
  const base64 = btoa(input);
  return base64.replace(/\+/g, "(").replace(/\//g, ")");
}

// Custom base64 encode for Uint8Array with replacements
function encodeUint8ArrayToBase64Custom(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return encodeBase64Custom(binary);
}

// Your URL creation function improved
if (isPublic) {
  if (!userEmail) {
    showAuthenticationErrorModal(t, isRtl, () => router.push("/")); // It used to be the "login" route
    return;
  }
  const appRoot = getAppRootUrl();

  // Use custom encoder here
  const encodedEmail = encodeBase64Custom(userEmail);

  const keyParam =
    form.decryptedFormKey && form.decryptedFormKey instanceof Uint8Array
      ? encodeUint8ArrayToBase64Custom(form.decryptedFormKey)
      : "";

  shareableLink = `${encodedEmail}/${form.id}${
    keyParam ? `?key=${keyParam}` : ""
  }`;
}

  return (
    <Overlay onClick={onClose} data-testid="modal-overlay">
      <Modal
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("form_info_modal")}
      >
        <TopRow>
          <Title>{meta.title || t("untitled_form")}</Title>
          <div className="translate-x-[-16px]">
            <Badge
              text={badgeText}
              color={badgeColor}
              background={badgeBackground}
            />
          </div>
        </TopRow>
        <Section>
          <Label>{t("description")}:</Label>
          <Description>{meta.description}</Description>
        </Section>
        <Section>
          <Label>{t("inscription_submission_title")}:</Label>
          <Inscription>{meta.submissionTitle}</Inscription>
        </Section>
        <Section>
          <Label>{t("inscription_submission_inscription")}:</Label>
          <Inscription>{meta.submissionInscription}</Inscription>
        </Section>
        <Section>
          <Label>{t("inscription_submission_success")}:</Label>
          <Inscription>{meta.submissionSuccess}</Inscription>
        </Section>
        <Section>
          <Label>{t("color")}:</Label>
          <ColorRow>
            <Circle $color={accentColor} style={{ marginRight: 10 }} />
            <HexValue>{accentColor}</HexValue>
          </ColorRow>
        </Section>
        {!isPublic && (
          <Section>
            <Label>{t("created_at")}:</Label>
            <Value>
              {createdAt ? formatDateUtil(createdAt, language) : "--"}
            </Value>
          </Section>
        )}
        {isPublic && (
          <Section>
            <Label>{t("published_at")}:</Label>
            <Value>
              {publicationDate ? formatDateUtil(publicationDate, language) : "--"}
            </Value>
          </Section>
        )}
        <Section>
          <Label>{t("form_status")}:</Label>
          <Status $ok={status.ok}>{status.text}</Status>
        </Section>
        {isPublic && (
          <>
            <MetricsColumn>
              <Metric>
                <MetricLabel>{t("visits")}:</MetricLabel>
                <MetricValue>{visitsDisplay}</MetricValue>
              </Metric>
              <Metric>
                <MetricLabel>{t("responses")}:</MetricLabel>
                <MetricValue>{responsesDisplay}</MetricValue>
              </Metric>
              <Metric>
                <MetricLabel>{t("response_rate")}:</MetricLabel>
                <MetricValue>{responseRateDisplay}</MetricValue>
              </Metric>
            </MetricsColumn>
            <Section>
              <Label>{t("shareable_tag")}:</Label>
              <ShareableLink
              >
                {shareableLink}
              </ShareableLink>
            </Section>
          </>
        )}
        <ButtonsRow>
          {isPublic ? (
            <ChronicleButton
              text={t("view_responses")}
              onClick={() => onViewResponses(form.id)}
              width="100%"
            />
          ) : (
            <>
              <ChronicleButton
                text={t("open_in_editor")}
                onClick={() => onOpenInEditor(form.id)}
                width="100%"
              />
              <ChronicleButton
                text={t("publish")}
                onClick={() => onPublish(form.id)}
                width="100%"
              />
            </>
          )}
          <ChronicleButton
            text={t("delete")}
            onClick={() => onDelete(form.id)}
            width="100%"
            outlined
            customBackground="var(--foreground)"
            hoverColor="var(--theme-red)"
          />
        </ButtonsRow>
        <CloseButton onClick={onClose} tabIndex={0} aria-label={t("close")}>
          ×
        </CloseButton>
      </Modal>
    </Overlay>
  );
};

export default FormInfoModal;

// --- Styled Components ---
const Overlay = styled.div`
  position: fixed;
  z-index: 10;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Modal = styled.div`
  background: var(--card-background, #fff);
  border-radius: var(--general-rounding, 16px);
  border: 1px solid var(--lightened-background-adjacent-color, #e6e6e6);
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.08);
  padding: 32px 28px 28px 28px;
  max-width: min(90vw, 640px);
  max-height: 90vh;
  width: 100%;
  overflow-y: auto;
  position: relative;
  outline: none;
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: border-color 0.3s;
  &:hover {
    border-color: var(--second-degree-lightened-background-adjacent-color, #c0c0c0);
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
`;

const Title = styled.h3`
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--foreground, #fff);
  margin: 0;
  flex: 1 1 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Section = styled.div`
  margin-bottom: 5px;
`;

const Label = styled.div`
  color: var(--subtle-color, #aaa);
  font-size: 0.97rem;
  font-weight: 600;
  margin-bottom: 1px;
`;

const Description = styled.div`
  color: var(--foreground, #fff);
  font-size: 1.01rem;
  white-space: pre-line;
  overflow-wrap: break-word;
`;

const Inscription = styled.div`
  color: var(--foreground, #fff);
  font-size: 0.99rem;
  margin-bottom: 2px;
`;

const ColorRow = styled.div`
  display: flex;
  align-items: center;
`;

const Circle = styled.div<{ $color: string }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--lightened-background-adjacent-color, #eee);
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const HexValue = styled.span`
  color: var(--foreground, #fff);
  font-family: monospace;
  font-size: 1.01rem;
  font-weight: 500;
`;

const Value = styled.div`
  color: var(--foreground, #fff);
  font-size: 1.04rem;
  font-weight: 500;
`;

const Status = styled.div<{ $ok: boolean }>`
  font-size: 1.01rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? "var(--theme-green)" : "var(--theme-red)"};
  margin-top: 2px;
`;

// Column layout for metrics (one below another)
const MetricsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const MetricLabel = styled.div`
  color: var(--subtle-color, #aaa);
  font-size: 0.92rem;
  font-weight: 600;
`;

const MetricValue = styled.div`
  color: var(--foreground, #fff);
  font-size: 1.08rem;
  font-weight: 700;
`;

const ButtonsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 22px;
  width: 100%;
  & > * { width: 100%; }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  background: none;
  border: none;
  color: var(--muted-foreground, #fff);
  font-size: 1.6rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
  &:hover {
    color: var(--theme-red);
  }
`;

const ShareableLink = styled.a`
  font-family: monospace;
  color: var(--theme-color);
  word-break: break-all;
  font-size: 1.01rem;
`;
