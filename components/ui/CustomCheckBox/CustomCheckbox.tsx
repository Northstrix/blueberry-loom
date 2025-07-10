"use client";
import React from "react";
import { motion } from "framer-motion";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentColor?: string;
  highlightForeground?: string;
  id?: string;
  disabled?: boolean;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  accentColor = "var(--theme-color)",
  highlightForeground = "var(--foreground)",
  id,
  disabled,
}) => {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={0}
      id={id}
      onClick={e => {
        e.preventDefault();
        if (!disabled) onChange(!checked);
      }}
      className="flex items-center justify-center rounded-md"
      style={{
        width: 24,
        height: 24,
        background: disabled
          ? "var(--card-background)"
          : checked
          ? accentColor
          : "var(--background-adjacent-color)",
        border: `1.5px solid var(--lightened-background-adjacent-color)`,
        transition: "background 0.2s, border 0.2s",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        padding: 0,
      }}
      whileTap={{ scale: 0.93 }}
      whileHover={disabled ? {} : { scale: 1.06 }}
      disabled={disabled}
    >
      {/* Only render the check when checked, for accessibility and performance */}
      {checked && (
        <motion.svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          stroke={highlightForeground}
          strokeWidth={3}
          fill="none"
          style={{
            display: "block",
            pointerEvents: "none",
          }}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{
              duration: 0.32,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </motion.svg>
      )}
    </motion.button>
  );
};

export default CustomCheckbox;
