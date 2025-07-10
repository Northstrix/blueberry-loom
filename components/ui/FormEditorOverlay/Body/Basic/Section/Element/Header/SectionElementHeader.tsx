"use client";
import React from "react";
import { X } from "lucide-react";

interface Props {
  label: string;
  onRemove: () => void;
  ariaLabel: string;
}

export default function SectionElementHeader({ label, onRemove, ariaLabel }: Props) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        width: "100%",
      }}
    >
      <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{label}</span>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onRemove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `1px solid ${hovered
            ? "var(--second-degree-lightened-background-adjacent-color)"
            : "var(--lightened-background-adjacent-color)"}`,
          background: hovered ? "var(--background)" : "var(--card-background)",
          color: "var(--foreground)",
          borderRadius: "50%",
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginLeft: 8,
          transition: "background 0.2s, border 0.2s",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
