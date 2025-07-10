"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsRtl } from "@/hooks/useIsRtl";

export interface AddElementOption {
  type: string;
  labelKey: string;
  icon: React.ElementType;
}

interface SectionAddDropdownProps {
  open: boolean;
  onToggle: (forceState?: boolean) => void;
  options: AddElementOption[];
  onSelect: (type: string) => void;
  alignRight?: boolean;
}

export default function SectionAddDropdown({
  open,
  onToggle,
  options,
  onSelect,
  alignRight = false,
}: SectionAddDropdownProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [iconHovered, setIconHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const iconButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  // Outside click & Escape close
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const iconBtn = iconButtonRef.current;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        iconBtn &&
        !iconBtn.contains(e.target as Node)
      ) {
        onToggle(false); // force close
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onToggle(false); // force close
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onToggle]);

  // Use translated labels for width calculation
  const longestLabel = options.reduce(
    (a, b) =>
      t(a.labelKey, a.labelKey).length > t(b.labelKey, b.labelKey).length ? a : b,
    options[0]
  ).labelKey;
  const minWidth = Math.max(
    170,
    t(longestLabel, longestLabel).length * 11 + 50
  );

  // Framer Motion Variants
  const variants = {
    closed: {
      opacity: 0,
      y: -16,
      filter: "blur(12px)",
      transition: {
        opacity: { duration: 0.18, ease: "easeInOut" },
        y: { duration: 0.3, ease: "easeInOut" },
        filter: { duration: 0.18, ease: "easeInOut" },
      },
      transitionEnd: { display: "none" },
    },
    open: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      display: "block",
      transition: {
        opacity: { duration: 0.18, ease: "easeInOut" },
        y: { duration: 0.3, ease: "easeInOut" },
        filter: { duration: 0.18, ease: "easeInOut" },
      },
    },
  };

  // Toggle logic
  const handleIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!open) {
        onToggle(true); // force open
      } else {
        onToggle(false); // allow close on click if open
      }
    },
    [open, onToggle]
  );

  // Hover style logic
  const isHovering = iconHovered;

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <button
          ref={iconButtonRef}
          type="button"
          aria-label={
            open
              ? t("close_add_element_menu", "Close add element menu")
              : t("add_element", "Add element")
          }
          onClick={handleIconClick}
          onMouseEnter={() => setIconHovered(true)}
          onMouseLeave={() => setIconHovered(false)}
          style={{
            border: `1px solid ${
              isHovering
                ? "var(--second-degree-lightened-background-adjacent-color)"
                : "var(--lightened-background-adjacent-color)"
            }`,
            background: isHovering
              ? "var(--background)"
              : "var(--card-background)",
            color: "var(--foreground)",
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.3s ease-in-out, border 0.3s ease-in-out",
            position: "relative",
            zIndex: 2,
          }}
          tabIndex={0}
        >
          <motion.span
            animate={{
              rotate: open ? 45 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ display: "flex" }}
          >
            <Plus size={18} />
          </motion.span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants}
            style={{
              position: "absolute",
              top: 34,
              right: alignRight || isRtl ? 0 : undefined,
              left: !alignRight && !isRtl ? 0 : undefined,
              zIndex: 99,
              background: "var(--card-background)",
              border: "1px solid var(--lightened-background-adjacent-color)",
              borderRadius: "var(--general-rounding)",
              minWidth,
              width: "max-content",
              display: "inline-flex",
              flexDirection: "column",
              gap: 0,
              padding: "10px",
              margin: 0,
              direction: isRtl ? "rtl" : "ltr",
            }}
          >
            {options.map((opt, idx) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.type}
                  style={{
                    display: "flex",
                    justifyContent: isRtl ? "flex-end" : "flex-start",
                    width: "100%",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background:
                        hovered === idx
                          ? "var(--background-adjacent-color)"
                          : "none",
                      border: "none",
                      color: "var(--foreground)",
                      fontWeight: 500,
                      textAlign: isRtl ? "right" : "left",
                      padding: "7px 9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: "1rem",
                      borderRadius: 6,
                      transition: "background 0.18s",
                      width: "100%",
                      minWidth: 0,
                      maxWidth: "100%",
                      flexDirection: isRtl ? "row-reverse" : "row",
                    }}
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                      onSelect(opt.type);
                      onToggle(false);
                    }}
                  >
                    {isRtl ? (
                      <>
                        <span style={{ flex: 1 }}>{t(opt.labelKey, opt.labelKey)}</span>
                        <Icon size={18} style={{ opacity: 0.9, flexShrink: 0 }} />
                      </>
                    ) : (
                      <>
                        <Icon size={18} style={{ opacity: 0.9, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{t(opt.labelKey, opt.labelKey)}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
