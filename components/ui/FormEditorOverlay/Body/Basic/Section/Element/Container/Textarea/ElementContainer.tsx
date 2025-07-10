"use client";
import React from "react";
import type { SectionElement } from "@/types/formBuilder";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import CustomCheckbox from "@/components/ui/CustomCheckBox/CustomCheckbox";
import SectionElementHeader from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Header/SectionElementHeader";
import { useTranslation } from "react-i18next";

interface Props {
  element: Extract<SectionElement, { type: "textarea" }>;
  onChange: (el: SectionElement) => void;
  onRemove: () => void;
}

export default function TextareaElementContainer({
  element,
  onChange,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const customHeightEnabled = element.height !== undefined && element.height !== null;

  const handleCustomHeightToggle = (checked: boolean) => {
    if (checked) {
      onChange({ ...element, height: 120 });
    } else {
      const { height, ...rest } = element;
      onChange(rest as SectionElement);
    }
  };

  const handleHeightChange = (v: string) => {
    if (customHeightEnabled) {
      const num = Number(v);
      onChange({ ...element, height: isNaN(num) ? undefined : num });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
      <SectionElementHeader
        label={t("textarea")}
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
        <label
          htmlFor="textarea-custom-height"
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 16,
            marginBottom: 16,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <CustomCheckbox
            checked={customHeightEnabled}
            onChange={handleCustomHeightToggle}
            id="textarea-custom-height"
          />
          <span style={{ marginLeft: 8, color: "var(--muted-foreground)", fontSize: "14px" }}>{t("custom-height")}</span>
        </label>
        {customHeightEnabled && (
          <FloatingLabelInput
            label={t("optional-textarea-height-label-inscription")}
            value={element.height?.toString() ?? ""}
            onValueChange={handleHeightChange}
            type="number"
            isRTL={false}
          />
        )}
      </div>
    </div>
  );
}
