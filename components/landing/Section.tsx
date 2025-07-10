"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TextSwap from "@/components/ui/TextSwap/TextSwap";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { useIsRtl } from "@/hooks/useIsRtl";

// Responsive text ranges
const heroTextRanges = [
  { min: 1404, max: 1300, minSize: 3.62, maxSize: 4 },
  { min: 1300, max: 1200, minSize: 3.21, maxSize: 3.6 },
  { min: 1200, max: 1100, minSize: 2.9, maxSize: 3.3 },
  { min: 1100, max: 900, minSize: 2.4, maxSize: 2.76 },
  { min: 900, max: 240, minSize: 1.1, maxSize: 2.6 },
];
const subTextRanges = [
  { min: 1404, max: 1200, minSize: 1.18, maxSize: 1.35 },
  { min: 1200, max: 900, minSize: 1.07, maxSize: 1.18 },
  { min: 900, max: 240, minSize: 0.8, maxSize: 1.35 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function getInterpolatedSize(
  width: number,
  ranges: { min: number; max: number; minSize: number; maxSize: number }[]
) {
  for (const range of ranges) {
    if (width >= range.max && width <= range.min) {
      const t = (width - range.max) / (range.min - range.max);
      return lerp(range.minSize, range.maxSize, t);
    }
  }
  if (width > ranges[0].min) return ranges[0].maxSize;
  return ranges[ranges.length - 1].minSize;
}

interface SectionProps {
  title: string;
  inscription: string;
  children: React.ReactNode;
  windowWidth?: number;
}

const Section: React.FC<SectionProps> = ({
  title,
  inscription,
  children,
  windowWidth,
}) => {
  const isMobile = useIsMobileText();
  const isRtl = useIsRtl();

  // Responsive width (SSR-safe)
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    if (windowWidth !== undefined) {
      setWidth(windowWidth);
      return;
    }
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [windowWidth]);

  const heroSize = getInterpolatedSize(width, heroTextRanges);
  const subSize = getInterpolatedSize(width, subTextRanges);
  const rtlStyle = isRtl ? { direction: "rtl", unicodeBidi: "plaintext" } : {};

  // Always pass [title, title] to TextSwap for flip effect
  const swapWords = [title, title];

  return (
    <SectionOuter>
      <SectionInner
        $isMobile={isMobile}
        dir={isRtl ? "rtl" : "ltr"}
        style={{ textAlign: "center" }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: `${heroSize}rem`,
            lineHeight: 1.1,
            color: "var(--foreground)",
            marginBottom: "0.18em",
            ...rtlStyle,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TextSwap
            texts={swapWords}
            mainClassName="text-foreground px-2 md:px-3 bg-[var(--theme-color)] overflow-hidden py-1 md:py-2 justify-center rounded-lg"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 10, stiffness: 200 }}
            rotationInterval={12000}
          />
        </div>
        <DescriptionText
          $fontSize={subSize}
          style={{
            marginTop: "1.125em",
            marginBottom: "0.65em",
            color: "var(--slightly-subtle-foreground)",
            ...rtlStyle,
          }}
        >
          {inscription}
        </DescriptionText>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </SectionInner>
    </SectionOuter>
  );
};

export default Section;

// --- Styled Components ---
const SectionOuter = styled.section`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const SectionInner = styled.div<{ $isMobile: boolean }>`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding-left: ${({ $isMobile }) => ($isMobile ? "10px" : "24px")};
  padding-right: ${({ $isMobile }) => ($isMobile ? "10px" : "24px")};
  padding-top: ${({ $isMobile }) => ($isMobile ? "36px" : "64px")};
  padding-bottom: ${({ $isMobile }) => ($isMobile ? "36px" : "64px")};
`;

const DescriptionText = styled.div<{ $fontSize: number }>`
  font-size: ${({ $fontSize }) => $fontSize}rem;
  font-weight: 700;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

const ChildrenWrapper = styled.div`
  width: 100%;
  margin-top: 2.7em;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
