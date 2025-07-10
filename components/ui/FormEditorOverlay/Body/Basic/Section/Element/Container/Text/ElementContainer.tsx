"use client";
import React from "react";
import type { SectionElement } from "@/types/formBuilder";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import SectionElementHeader from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Header/SectionElementHeader";
import { useTranslation } from "react-i18next";

interface Props {
  element: Extract<SectionElement, { type: "text" }>;
  onChange: (el: SectionElement) => void;
  onRemove: () => void;
}

export default function TextElementContainer({ element, onChange, onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mt-[-16px] mx-[-4px]" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="mx-[-12px]">
        <SectionElementHeader
          label={t("text")}
          onRemove={onRemove}
          ariaLabel={t("remove_element")}
        />
      </div>
      <div className="mt-[4px] mx-[4px]">
        <FloatingLabelInput
          label={t("text")}
          value={element.text}
          onValueChange={(v) => onChange({ ...element, text: v })}
          type="text"
          isRTL={false}
        />
      </div>
    </div>
  );
}
