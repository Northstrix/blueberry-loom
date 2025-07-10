"use client";
import { useTranslation } from "react-i18next";

export function useIsRtl() {
  const { i18n } = useTranslation();
  return i18n.language === "he"; // Add other RTL languages if needed
}
