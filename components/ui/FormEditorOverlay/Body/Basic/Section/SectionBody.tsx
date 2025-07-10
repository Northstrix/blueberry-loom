"use client";
import React, { useState } from "react";
import SectionContainerHeader from "@/components/ui/FormEditorOverlay/Body/Basic/Section/SectionContainerHeader";
import type { FormSchema, SectionElement } from "@/types/formBuilder";
import type { AddElementOption } from "@/components/ui/FormEditorOverlay/AddElementDropdown/SectionAddDropdown";
import { useTranslation } from "react-i18next";
import { DraggableList } from "@/components/ui/DraggableList/DraggableList";
import { generateUniqueId } from "@/hooks/useGenerateUniqueFormElementID";
import { showConfirmModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import { useIsRtl } from "@/hooks/useIsRtl";
import { Text, PencilLine, NotebookPen, CheckSquare, Radio } from "lucide-react";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import ElementBody from "./Element/ElementBody";

interface Props {
  form: FormSchema;
  onFormChange: (form: FormSchema) => void;
  onRemoveSection: (idx: number) => void;
}

function collectAllIds(form: FormSchema): Set<string> {
  const ids = new Set<string>();
  if (form.sections) {
    form.sections.forEach(section => {
      if ('key' in section && section.key) ids.add(section.key);
      section.elements.forEach(el => {
        if ('key' in el && el.key) ids.add(el.key);
        if ((el.type === 'checkboxes' || el.type === 'radio') && el.options) {
          el.options.forEach(opt => {
            if (opt.value) ids.add(opt.value);
          });
        }
      });
    });
  }
  return ids;
}

export default function SectionBody({ form, onFormChange, onRemoveSection }: Props) {
  const [addDropdownOpen, setAddDropdownOpen] = useState<number | null>(null);
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const addElementOptions: AddElementOption[] = [
    { type: "text", labelKey: "text", icon: Text },
    { type: "input", labelKey: "input", icon: PencilLine },
    { type: "textarea", labelKey: "textarea", icon: NotebookPen },
    { type: "checkboxes", labelKey: "checkboxes", icon: CheckSquare },
    { type: "radio", labelKey: "radio", icon: Radio },
  ].map(opt => ({ ...opt, label: t(opt.labelKey) }));

  function handleDropdownToggle(idx: number, forceState?: boolean) {
    if (forceState === true) setAddDropdownOpen(idx);
    else if (forceState === false) setAddDropdownOpen(null);
    else setAddDropdownOpen((prev) => (prev === idx ? null : idx));
  }

  function handleAddElementWithUniqueKey(sIdx: number, type: SectionElement["type"]) {
    const allIds = collectAllIds(form);
    let newElement: SectionElement;
    if (type === "text") {
      newElement = { type: "text", text: "New text" };
    } else if (type === "input") {
      newElement = { type: "input", text: "New input", key: generateUniqueId(allIds) };
    } else if (type === "textarea") {
      newElement = { type: "textarea", text: "New textarea", key: generateUniqueId(allIds) };
    } else if (type === "checkboxes") {
      const key = generateUniqueId(allIds);
      allIds.add(key);
      newElement = {
        type: "checkboxes",
        key,
        options: [{ text: "Option 1", value: generateUniqueId(allIds) }],
        allowMultiple: true,
      };
    } else if (type === "radio") {
      const key = generateUniqueId(allIds);
      allIds.add(key);
      newElement = {
        type: "radio",
        key,
        options: [{ text: "Option 1", value: generateUniqueId(allIds) }],
      };
    } else {
      return;
    }
    const newElements = [...form.sections[sIdx].elements, newElement];
    handleElementChange(sIdx, newElements);
    setAddDropdownOpen(null);
  }

  function handleSectionReorder(newDraggableItems: { id: string; content: React.JSX.Element }[]) {
    const idToSection = new Map(form.sections.map((section, idx) => [`section-${idx}`, section]));
    const newSections = newDraggableItems.map(item => idToSection.get(item.id)!);
    onFormChange({ ...form, sections: newSections });
  }

  function handleElementChange(sectionIdx: number, newElements: SectionElement[]) {
    const newSections = form.sections.slice();
    newSections[sectionIdx] = { ...form.sections[sectionIdx], elements: newElements };
    onFormChange({ ...form, sections: newSections });
  }

  // NEW: Pass this down so options get unique IDs
  function handleGenerateUniqueOptionId(): string {
    const allIds = collectAllIds(form);
    return generateUniqueId(allIds);
  }

  const sectionDraggableItems = form.sections.map((section, sIdx) => ({
    id: `section-${sIdx}`,
    content: (
      <div
        style={{
          borderRadius: "var(--inner-general-rounding)",
          padding: 16,
          background: "var(--background-adjacent-color)",
          position: "relative",
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <SectionContainerHeader
          sectionName={
            "meta" in section && (section as any).meta?.name
              ? (section as any).meta.name
              : `${t("section")} N${sIdx + 1}`
          }
          dropdownOpen={addDropdownOpen === sIdx}
          onDropdownToggle={(forceState) => handleDropdownToggle(sIdx, forceState)}
          addOptions={addElementOptions}
          onAddElement={(type) => handleAddElementWithUniqueKey(sIdx, type)}
        />
        <ElementBody
          section={section}
          sectionIdx={sIdx}
          onElementChange={(newElements) => handleElementChange(sIdx, newElements)}
          onRemoveElement={async (eIdx) => {
            const message = `
              <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('delete_item_confirm_line1')}</p>
              <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('delete_item_confirm_line2')}</p>
            `;
            const confirmed = await showConfirmModal({
              title: t('confirm'),
              message,
              confirmText: t('yes') || "Yes",
              cancelText: t('no') || "No",
              isRtl,
            });
            if (confirmed) {
              const newElements = section.elements.slice();
              newElements.splice(eIdx, 1);
              handleElementChange(sIdx, newElements);
            }
          }}
          generateUniqueOptionId={handleGenerateUniqueOptionId}
        />
        <div className="mt-[6px]">
          <ChronicleButton
            text={t("delete_section")}
            onClick={async () => {
              const message = `
                <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('delete_item_confirm_line1')}</p>
                <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('delete_item_confirm_line2')}</p>
              `;
              const confirmed = await showConfirmModal({
                title: t('confirm'),
                message,
                confirmText: t('yes') || "Yes",
                cancelText: t('no') || "No",
                isRtl,
              });
              if (confirmed) onRemoveSection(sIdx);
            }}
            width="100%"
            hoverColor="var(--theme-red)"
          />
        </div>
      </div>
    ),
  }));

  return (
    <DraggableList items={sectionDraggableItems} gap={22} onChange={handleSectionReorder} />
  );
}
