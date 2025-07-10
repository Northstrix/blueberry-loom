"use client";
import React from "react";
import type { SectionElement } from "@/types/formBuilder";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import CustomCheckbox from "@/components/ui/CustomCheckBox/CustomCheckbox";
import SectionElementHeader from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Header/SectionElementHeader";
import { useTranslation } from "react-i18next";
import { X, Plus } from "lucide-react";
import { useIsRtl } from "@/hooks/useIsRtl";

interface Props {
  element: Extract<SectionElement, { type: "checkboxes" }>;
  onChange: (el: SectionElement) => void;
  onRemove: () => void;
  generateUniqueOptionId: () => string;
}

export default function CheckboxesElementContainer({
  element,
  onChange,
  onRemove,
  generateUniqueOptionId,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = useIsRtl();

  function handleOptionChange(idx: number, key: "text" | "value", value: string) {
    const newOptions = element.options.slice();
    newOptions[idx] = { ...newOptions[idx], [key]: value };
    onChange({ ...element, options: newOptions });
  }

  function handleAddOption() {
    const newValue = generateUniqueOptionId();
    onChange({
      ...element,
      options: [
        ...element.options,
        {
          text: t("option") + " " + (element.options.length + 1),
          value: newValue,
        },
      ],
    });
  }

  function handleRemoveOption(idx: number) {
    const newOptions = element.options.slice();
    newOptions.splice(idx, 1);
    onChange({ ...element, options: newOptions });
  }

  // Hover state for icons
  const [hoveredRemoveIdx, setHoveredRemoveIdx] = React.useState<number | null>(null);
  const [hoveredAdd, setHoveredAdd] = React.useState(false);

  // Consistent handler for the checkbox
  const handleAllowMultipleToggle = (checked: boolean) => {
    onChange({ ...element, allowMultiple: checked });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
      <SectionElementHeader
        label={t("checkboxes")}
        onRemove={onRemove}
        ariaLabel={t("remove_element")}
      />
      <div
        className="mx-[16px] mb-[16px]"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label
          htmlFor={`allow-mult-${element.key}`}
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 4,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <CustomCheckbox
            checked={!!element.allowMultiple}
            onChange={handleAllowMultipleToggle}
            id={`allow-mult-${element.key}`}
          />
          <span
            style={{
              marginLeft: 8,
              color: "var(--muted-foreground)",
              fontSize: "14px",
            }}
          >
            {t("allow_multiple")}
          </span>
        </label>

        {element.allowMultiple && (
          <div className="mt-[12px]">
            <FloatingLabelInput
              label={t("max_selected")}
              value={element.maxSelected?.toString() ?? ""}
              onValueChange={(v) =>
                onChange({ ...element, maxSelected: Number(v) })
              }
              type="number"
              isRTL={isRtl}
            />
          </div>
        )}

        {/* Options label with RTL-aware colon and alignment */}
        <div
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            marginBottom: 2,
            textAlign: isRtl ? "right" : "left",
          }}
        >
          {isRtl ? (
            <>
              :{t("options")}{" "}
            </>
          ) : (
            <>
              {t("options")}:
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {element.options.map((opt, idx) => (
            <div key={opt.value} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <FloatingLabelInput
                  label={t("value-for-option-n", { "option-number": idx + 1 })}
                  value={opt.text}
                  onValueChange={(v) => handleOptionChange(idx, "text", v)}
                  type="text"
                  isRTL={isRtl}
                />
              </div>
              <button
                type="button"
                aria-label={t("remove_option")}
                onMouseEnter={() => setHoveredRemoveIdx(idx)}
                onMouseLeave={() => setHoveredRemoveIdx(null)}
                onClick={() => handleRemoveOption(idx)}
                style={{
                  border: `1px solid ${
                    hoveredRemoveIdx === idx
                      ? "var(--second-degree-lightened-background-adjacent-color)"
                      : "var(--lightened-background-adjacent-color)"
                  }`,
                  background:
                    hoveredRemoveIdx === idx
                      ? "var(--background)"
                      : "var(--card-background)",
                  color: "var(--foreground)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginLeft: 6,
                  transition: "background 0.3s, border 0.3s",
                }}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onMouseEnter={() => setHoveredAdd(true)}
          onMouseLeave={() => setHoveredAdd(false)}
          onClick={handleAddOption}
          style={{
            border: `1px solid ${
              hoveredAdd
                ? "var(--second-degree-lightened-background-adjacent-color)"
                : "var(--lightened-background-adjacent-color)"
            }`,
            background: hoveredAdd
              ? "var(--background)"
              : "var(--card-background)",
            color: "var(--theme-color)",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginTop: 8,
            transition: "background 0.3s, border 0.3s",
            alignSelf: "flex-start",
          }}
          aria-label={t("add_option")}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
