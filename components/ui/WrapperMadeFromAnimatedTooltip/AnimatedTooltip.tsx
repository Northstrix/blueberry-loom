"use client";
import React, { useRef } from "react";
import gsap from "gsap";

interface TooltipItem {
  id: number;
  name: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

interface AnimatedTooltipProps {
  items: TooltipItem[];
  isRTL: boolean;
  showTooltip: boolean; // Not used, kept for compatibility
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
  items,
  isRTL,
}) => {
  const size = 72; // px

  // Refs for each tooltip (outer and inner)
  const outerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);

  // GSAP animation handlers
  const handleEnter = (idx: number) => {
    const outer = outerRefs.current[idx];
    const inner = innerRefs.current[idx];
    if (outer && inner) {
      gsap.to(outer, {
        borderColor: "var(--foreground)",
        duration: 0.3,
        ease: "power1.inOut",
      });
      gsap.to(inner, {
        background: "var(--background)",
        color: "var(--first-theme-color)",
        duration: 0.3,
        ease: "power1.inOut",
      });
    }
  };

  const handleLeave = (idx: number) => {
    const outer = outerRefs.current[idx];
    const inner = innerRefs.current[idx];
    if (outer && inner) {
      gsap.to(outer, {
        borderColor: "transparent",
        duration: 0.3,
        ease: "power1.inOut",
      });
      gsap.to(inner, {
        background: "transparent",
        color: "var(--foreground)",
        duration: 0.3,
        ease: "power1.inOut",
      });
    }
  };

  return (
    <>
      <style>{`
        .animated-tooltip-outer {
          display: inline-block;
          border-radius: var(--outer-moderate-rounding);
          padding: 1px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          width: ${size}px;
          height: ${size}px;
          box-sizing: border-box;
          transition: none !important;
        }
        .animated-tooltip-inner {
          width: 100%;
          height: 100%;
          border-radius: var(--moderate-rounding);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--foreground);
          padding: 12px;
          box-sizing: border-box;
          transition: none !important;
        }
      `}</style>
      <div className="flex space-x-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="animated-tooltip-outer group"
            tabIndex={0}
            ref={el => (outerRefs.current[idx] = el)}
            onClick={e => {
              e.stopPropagation();
              item.onClick(e); // Pass the click event to the client
            }}
            onMouseEnter={() => handleEnter(idx)}
            onMouseLeave={() => handleLeave(idx)}
            onFocus={() => handleEnter(idx)}
            onBlur={() => handleLeave(idx)}
          >
            <div
              className="animated-tooltip-inner"
              ref={el => (innerRefs.current[idx] = el)}
            >
              {item.icon}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
