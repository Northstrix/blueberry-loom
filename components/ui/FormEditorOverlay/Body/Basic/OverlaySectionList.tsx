"use client";
import React from "react";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import SectionBody from "@/components/ui/FormEditorOverlay/Body/Basic/Section/SectionBody";
import type { FormSchema} from "@/types/formBuilder";
import { useTranslation } from "react-i18next";
import { useIsRtl } from "@/hooks/useIsRtl";

interface Props {
  form: FormSchema;
  onFormChange: (form: FormSchema) => void;
  onAddSection: () => void;
  onRemoveSection: (idx: number) => void;
}

export default function OverlaySectionList({
  form,
  onFormChange,
  onAddSection,
  onRemoveSection,
}: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  function handleMetaChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onFormChange({
      ...form,
      meta: {
        ...form.meta,
        [e.target.name]: e.target.value,
      },
    });
  }

  return (
    <div style={{ overflow: "visible", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontWeight: 500,
          color: "var(--muted-foreground)",
          fontSize: 15,
          marginBottom: form.sections.length > 0 ? 18 : 0,
          marginTop: 2,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      ></div>
      <div>
        <FloatingLabelInput
          label={t("title")}
          value={form.meta.title}
          onValueChange={(v) =>
            handleMetaChange({ target: { name: "title", value: v } } as any)
          }
          type="text"
          isRTL={false}
        />
        <FloatingLabelInput
          label={t("description")}
          value={form.meta.description}
          onValueChange={(v) =>
            handleMetaChange({ target: { name: "description", value: v } } as any)
          }
          type="textarea"
          textarea
          isRTL={false}
        />
      </div>
      <div className="flex flex-col gap-[22px]">
        {form.sections.length > 0 && (
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className="mt-[22px] text-center"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {t("reorder_hint") ||
              "You can rearrange sections and elements within them by dragging them."}
          </div>
        )}
        <SectionBody
          form={form}
          onFormChange={onFormChange}
          onRemoveSection={onRemoveSection}
        />
        <div>
          <ChronicleButton text={t("add_section")} onClick={onAddSection} width="100%" />
        </div>
      </div>
    </div>
  );
}
