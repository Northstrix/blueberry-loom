"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CustomRadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentColor?: string;
  highlightForeground?: string;
  allowUnselect?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const CustomRadio = React.forwardRef<HTMLButtonElement, CustomRadioProps>(
  (
    {
      checked,
      onChange,
      accentColor = "var(--theme-color)",
      highlightForeground = "var(--foreground)",
      allowUnselect = true,
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (disabled) return;
      if (checked && allowUnselect) {
        onChange(false);
      } else if (!checked) {
        onChange(true);
      }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      handleClick();
    };

    return (
      <motion.button
        type="button"
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={0}
        ref={ref}
        id={id}
        className={cn(
          "flex items-center justify-center rounded-full relative",
          className
        )}
        style={{
          width: 24,
          height: 24,
          background: checked
            ? accentColor
            : "var(--background-adjacent-color)",
          border: `1.5px solid var(--lightened-background-adjacent-color)`,
          transition: "background 0.2s, border 0.2s",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
        }}
        whileTap={{ scale: 0.95 }}
        whileHover={disabled ? {} : { scale: 1.06 }}
        disabled={disabled}
        {...props}
      >
        {checked && (
          <motion.div
            // layoutId removed!
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: highlightForeground,
              transition: "background 0.2s",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        )}
        {/* Invisible overlay to guarantee click, including on the dot */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
            borderRadius: "50%",
            zIndex: 2,
            cursor: disabled ? "not-allowed" : "pointer",
            pointerEvents: "auto",
          }}
          onClick={handleOverlayClick}
        />
      </motion.button>
    );
  }
);

CustomRadio.displayName = "CustomRadio";
export default CustomRadio;