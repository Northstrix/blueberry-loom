"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OverlayHeader from "./Header/OverlayHeader";
import SidebarContent from "./Body/SidebarContent";
import FloatingCollapsedIcon from "./ShowSidebarIcon/FloatingCollapsedIcon";
import { FormSchema, SectionElement } from "@/types/formBuilder";
import { encodeFormTemplate } from "@/utils/formTemplateCodec";
import { generateUniqueId } from "@/hooks/useGenerateUniqueFormElementID";
import { useTranslation } from "react-i18next";

const COLLAPSED_WIDTH = 0;
const EXPANDED_WIDTH = 420;

interface Props {
  form: FormSchema;
  onFormChange: (form: FormSchema) => void;
  onSaveForm: (plaintextFormTemplate: string) => void;
  onDeleteForm?: () => void;
  onDiscard?: () => void;
  onPublish: () => void;
  unsaved: boolean;
  isNewForm: boolean;
  onTabChange?: (tab: "basic" | "advanced") => void;
  isPublic: boolean;
  onReturn?: () => void;
}

export default function FormEditorOverlay({
  form,
  onFormChange,
  onSaveForm,
  onDeleteForm,
  onDiscard,
  onPublish,
  unsaved,
  isNewForm,
  onTabChange,
  isPublic,
  onReturn,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"basic" | "advanced">("basic");
  const [collapsed, setCollapsed] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [showFloatingIcon, setShowFloatingIcon] = useState(false);

  // --- Save handler ---
  const handleSave = () => {
      onSaveForm(encodeFormTemplate(form));
  };

  // --- Section/element logic ---
  const getAllElementIds = () => {
    const ids = new Set<string>();
    for (const section of form.sections) {
      for (const el of section.elements) {
        if ("key" in el && typeof el.key === "string") {
          ids.add(el.key);
        }
      }
    }
    return ids;
  };

  // Keep existing section IDs, but localize section names
  const renameSections = (sections: { elements: SectionElement[]; id?: string }[]) =>
    sections.map((section, idx) => ({
      ...section,
      name: `${t("section")} N${idx + 1}`,
      id: section.id ?? generateUniqueId(getAllElementIds()),
    }));

  const handleAddSection = () => {
    const newSections = [...form.sections, { elements: [] }];
    onFormChange({ ...form, sections: renameSections(newSections) });
  };

  const handleRemoveSection = (idx: number) => {
    const newSections = form.sections.slice();
    newSections.splice(idx, 1);
    onFormChange({ ...form, sections: renameSections(newSections) });
  };

  const handleAddElement = (sectionIdx: number, type: SectionElement["type"]) => {
    const existingIds = getAllElementIds();
    let newElement: SectionElement;
    switch (type) {
      case "text":
        newElement = { type: "text", text: "New text" };
        break;
      case "input":
        newElement = { type: "input", text: "New input", key: generateUniqueId(existingIds) };
        break;
      case "textarea":
        newElement = { type: "textarea", text: "New textarea", key: generateUniqueId(existingIds) };
        break;
      case "checkboxes":
        newElement = {
          type: "checkboxes",
          key: generateUniqueId(existingIds),
          options: [{ text: "Option 1", value: "opt1" }],
          allowMultiple: true,
        };
        break;
      case "radio":
        newElement = {
          type: "radio",
          key: generateUniqueId(existingIds),
          options: [{ text: "Option 1", value: "opt1" }],
        };
        break;
      default:
        return;
    }
    const newSections = form.sections.slice();
    newSections[sectionIdx].elements.push(newElement);
    onFormChange({ ...form, sections: renameSections(newSections) });
  };

  // --- Fold/Unfold logic ---
  const handleCollapsedChange = (v: boolean) => {
    if (v) {
      setContentVisible(false);
      setTimeout(() => {
        setCollapsed(true);
        setTimeout(() => setShowFloatingIcon(true), 200);
      }, 320);
    } else {
      setShowFloatingIcon(false);
      setTimeout(() => {
        setCollapsed(false);
        setTimeout(() => {
          setContentVisible(true);
        }, 320);
      }, 200);
    }
  };

  // --- Framer Motion variants ---
  const sidebarVariants = {
    expanded: {
      width: EXPANDED_WIDTH,
      background: "var(--card-background)",
      borderLeft: "1px solid var(--background-adjacent-color)",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      maxWidth: "100vw",
    },
    collapsed: {
      width: COLLAPSED_WIDTH,
      background: "var(--card-background)",
      borderLeft: "none",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      maxWidth: "100vw",
    },
  };

  // --- Tab change handler (improved!) ---
  const handleTabChange = (newTab: "basic" | "advanced") => {
    setTab(newTab);
    if (onTabChange) onTabChange(newTab);
  };

  // --- Inscription/Title logic ---
  const inscription = isNewForm ? t("newForm") : t("formBuilder");

  return (
    <>
      {/* Floating collapsed icon */}
      <AnimatePresence>
        {collapsed && showFloatingIcon && (
          <FloatingCollapsedIcon visible={showFloatingIcon} onClick={() => handleCollapsedChange(false)} />
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          height: "100vh",
          boxSizing: "border-box",
          overflowY: "auto",
          overflowX: "hidden",
          maxWidth: "100vw",
        }}
      >
        <OverlayHeader
          title={inscription}
          collapsed={collapsed}
          setCollapsed={handleCollapsedChange}
          titleBlurred={!contentVisible}
        />
        <SidebarContent
          visible={contentVisible && !collapsed}
          tab={tab}
          setTab={handleTabChange} // <-- use improved handler
          form={form}
          onFormChange={onFormChange}
          onAddSection={handleAddSection}
          onRemoveSection={handleRemoveSection}
          onAddElement={handleAddElement}
          isNewForm={isNewForm}
          unsaved={unsaved}
          handleSave={handleSave}
          onDeleteForm={onDeleteForm}
          onDiscard={onDiscard}
          onPublish={onPublish}
          isPublic={isPublic}
          onReturn={onReturn}
        />
      </motion.div>
    </>
  );
}
