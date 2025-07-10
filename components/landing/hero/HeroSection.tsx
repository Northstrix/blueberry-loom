"use client";
import React, { useState, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { useTranslation } from "react-i18next";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import TextSwap from "@/components/ui/TextSwap/TextSwap";
import { useIsRtl } from "@/hooks/useIsRtl";
import ResponderFormInputModal from "@/components/ui/ResponderFormInput/ResponderFormInputModal";

interface Props {
  windowWidth: number;
  onShowLogin: (mode: "signin" | "signup") => void;
  onRespondentFormResolved: (values: { publisherEmail: string; formID: string; decryptionKey: string }) => void;
}

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

const BUTTON_FONT_SIZE = 1.025; // rem

const HeroSection = ({ windowWidth, onShowLogin, onRespondentFormResolved }: Props) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const isRtl = useIsRtl();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIsMobile(windowWidth < 900);
  }, [windowWidth]);

  const heroSize = getInterpolatedSize(windowWidth, heroTextRanges);
  const subSize = getInterpolatedSize(windowWidth, subTextRanges);

  const HERO_SWAP_WORDS = [
    t("hero_word_slider_0"),
    t("hero_word_slider_1"),
    t("hero_word_slider_2"),
    t("hero_word_slider_3"),
    t("hero_word_slider_4"),
  ];

  function handleGetStarted() {
    onShowLogin("signup");
  }

  const buttonFlexDirection = windowWidth >= 800 ? "row" : "column";
  const buttonGap = windowWidth >= 800 ? "24px" : "20px";
  const rtlStyle = isRtl ? { direction: "rtl", unicodeBidi: "plaintext" } : {};
  const shouldSwapButtons = isRtl && !isMobile;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 11,
          pointerEvents: "none",
          backdropFilter: "brightness(0.6)",
          WebkitBackdropFilter: "brightness(0.6)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100%",
          padding: isMobile ? "64px 24px" : "0",
          textAlign: "center",
          position: "relative",
          zIndex: 11,
        }}
      >
        <HeroContentWrapper>
          {/* Hero lines */}
          <div
            style={{
              fontWeight: 700,
              fontSize: `${heroSize}rem`,
              lineHeight: 1.1,
              color: "var(--foreground)",
              marginBottom: "0.18em",
              ...rtlStyle,
            }}
          >
            {t("build_forms_for")}
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: `${heroSize}rem`,
              lineHeight: 1.1,
              color: "var(--foreground)",
              marginBottom: "0.18em",
            }}
          >
            <TextSwap
              texts={HERO_SWAP_WORDS}
              mainClassName="text-foreground px-2 md:px-3 bg-[var(--theme-color)] overflow-hidden py-1 md:py-2 justify-center rounded-lg"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
          <div
            style={{
              fontWeight: isRtl ? 700 : 800,
              fontSize: `${heroSize}rem`,
              lineHeight: 1.1,
              color: "var(--foreground)",
              marginBottom: "0.15em",
              ...rtlStyle,
            }}
          >
            {t("in_minutes")}
          </div>
          <div
            style={{
              color: "var(--slightly-subtle-foreground)",
              margin: `1.2em 0 1.5em 0`,
              fontWeight: 700,
              fontSize: `${subSize}rem`,
              lineHeight: 1.5,
              opacity: 0.92,
              maxWidth: "600px",
              ...rtlStyle,
            }}
          >
            {t("hero_subtext")}
          </div>
          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: buttonGap,
              flexDirection: buttonFlexDirection as any,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "2em",
            }}
          >
            {shouldSwapButtons ? (
              <>
                <a
                  href="https://github.com/Northstrix/blueberry-loom"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 700,
                    fontSize: `${BUTTON_FONT_SIZE}rem`,
                    color: "var(--muted-foreground)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    transition: "color 0.3s",
                    width: windowWidth >= 800 ? "auto" : "100%",
                    textAlign: "center",
                  }}
                >
                  {t("github_inscription")}
                </a>
                <ChronicleButton
                  text={t("get_started")}
                  onClick={handleGetStarted}
                  width={windowWidth >= 800 ? "180px" : "100%"}
                  customBackground="var(--foreground)"
                  customForeground="var(--background)"
                  hoverColor="var(--theme-color)"
                  hoverForeground="var(--foreground)"
                  borderRadius="var(--general-rounding)"
                />
              </>
            ) : (
              <>
                <ChronicleButton
                  text={t("get_started")}
                  onClick={handleGetStarted}
                  width={windowWidth >= 800 ? "180px" : "100%"}
                  customBackground="var(--foreground)"
                  customForeground="var(--background)"
                  hoverColor="var(--theme-color)"
                  hoverForeground="var(--foreground)"
                  borderRadius="var(--general-rounding)"
                />
                <a
                  href="https://github.com/Northstrix/blueberry-loom"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 700,
                    fontSize: `${BUTTON_FONT_SIZE}rem`,
                    color: "var(--muted-foreground)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    transition: "color 0.3s",
                    width: windowWidth >= 800 ? "auto" : "100%",
                    textAlign: "center",
                    ...rtlStyle,
                  }}
                >
                  {t("github_inscription")}
                </a>
              </>
            )}
          </div>
          {/* Shimmer link below buttons */}
          <ShimmerUnderline $nameFont={1.025} $isRtl={isRtl} onClick={() => setModalOpen(true)}>
            {t("responder_form_input_open_link")}
          </ShimmerUnderline>
        </HeroContentWrapper>
        {/* Modal */}
        <ResponderFormInputModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onResolved={values => {
            setModalOpen(false);
            onRespondentFormResolved(values);
          }}
        />
      </div>
    </div>
  );
};

export default HeroSection;

const HeroContentWrapper = styled.div`
  margin: 96px 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const shimmerLTR = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;
const shimmerRTL = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Shimmer underline with LTR/RTL support
const ShimmerUnderline = styled.span<{ $nameFont: number; $isRtl: boolean }>`
  position: relative;
  display: inline-block;
  font-weight: 700;
  font-size: ${({ $nameFont }) => $nameFont}rem;
  color: var(--input-outline);
  cursor: pointer;
  user-select: text;
  outline: none;

  background: ${({ $isRtl }) =>
    $isRtl
      ? "linear-gradient(250deg, var(--input-outline) 30%, var(--foreground) 50%, var(--input-outline) 70%)"
      : "linear-gradient(110deg, var(--input-outline) 30%, var(--foreground) 50%, var(--input-outline) 70%)"};
  background-size: 200% 100%;
  background-position: ${({ $isRtl }) => ($isRtl ? "-200% 0" : "200% 0")};
  animation: ${({ $isRtl }) =>
    $isRtl
      ? css`${shimmerRTL} 3.5s linear infinite`
      : css`${shimmerLTR} 3.5s linear infinite`};

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;

  /* Shimmer underline using ::after, matching direction and animation */
  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 2px;
    background: ${({ $isRtl }) =>
      $isRtl
        ? "linear-gradient(250deg, var(--input-outline) 30%, var(--foreground) 50%, var(--input-outline) 70%)"
        : "linear-gradient(110deg, var(--input-outline) 30%, var(--foreground) 50%, var(--input-outline) 70%)"};
    background-size: 200% 100%;
    background-position: ${({ $isRtl }) => ($isRtl ? "-200% 0" : "200% 0")};
    animation: ${({ $isRtl }) =>
      $isRtl
        ? css`${shimmerRTL} 3.5s linear infinite`
        : css`${shimmerLTR} 3.5s linear infinite`};
    border-radius: 1px;
    pointer-events: none;
    z-index: 1;
  }
`;
