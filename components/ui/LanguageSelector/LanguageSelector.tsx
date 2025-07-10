"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";
import "@ncdai/react-wheel-picker/style.css";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// --- Firebase imports ---
import { db, auth } from '@/app/lib/firebase';
import { doc, setDoc, collection } from "firebase/firestore";

// --- Supported languages ---
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "he", label: "עברית" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "pl", label: "Polski" },
  { code: "yue", label: "廣東話" },
];

export interface LanguageSelectorHandle {
  open: () => void;
  close: () => void;
}
interface LanguageSelectorProps {
  onClose?: () => void;
}

const ANIMATION_DURATION = 0.3;

// --- WheelPicker component defined here ---
function WheelPicker({ classNames, ...props }: React.ComponentProps<typeof WheelPickerPrimitive.WheelPicker>) {
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: "text-zinc-500",
        highlightWrapper: "bg-zinc-800 text-zinc-50",
        ...classNames,
      }}
      {...props}
    />
  );
}

const LanguageSelector = React.forwardRef<LanguageSelectorHandle, LanguageSelectorProps>(
  function LanguageSelector({ onClose }, ref) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(i18n.language);
    const [isMobile, setIsMobile] = useState(
      typeof window !== "undefined" && window.innerWidth < 412
    );

    // Timer ref for delayed language change
    const changeLangTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Expose open/close methods to parent via ref
    React.useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }));

    // Responsive padding
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 412);
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Update selected value if language changes externally
    useEffect(() => {
      setSelectedValue(i18n.language);
    }, [i18n.language]);

    // --- Improved: Debounced language change logic ---
    const handleValueChange = useCallback(
      (value: string) => {
        setSelectedValue(value);
        // Clear any previous timer
        if (changeLangTimeout.current) {
          clearTimeout(changeLangTimeout.current);
        }
        // Set a new timer
        changeLangTimeout.current = setTimeout(async () => {
          if (value !== i18n.language) {
            // 1. Change language locally (always)
            await i18n.changeLanguage(value);

            // 2. Quietly update Firebase if user is logged in
            try {
              const user = auth.currentUser;
              if (user) {
                const userSettings = {
                  language: value, // Use the just-selected language
                };
                const docRef = doc(collection(db, 'data'), `${user.email}/private/settings`);
                await setDoc(docRef, userSettings, { merge: true });
              }
            } catch {
              // Silently ignore errors
            }
          }
        }, 800);
      },
      [i18n]
    );

    // Clean up timer on unmount or modal close
    useEffect(() => {
      if (!open && changeLangTimeout.current) {
        clearTimeout(changeLangTimeout.current);
      }
      return () => {
        if (changeLangTimeout.current) {
          clearTimeout(changeLangTimeout.current);
        }
      };
    }, [open]);

    // Modal close handler
    const handleClose = () => {
      setOpen(false);
      onClose?.();
    };

    // Border color animation logic
    const [modalHovered, setModalHovered] = useState(false);
    const [pickerHovered, setPickerHovered] = useState(false);

    // WheelPicker options
    const options = LANGUAGES.map((lang) => ({
      label: lang.label,
      value: lang.code,
    }));

    return (
      <AnimatePresence>
        {open && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleClose}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: ANIMATION_DURATION, ease: "easeInOut" }}
              style={{
                background: "var(--background)",
                borderRadius: "var(--general-rounding)",
                boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
                padding: isMobile ? 10 : 24,
                minWidth: 240,
                border: modalHovered
                  ? "1px solid var(--lightened-background-adjacent-color)"
                  : "1px solid var(--background-adjacent-color)",
                transition: "border-color 0.3s",
                outline: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                maxWidth: "90vw",
              }}
              tabIndex={-1}
              onMouseEnter={() => setModalHovered(true)}
              onMouseLeave={() => setModalHovered(false)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Single column WheelPicker */}
              <div
                style={{
                  width: "100%",
                  borderRadius: "var(--general-rounding)",
                  border: pickerHovered
                    ? "1px solid var(--lightened-background-adjacent-color)"
                    : "1px solid var(--background-adjacent-color)",
                  transition: "border-color 0.3s",
                  marginBottom: isMobile ? 16 : 28,
                  background: "var(--card-background)",
                  overflow: "hidden",
                  display: "flex",
                  justifyContent: "center",
                }}
                onMouseEnter={() => setPickerHovered(true)}
                onMouseLeave={() => setPickerHovered(false)}
              >
                <WheelPicker
                  options={options}
                  value={selectedValue}
                  onValueChange={handleValueChange}
                />
              </div>
              {/* OK Button */}
              <ChronicleButton
                text={t("ok_button")}
                onClick={handleClose}
                width="100%"
                borderRadius="var(--general-rounding)"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

export default LanguageSelector;
