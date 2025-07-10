"use client";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { ToastContainer } from "react-toastify";
import { useFavicon } from "react-haiku";
import i18nConf from "@/next-i18next.config.js";
import "react-toastify/dist/ReactToastify.css";
import { useIsRtl } from "@/hooks/useIsRtl";

export default function AppClientProvider({ children }: { children: React.ReactNode }) {
  const { setFavicon } = useFavicon();
  useEffect(() => {
    setFavicon("/icon.webp");
  }, [setFavicon]);

  const isRtl = useIsRtl();

  return (
    <I18nextProvider i18n={i18nConf}>
      {children}
      <ToastContainer
        position={isRtl ? "bottom-left" : "bottom-right"}
        autoClose={5000}
        newestOnTop={false}
        closeOnClick
        rtl={isRtl}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: "var(--card-background)",
          color: "var(--foreground)",
          border: "1px solid var(--background-adjacent-color)",
          borderRadius: "var(--general-rounding)",
        }}
      />
    </I18nextProvider>
  );
}
