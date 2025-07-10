"use client"
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OverlaySectionList from "./Basic/OverlaySectionList";
import OverlayAdvanced from "./Advanced/OverlayAdvanced";
import OverlayActions from "../Footer/OverlayActions";
import RadioButton, { RadioOption } from "@/components/ui/RadioButton/RadioButton";
import { FormSchema, SectionElement } from "@/types/formBuilder";
import { Pencil, Cog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsRtl } from "@/hooks/useIsRtl";

function getXPadding(width: number) {
  const minW = 320, maxW = 480;
  if (width <= minW) return "1rem";
  if (width >= maxW) return "1.6rem";
  const padding = 1 + ((width - minW) * (1.6 - 1)) / (maxW - minW);
  return `${padding}rem`;
}

interface Props {
  visible: boolean;
  tab: "basic" | "advanced";
  setTab: (tab: "basic" | "advanced") => void;
  form: FormSchema;
  onFormChange: (form: FormSchema) => void;
  onAddSection: () => void;
  onRemoveSection: (idx: number) => void;
  onAddElement: (sectionIdx: number, type: SectionElement["type"]) => void;
  isNewForm: boolean;
  unsaved: boolean;
  isPublic: boolean;
  handleSave: () => void;
  onDeleteForm?: () => void;
  onDiscard?: () => void;
  onPublish: () => void;
  onReturn?: () => void;
}

export default function SidebarContent({
  visible,
  tab,
  setTab,
  form,
  onFormChange,
  onAddSection,
  onRemoveSection,
  onAddElement,
  isNewForm,
  unsaved,
  isPublic,
  handleSave,
  onDeleteForm,
  onDiscard,
  onPublish,
  onReturn,
}: Props) {
  const [xPadding, setXPadding] = useState(() =>
    getXPadding(typeof window !== "undefined" ? window.innerWidth : 480)
  );
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  // Build radio options with translated labels
  const radioOptions: RadioOption[] = [
    { value: "basic", label: t("basic"), icon: Pencil },
    { value: "advanced", label: t("advanced"), icon: Cog },
  ];

  // Swap options if RTL, but keep their values and logic
  const displayedOptions = isRtl ? [...radioOptions].reverse() : radioOptions;

  useEffect(() => {
    function handleResize() {
      setXPadding(getXPadding(window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="content"
          initial={{ opacity: 0, filter: "blur(12px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.32, ease: "easeInOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            flex: 1,
            padding: `0 ${xPadding}`,
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <RadioButton
            options={displayedOptions}
            value={tab}
            onChange={v => setTab(v as "basic" | "advanced")}
            gap="10px"
            borderRadius="var(--general-rounding)"
          />
          <div style={{ flex: 1, minHeight: 0, paddingTop: 22 }}>
            {tab === "basic" ? (
              <OverlaySectionList
                form={form}
                onFormChange={onFormChange}
                onAddSection={onAddSection}
                onRemoveSection={onRemoveSection}
                onAddElement={onAddElement}
              />
            ) : (
              <OverlayAdvanced form={form} onFormChange={onFormChange} />
            )}
            <div
              style={{
                margin: "28px 0 0 0",
                borderTop: "1px solid var(--background-adjacent-color)",
                paddingTop: 4,
                paddingBottom: 8,
                background: "var(--card-background)",
              }}
            >
              <OverlayActions
                isNewForm={isNewForm}
                unsaved={unsaved}
                onSave={handleSave}
                onDelete={onDeleteForm}
                onDiscard={onDiscard}
                onPublish={onPublish}
                isPublic={isPublic}
                onReturn={onReturn}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
