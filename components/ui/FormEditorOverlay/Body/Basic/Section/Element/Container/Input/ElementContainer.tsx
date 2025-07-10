"use client";
import React from "react";
import type { SectionElement } from "@/types/formBuilder";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import SectionElementHeader from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Header/SectionElementHeader";
import { useTranslation } from "react-i18next";

interface Props {
  element: Extract<SectionElement, { type: "input" }>;
  onChange: (el: SectionElement) => void;
  onRemove: () => void;
}

export default function InputElementContainer({ element, onChange, onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
      <SectionElementHeader
        label={t("input")}
        onRemove={onRemove}
        ariaLabel={t("remove_element")}
      />
      <div className="mx-[16px] mb-[16px]">
        <FloatingLabelInput
          label={t("label")}
          value={element.text}
          onValueChange={(v) => onChange({ ...element, text: v })}
          type="text"
          isRTL={false}
        />
      </div>
    </div>
  );
}
