import React from "react";
import { motion } from "framer-motion";
import { PanelLeftClose } from "lucide-react";

interface Props {
  visible: boolean;
  onClick: () => void;
}

export default function FloatingCollapsedIcon({ visible, onClick }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -40 }}
      animate={
        visible
          ? { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.2, ease: "easeInOut" } }
          : { opacity: 0, y: -40, transition: { duration: 0.2, ease: "easeInOut" } }
      }
      exit={{ opacity: 0, y: -40, transition: { duration: 0.2, ease: "easeInOut" } }}
      aria-label="Show editor"
      onClick={onClick}
      style={{
        position: "fixed",
        top: 10,
        right: 14,
        zIndex: 100,
        borderRadius: "50%",
        border: "1px solid var(--background-adjacent-color)",
        background: "var(--card-background)",
        color: "var(--foreground)",
        padding: 7,
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "none",
        pointerEvents: visible ? "auto" : "none",
        transition: "background 0.3s, border 0.3s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--background-adjacent-color)";
        (e.currentTarget as HTMLButtonElement).style.border = "1px solid var(--lightened-background-adjacent-color)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--card-background)";
        (e.currentTarget as HTMLButtonElement).style.border = "1px solid var(--background-adjacent-color)";
      }}
    >
      <PanelLeftClose size={20} />
    </motion.button>
  );
}
