import React, { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PanelRightClose } from "lucide-react";

function getXPadding(width: number) {
  const minW = 320, maxW = 480;
  if (width <= minW) return "1rem";
  if (width >= maxW) return "1.6rem";
  const padding = 1 + ((width - minW) * (1.6 - 1)) / (maxW - minW);
  return `${padding}rem`;
}

interface Props {
  title: string;
  collapsed: boolean;
  titleBlurred: boolean;
  setCollapsed: (v: boolean) => void;
}

const OverlayHeader = forwardRef<HTMLDivElement, Props>(
  ({ title, collapsed, setCollapsed, titleBlurred }, ref) => {
    const [hovered, setHovered] = useState(false);
    const [xPadding, setXPadding] = useState(() =>
      getXPadding(typeof window !== "undefined" ? window.innerWidth : 480)
    );

    useEffect(() => {
      function handleResize() {
        setXPadding(getXPadding(window.innerWidth));
      }
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <div
        ref={ref}
        style={{
          display: "flex",
          alignItems: "center",
          height: 56,
          padding: `0 ${xPadding}`,
          borderBottom: "1px solid var(--background-adjacent-color)",
          background: "var(--card-background)",
          flexShrink: 0,
          justifyContent: "space-between",
          transition: "background 0.2s, border 0.2s",
          position: "relative",
        }}
      >
        <motion.span
          style={{
            color: "var(--foreground)",
            fontWeight: 700,
            fontSize: "1.18rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            pointerEvents: "auto",
          }}
          initial={false}
          animate={
            titleBlurred
              ? { opacity: 0, filter: "blur(12px)" }
              : { opacity: 1, filter: "blur(0px)" }
          }
          transition={{ duration: 0.32, ease: "easeInOut" }}
        >
          {title}
        </motion.span>
        <motion.button
          data-foldicon
          aria-label="Hide editor"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            borderRadius: "50%",
            border: hovered
              ? "1px solid var(--subtle-color)"
              : "1px solid var(--lightened-background-adjacent-color)",
            background: hovered
              ? "var(--second-degree-lightened-background-adjacent-color)"
              : "var(--background-adjacent-color)",
            color: "var(--foreground)",
            padding: 7,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginLeft: 8,
            transition: "background 0.3s ease-in-out, border 0.3s ease-in-out, transform 0.3s",
            boxShadow: "none",
            transform: "translateX(0px)",
          }}
          initial={false}
          animate={
            titleBlurred
              ? { opacity: 0, filter: "blur(12px)" }
              : { opacity: 1, filter: "blur(0px)" }
          }
          transition={{ duration: 0.32, ease: "easeInOut" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PanelRightClose size={20} />
          </span>
        </motion.button>
      </div>
    );
  }
);

export default OverlayHeader;