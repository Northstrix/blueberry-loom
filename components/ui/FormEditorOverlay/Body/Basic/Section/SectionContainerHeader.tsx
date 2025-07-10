"use client";
import React from "react";
import SectionAddDropdown, { AddElementOption } from "@/components/ui/FormEditorOverlay/AddElementDropdown/SectionAddDropdown";

interface SectionContainerHeaderProps {
  sectionName: string;
  dropdownOpen: boolean;
  onDropdownToggle: (forceState?: boolean) => void;
  addOptions: AddElementOption[];
  onAddElement: (type: AddElementOption["type"]) => void;
}

export default function SectionContainerHeader({
  sectionName,
  dropdownOpen,
  onDropdownToggle,
  addOptions,
  onAddElement,
}: SectionContainerHeaderProps) {
  return (
    <div style={{
      marginBottom: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <strong style={{ color: "var(--foreground)" }}>{sectionName}</strong>
      <SectionAddDropdown
        open={dropdownOpen}
        onToggle={onDropdownToggle}
        options={addOptions}
        onSelect={onAddElement}
        alignRight
      />
    </div>
  );
}
