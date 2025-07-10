"use client";
import React from "react";
import { useRouter } from "next/navigation";

export const Logo = ({
  size = "3rem",
  className = "",
}: {
  size?: string | number;
  className?: string;
}) => {
  const router = useRouter();
  return (
    <div
      className={`flex items-center justify-center mx-auto cursor-pointer overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--general-rounding)",
        background: "var(--foreground)",
        border: "1px solid var(--background-adjacent-color)",
        transition: "border-color 0.3s, background 0.3s",
        flexShrink: 0,
        padding: "3px",
        boxSizing: "border-box",
      }}
      onClick={() => router.push("/")}
      tabIndex={0}
    >
      <img
        src="/icon.webp"
        alt="Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
        }}
        draggable={false}
      />
    </div>
  );
};
