"use client";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import { useIsRtl } from "@/hooks/useIsRtl";
import {
  showProcessingModal,
  showConfirmModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";

interface Props {
  isNewForm: boolean;
  isPublic: boolean;
  onSave: () => void;
  onDelete?: () => void;
  onDiscard?: () => void;
  onPublish: () => void;
  onReturn?: () => void;
}

const githubInscriptionStyle = `
  .landingpage-github-inscription {
    background: none;
    border: none;
    color: inherit;
    outline: none !important;
    box-shadow: none !important;
    padding: 0;
    margin: 0;
    display: inline;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
    transform: translateY(1px);
  }
  .landingpage-github-inscription:focus {
    outline: none !important;
  }
  .github-link-text {
    font-weight: 700;
    font-size: 1.025rem;
    line-height: 1;
    color: var(--subtle-color);
    text-decoration: underline;
    text-decoration-style: solid;
    cursor: pointer;
    transition: color 0.3s;
    outline: none;
    box-shadow: none;
    display: inline-block;
  }
  .github-link-text:hover {
    color: var(--muted-foreground);
  }
`;

export default function OverlayActions({
  isNewForm,
  isPublic,
  onSave,
  onDelete,
  onDiscard,
  onPublish,
  onReturn,
}: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();

  // Inject the inscription style once
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !document.getElementById("landingpage-github-inscription-style")
    ) {
      const style = document.createElement("style");
      style.id = "landingpage-github-inscription-style";
      style.innerHTML = githubInscriptionStyle;
      document.head.appendChild(style);
    }
  }, []);

  const handleSave = () => {
    const processingMessage = `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`;
    showProcessingModal(t("saving-form"), processingMessage);
    setTimeout(() => {
      onSave();
    }, 100);
  };

  const handlePublish = async () => {
    const confirmed = await showConfirmModal({
      title: t("confirm"),
      message: `
        <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("publish_form_confirm_line1")}</p>
        <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("publish_form_confirm_line2")}</p>
        <p dir="${isRtl ? "rtl" : "ltr"}">${t("publish_form_confirm_line3")}</p>
      `,
      confirmText: t("yes") || "Yes",
      cancelText: t("no") || "No",
      isRtl,
    });
    if (!confirmed) return;

    const processingMessage = `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`;
    showProcessingModal(t("publishing-form"), processingMessage);
    setTimeout(() => {
      onPublish();
    }, 100);
  };

  const handleReturnToDashboard = () => {
    onReturn?.();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginTop: 24,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: 14,
          color: "var(--muted-foreground)",
          marginBottom: 4,
          letterSpacing: 1,
        }}
      >
        {t("actions")}:
      </div>

      {/* Save button: only show for new forms, or for non-new forms if not public */}
      {(isNewForm || (!isNewForm && !isPublic)) && (
        <ChronicleButton text={t("save")} onClick={handleSave} width="100%" />
      )}

      {isNewForm ? (
        <ChronicleButton
          text={t("discard")}
          onClick={onDiscard}
          width="100%"
          hoverColor="var(--theme-red)"
        />
      ) : (
        <>
          {/* Publish button only if not published */}
          {!isPublic && (
            <ChronicleButton
              text={t("publish")}
              onClick={handlePublish}
              width="100%"
              hoverColor="var(--theme-green)"
            />
          )}
          <ChronicleButton
            text={t("delete")}
            onClick={onDelete}
            width="100%"
            hoverColor="var(--theme-red)"
          />
        </>
      )}

      {/* Centered Return to Dashboard inscription */}
      <span
        className="landingpage-github-inscription"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 14,
          width: "100%",
        }}
      >
        <button
          type="button"
          className="github-link-text"
          tabIndex={0}
          onClick={handleReturnToDashboard}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            font: "inherit",
          }}
        >
          {t("return-to-dashboard")}
        </button>
      </span>
      <div style={{ marginTop: 72 }}></div>
    </div>
  );
}