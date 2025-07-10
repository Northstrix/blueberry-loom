"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { FormSchema } from "@/types/formBuilder";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import { useIsRtl } from "@/hooks/useIsRtl";

const defaultAdvanced = {
  accentColor: "#00a0d8",
  highlightForeground: "#fff",
  responseModal: { primary: "Submitting your response", subtext: "Please wait for a while..." },
  successNotification: "Response has been submitted successfully!",
};

interface Props {
  form: FormSchema;
  onFormChange: (form: FormSchema) => void;
}

export default function OverlayAdvanced({ form, onFormChange }: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  const handleAdvancedChange = (field: string, value: string) => {
    onFormChange({
      ...form,
      meta: {
        ...form.meta,
        [field]: value,
      },
    });
  };
  const handleResponseModalChange = (field: string, value: string) => {
    onFormChange({
      ...form,
      meta: {
        ...form.meta,
        responseModal: {
          ...form.meta.responseModal,
          [field]: value,
        },
      },
    });
  };
  const handleRestoreDefaults = () => {
    onFormChange({
      ...form,
      meta: {
        ...form.meta,
        accentColor: defaultAdvanced.accentColor,
        highlightForeground: defaultAdvanced.highlightForeground,
        responseModal: { ...defaultAdvanced.responseModal },
        successNotification: defaultAdvanced.successNotification,
      },
    });
  };

  return (
    <div style={{ overflow: "visible" }}>
      <FloatingLabelInput
        label={t("accent-color")}
        value={form.meta.accentColor || ""}
        onValueChange={v => handleAdvancedChange("accentColor", v)}
        type="text"
        isRTL={isRtl}
      />
      <FloatingLabelInput
        label={t("highlight-foreground")}
        value={form.meta.highlightForeground || ""}
        onValueChange={v => handleAdvancedChange("highlightForeground", v)}
        type="text"
        isRTL={isRtl}
      />
      <FloatingLabelInput
        label={t("submission-modal-title")}
        value={form.meta.responseModal.primary}
        onValueChange={v => handleResponseModalChange("primary", v)}
        type="text"
        isRTL={isRtl}
      />
      <FloatingLabelInput
        label={t("submission-modal-text")}
        value={form.meta.responseModal.subtext}
        onValueChange={v => handleResponseModalChange("subtext", v)}
        type="text"
        isRTL={isRtl}
      />
      <FloatingLabelInput
        label={t("success-notification")}
        value={form.meta.successNotification}
        onValueChange={v => handleAdvancedChange("successNotification", v)}
        type="text"
        isRTL={isRtl}
      />
      <ChronicleButton
        text={t("restore-default-values")}
        onClick={handleRestoreDefaults}
        width="100%"
      />
    </div>
  );
}
