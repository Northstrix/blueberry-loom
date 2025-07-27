"use client";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { Tranquiluxe } from "./Tranquiluxe";
import Card from "@/components/ui/PlayingCard/PlayingCard";
import { useIsRtl } from "@/hooks/useIsRtl";
import { useTranslation } from "react-i18next";
import { AnimatedTooltip } from "@/components/ui/WrapperMadeFromAnimatedTooltip/AnimatedTooltip";
import LanguageIcon from "@/components/ui/LanguageIcon/LanguageIcon";
import LanguageSelector, { LanguageSelectorHandle } from "@/components/ui/LanguageSelector/LanguageSelector";

// --- Responsive font size hook ---
function useResponsiveFontSize() {
  const [fontSize, setFontSize] = useState("100%");
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      let percent = 100;
      if (w >= 1279) {
        percent = 100;
      } else if (w >= 900) {
        percent = 80 + ((w - 900) * (20 / 379));
      } else if (w >= 240) {
        percent = 60 + ((w - 240) * (60 / 659));
      } else {
        percent = 60;
      }
      setFontSize(`${percent}%`);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return fontSize;
}

// --- CONFIG ---
const APP_NAME = "Blueberry Loom";
const APP_ICON = "/icon.webp";
const CARD_IMAGE = "/icon.webp";
const CARD_TEXT = ["啟", "蒙"];
const CARD_LINK_URL = "https://maxim-bortnikov.netlify.app/";
const navOrder = [
  { label: "home", href: "/" },
  { label: "login", href: "/login" },
  { label: "dashboard", href: "/dashboard" },
  { label: "identitycheck", href: "/identity-check" },
  { label: "credit", href: "/credit", external: true },
  { label: "termsofuse", href: "/terms-of-use", external: true },
];

interface FooterProps {
  overlayColor?: string;
  textColor?: string;
  backgroundColor?: string;
  accentColor?: [number, number, number];
  style?: React.CSSProperties;
  onLoginClick?: () => void;
  onIdentityCheckClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  overlayColor = "rgba(0,0,0,0)",
  textColor = "var(--foreground)",
  backgroundColor = "var(--theme-color)",
  accentColor = [0, 0.6275, 0.8471],
  style,
  onLoginClick,
  onIdentityCheckClick,
}) => {
  const isRtl = useIsRtl();
  const router = useRouter();
  const fontSize = useResponsiveFontSize();
  const { t } = useTranslation();

  // --- Language Icon Tooltip State ---
  const [showLanguageTooltip, setShowLanguageTooltip] = useState(false);

  // --- Responsive column height logic ---
  const appSectionRef = useRef<HTMLDivElement>(null);
  const navSectionRef = useRef<HTMLDivElement>(null);
  const [firstColMinHeight, setFirstColMinHeight] = useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  // LanguageSelector modal ref
  const languageSelectorRef = useRef<LanguageSelectorHandle>(null);

  // --- Responsive measurement effect ---
  useEffect(() => {
    function measureHeights() {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile && navSectionRef.current) {
        setFirstColMinHeight(navSectionRef.current.offsetHeight);
      } else {
        setFirstColMinHeight(undefined);
      }
    }
    measureHeights();
    window.addEventListener("resize", measureHeights);
    return () => window.removeEventListener("resize", measureHeights);
  }, []);

  // --- Tooltip items ---
  const languageTooltipItems = [
    {
      id: 0,
      name: "Language",
      icon: <LanguageIcon width={56} />,
      onClick: () => {
        languageSelectorRef.current?.open();
      },
    },
  ];

  // --- App info section with Language Icon Tooltip ---
  const appSection = (
    <FooterCol
      className="footer-section"
      key="app"
      ref={appSectionRef}
      style={{
        position: "relative",
        minHeight: firstColMinHeight ? `${firstColMinHeight}px` : undefined,
      }}
    >
      <AppLink
        href="/"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      >
        <AppRow>
          {isRtl && <AppName className="footer-appname">{APP_NAME}</AppName>}
          <AppIconWrapper className="footer-appicon">
            <img src={APP_ICON} alt="Logo" draggable={false} />
          </AppIconWrapper>
          {!isRtl && <AppName className="footer-appname">{APP_NAME}</AppName>}
        </AppRow>
      </AppLink>
      <MadeByBlock>
        <span>
          Made by{" "}
          <MadeByLink
            href="https://maxim-bortnikov.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Maxim Bortnikov
          </MadeByLink>
        </span>
        <span>
          using{" "}
          <MadeByLink
            href="https://nextjs.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js
          </MadeByLink>,{" "}
          <MadeByLink
            href="https://vuejs.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vue.js
          </MadeByLink>,{" "}
          and{" "}
          <MadeByLink
            href="https://www.perplexity.ai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Perplexity
          </MadeByLink>
        </span>
      </MadeByBlock>
      {/* --- Language Icon Tooltip Container --- */}
      {isMobile ? (
        <LanguageIconMobileSpacer>
          <AnimatedTooltip items={languageTooltipItems} isRTL={isRtl} showTooltip={showLanguageTooltip} />
        </LanguageIconMobileSpacer>
      ) : (
        <LanguageIconContainer
          onMouseEnter={() => setShowLanguageTooltip(true)}
          onMouseLeave={() => setShowLanguageTooltip(false)}
        >
          <AnimatedTooltip items={languageTooltipItems} isRTL={isRtl} showTooltip={showLanguageTooltip} />
        </LanguageIconContainer>
      )}
    </FooterCol>
  );

  // --- Navigation section (INTERNATIONALIZED) ---
  const navSection = (
    <FooterCol className="footer-section" key="nav" ref={navSectionRef}>
      <NavTitle>{t("navigation")}</NavTitle>
      <NavLinks>
        {navOrder.map((link) =>
          link.external ? (
            <NavLink
              key={link.href}
              as="a"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
            >
              {t(link.label)}
            </NavLink>
          ) : link.label === "login" ? (
            <NavLink
              key={link.label}
              as="button"
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                if (onLoginClick) onLoginClick();
              }}
            >
              {t(link.label)}
            </NavLink>
          ) : link.label === "identitycheck" ? (
            <NavLink
              key={link.label}
              as="button"
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                if (onIdentityCheckClick) onIdentityCheckClick();
              }}
            >
              {t(link.label)}
            </NavLink>
          ) : (
            <NavLink
              key={link.href}
              as="a"
              href={link.href}
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                router.push(link.href);
              }}
            >
              {t(link.label)}
            </NavLink>
          )
        )}
      </NavLinks>
    </FooterCol>
  );

  // --- Card section ---
  const cardSection = (
    <FooterCol className="footer-section" key="card">
      <CardContainer>
        <div style={{ maxWidth: 396, width: "100%", margin: "0 auto" }}>
          <Card
            componentWidth="100%"
            aspectRatio="3/4"
            outerRounding="18.2px"
            innerRounding="18px"
            backgroundColor="#fff"
            hoveredBackgroundColor="var(--foreground)"
            imageHeightPercentage={60}
            imageSrc={CARD_IMAGE}
            imageAlt={APP_NAME}
            outlineColor="var(--slightly-subtle-foreground)"
            hoverOutlineColor="var(--lightened-background-adjacent-color)"
            textArray={CARD_TEXT}
            minWidth={200}
            maxWidth={600}
            minTextSize={20}
            maxTextSize={28}
            verticalPadding="20px"
            horizontalPadding="20px"
            manualLetterSpacing={1}
            componentId="footer-card"
            onCardClicked={() =>
              window.open(CARD_LINK_URL, "_blank", "noopener,noreferrer")
            }
            textColor="var(--theme-color)"
            hoverTextColor="var(--foreground)"
            transitionDuration={320}
            transitionDelay={0}
          />
        </div>
      </CardContainer>
    </FooterCol>
  );

  // For desktop, swap first and third columns for RTL
  const columnsDesktop = [appSection, navSection, cardSection];

  return (
    <>
      <FooterOuter
        style={{
          background: backgroundColor,
          color: textColor,
          fontSize,
          ...style,
        }}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Tranquiluxe color={accentColor} />
        <Overlay style={{ background: overlayColor }} />
        <TopBottomSpace />
        <ContentContainer>
          <FooterContent $isRtl={isRtl}>
            {columnsDesktop.map((col, i) => (
              <React.Fragment key={i}>{col}</React.Fragment>
            ))}
          </FooterContent>
        </ContentContainer>
        <TopBottomSpace />
      </FooterOuter>
      {/* Language Selector Modal */}
      <LanguageSelector ref={languageSelectorRef} />
    </>
  );
};

export default Footer;

// --- STYLED COMPONENTS ---
const FooterOuter = styled.footer`
  width: 100%;
  position: relative;
  min-height: 500px;
  overflow: hidden;
  font-family: inherit;
`;
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
`;
const TopBottomSpace = styled.div`
  height: 72px;
`;
const ContentContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 500px;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  padding: 0 16px;
  box-sizing: border-box;
`;
const FooterContent = styled.div<{ $isRtl: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 36px;
  justify-content: center;
  align-items: flex-start;
  font-weight: bold;
  user-select: none;
  @media (max-width: 900px) {
    flex-direction: column !important;
    align-items: center;
    justify-content: center;
    gap: 60px;
    padding-top: 0;
    padding-bottom: 0;
  }
`;
const FooterCol = styled.div`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  text-align: center;
  position: relative;
  @media (max-width: 900px) {
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 18px;
    height: auto;
    min-height: unset !important;
  }
`;
const AppLink = styled.a`
  display: inline-block;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  &:hover {
    .footer-appicon {
      border-color: var(--subtle-color);
      transition: border-color 0.3s ease-in-out;
    }
    .footer-appname {
      color: var(--background);
      transition: color 0.3s ease-in-out;
    }
  }
`;
const AppRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.1em;
  margin-bottom: 0.4em;
  justify-content: center;
`;
const AppIconWrapper = styled.div`
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--general-rounding, 1rem);
  background: var(--foreground);
  border: 1px solid var(--foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
  padding: 2px;
  transition: border-color 0.3s ease-in-out;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
  }
`;
const AppName = styled.div`
  font-size: 1.23rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  color: inherit;
  margin-top: 2px;
  transition: color 0.3s ease-in-out;
`;
const MadeByBlock = styled.div`
  font-size: 0.98rem;
  font-weight: bold;
  color: inherit;
  line-height: 1.5;
  opacity: 0.93;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25em;
  span {
    white-space: pre-line;
  }
  @media (max-width: 900px) {
    font-size: 0.93rem;
    margin-top: 12px;
  }
`;
const MadeByLink = styled.a`
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: bold;
  transition: color 0.3s ease-in-out;
  &:hover {
    color: var(--background);
  }
`;
const CardContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  /* Do not affect Card or its container on mobile! */
`;
const NavTitle = styled.div`
  font-size: 1.23rem;
  font-weight: bold;
  margin-bottom: 8px;
  letter-spacing: 0.04em;
  color: inherit;
`;
const NavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
`;
const NavLink = styled.a`
  font-size: 1rem;
  font-weight: bold;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: color 0.3s ease-in-out;
  &:hover {
    color: var(--background);
  }
  &:focus {
    outline: none;
  }
`;
// --- Language Icon Container (desktop: absolute at bottom, mobile: margin-top) ---
const LanguageIconContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  z-index: 10;
  width: auto;
  display: flex;
  justify-content: center;
  pointer-events: auto;
  @media (max-width: 900px) {
    display: none;
  }
`;
const LanguageIconMobileSpacer = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: 56px;
    z-index: 10;
  }
`;
