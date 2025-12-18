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

  const [justOpenSourceLogoLoaded, setJustOpenSourceLogoLoaded] = useState(false);
  const [verifiedToolsLogoLoaded, setVerifiedToolsLogoLoaded] = useState(false);
  const [twelveToolsLogoLoaded, setTwelveToolsLogoLoaded] = useState(false);
  const [auraPlusPlusLogoLoaded, setAuraPlusPlusLogoLoaded] = useState(false);
  const [launchItLogoLoaded, setLaunchItLogoLoaded] = useState(false);
  const [founderListLogoLoaded, setFounderListLogoLoaded] = useState(false);
  const [turbo0LogoLoaded, setTurbo0LogoLoaded] = useState(false);

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
            href="https://nuxt.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nuxt
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
      <div
        style={{
          position: "relative",
          width: 240,
          height: "auto",
        }}
      >
        {/* Faint background logo for JustOpenSource */}
        <img
          src="https://justopensource.xyz/logo.png"
          alt="Background Logo"
          onLoad={() => setJustOpenSourceLogoLoaded(true)}
          onError={() => setJustOpenSourceLogoLoaded(false)}
          style={{
            display: justOpenSourceLogoLoaded ? "block" : "none",
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 0,
            width: 160,
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* JustOpenSource badge – independent */}
          {justOpenSourceLogoLoaded && (
            <a
              href="https://justopensource.xyz/tools/Northstrix-blueberry-loom"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: 240,
                padding: 10,
                border: "2px solid oklch(0.685 0.169 237.323)",
                borderRadius: 8,
                boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px",
                textDecoration: "none",
                backgroundColor: "white",
                transition: "background-color 0.3s",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <img
                  src="https://justopensource.xyz/logo.png"
                  alt="JustOpenSource"
                  style={{ width: 80 }}
                  draggable={false}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    setJustOpenSourceLogoLoaded(false);
                  }}
                />
                <p
                  style={{
                    fontSize: "1.125rem",
                    color: "#4b5563",
                    margin: "4px 0 0",
                    fontWeight: 400,
                  }}
                >
                  Tool Of The Week
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={48}
                height={48}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#facc15"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-trophy-icon lucide-trophy"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
              </svg>
            </a>
          )}
        </div>
        
      </div>
      <div style={{ position: "relative", width: 240, height: "auto" }}>
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <a
            href={verifiedToolsLogoLoaded ? "https://www.verifiedtools.info" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 240,
              padding: 4,
              textDecoration: "none",
              pointerEvents: verifiedToolsLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://www.verifiedtools.info/badge.png"
              {...(verifiedToolsLogoLoaded
                ? { alt: "Verified on Verified Tools" }
                : { alt: "" })}
              width={200}
              height={54}
              loading="lazy"
              onLoad={() => setVerifiedToolsLogoLoaded(true)}
              onError={() => setVerifiedToolsLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: verifiedToolsLogoLoaded ? 1 : 0.01,
                height: verifiedToolsLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>
        </div>
      </div>
      {/* Foundrlist badge */}
      <div>
        <a
          href={
            founderListLogoLoaded
              ? "https://www.foundrlist.com/product/blueberryloom"
              : undefined
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            width: 240,
            padding: 4,
            textDecoration: "none",
            pointerEvents: founderListLogoLoaded ? "auto" : "none",
          }}
        >
          <img
            src="https://www.foundrlist.com/api/badge/blueberryloom?style=featured"
            alt={founderListLogoLoaded ? "Blueberry Loom on Foundrlist" : ""}
            width={200}
            height={64}
            loading="lazy"
            onLoad={() => setFounderListLogoLoaded(true)}
            onError={() => setFounderListLogoLoaded(false)}
            style={{
              borderRadius: 6,
              opacity: founderListLogoLoaded ? 1 : 0.01,
              height: founderListLogoLoaded ? 64 : 1,
              transition: "opacity 0.2s ease-out",
            }}
          />
        </a>
      </div>

      {isMobile && (
        <>
          {/* LaunchIt badge */}
          <a
            href={
              launchItLogoLoaded
                ? "https://launchit.site/launches/blueberry-loom"
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 258,
              padding: 4,
              textDecoration: "none",
              pointerEvents: launchItLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://launchit.site/badges/featured-light-v2.svg"
              alt={launchItLogoLoaded ? "Blueberry Loom - Featured on LaunchIt" : ""}
              width={250}
              height={54}
              loading="lazy"
              onLoad={() => setLaunchItLogoLoaded(true)}
              onError={() => setLaunchItLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: launchItLogoLoaded ? 1 : 0.01,
                height: launchItLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>

          {/* Aura++ badge */}
          <a
            href={auraPlusPlusLogoLoaded ? "https://auraplusplus.com/projects/blueberry-loom" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 240,
              padding: 4,
              textDecoration: "none",
              pointerEvents: auraPlusPlusLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://auraplusplus.com/images/badges/featured-on-dark.svg"
              alt={auraPlusPlusLogoLoaded ? "Featured on Aura++" : ""}
              width={200}
              height={54}
              loading="lazy"
              onLoad={() => setAuraPlusPlusLogoLoaded(true)}
              onError={() => setAuraPlusPlusLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: auraPlusPlusLogoLoaded ? 1 : 0.01,
                height: auraPlusPlusLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>

          {/* Twelve Tools badge */}
          <a
            href={twelveToolsLogoLoaded ? "https://twelve.tools" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 240,
              padding: 4,
              textDecoration: "none",
              pointerEvents: twelveToolsLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://twelve.tools/badge0-white.svg"
              alt={twelveToolsLogoLoaded ? "Featured on Twelve Tools" : ""}
              width={200}
              height={54}
              loading="lazy"
              onLoad={() => setTwelveToolsLogoLoaded(true)}
              onError={() => setTwelveToolsLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: twelveToolsLogoLoaded ? 1 : 0.01,
                height: twelveToolsLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>

          {/* Turbo0 badge */}
          <div>
            <a
              href={
                turbo0LogoLoaded
                  ? "https://turbo0.com/item/blueberry-loom"
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: 240,
                padding: 4,
                textDecoration: "none",
                pointerEvents: turbo0LogoLoaded ? "auto" : "none",
              }}
            >
              <img
                src="https://img.turbo0.com/badge-listed-dark.svg"
                alt={turbo0LogoLoaded ? "Listed on Turbo0" : ""}
                loading="lazy"
                onLoad={() => setTurbo0LogoLoaded(true)}
                onError={() => setTurbo0LogoLoaded(false)}
                style={{
                  borderRadius: 6,
                  height: turbo0LogoLoaded ? 54 : 1,
                  width: "auto",
                  opacity: turbo0LogoLoaded ? 1 : 0.01,
                  transition: "opacity 0.2s ease-out",
                }}
              />
            </a>
          </div>
        </>
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
      {!isMobile && (
        <>
          {/* LaunchIt badge */}
          <a
            href={
              launchItLogoLoaded
                ? "https://launchit.site/launches/blueberry-loom"
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 258,
              padding: 4,
              textDecoration: "none",
              pointerEvents: launchItLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://launchit.site/badges/featured-light-v2.svg"
              alt={launchItLogoLoaded ? "Blueberry Loom - Featured on LaunchIt" : ""}
              width={250}
              height={54}
              loading="lazy"
              onLoad={() => setLaunchItLogoLoaded(true)}
              onError={() => setLaunchItLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: launchItLogoLoaded ? 1 : 0.01,
                height: launchItLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>

          {/* Aura++ badge */}
          <a
            href={auraPlusPlusLogoLoaded ? "https://auraplusplus.com/projects/blueberry-loom" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 240,
              padding: 4,
              textDecoration: "none",
              pointerEvents: auraPlusPlusLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://auraplusplus.com/images/badges/featured-on-dark.svg"
              alt={auraPlusPlusLogoLoaded ? "Featured on Aura++" : ""}
              width={200}
              height={54}
              loading="lazy"
              onLoad={() => setAuraPlusPlusLogoLoaded(true)}
              onError={() => setAuraPlusPlusLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: auraPlusPlusLogoLoaded ? 1 : 0.01,
                height: auraPlusPlusLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>

          {/* Twelve Tools badge */}
          <a
            href={twelveToolsLogoLoaded ? "https://twelve.tools" : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              width: 240,
              padding: 4,
              textDecoration: "none",
              pointerEvents: twelveToolsLogoLoaded ? "auto" : "none",
            }}
          >
            <img
              src="https://twelve.tools/badge0-white.svg"
              alt={twelveToolsLogoLoaded ? "Featured on Twelve Tools" : ""}
              width={200}
              height={54}
              loading="lazy"
              onLoad={() => setTwelveToolsLogoLoaded(true)}
              onError={() => setTwelveToolsLogoLoaded(false)}
              style={{
                borderRadius: 6,
                opacity: twelveToolsLogoLoaded ? 1 : 0.01,
                height: twelveToolsLogoLoaded ? "auto" : "1px",
                transition: "opacity 0.2s ease-out",
              }}
            />
          </a>

          {/* Turbo0 badge */}
          <div>
            <a
              href={
                turbo0LogoLoaded
                  ? "https://turbo0.com/item/blueberry-loom"
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: 240,
                padding: 4,
                textDecoration: "none",
                pointerEvents: turbo0LogoLoaded ? "auto" : "none",
              }}
            >
              <img
                src="https://img.turbo0.com/badge-listed-dark.svg"
                alt={turbo0LogoLoaded ? "Listed on Turbo0" : ""}
                loading="lazy"
                onLoad={() => setTurbo0LogoLoaded(true)}
                onError={() => setTurbo0LogoLoaded(false)}
                style={{
                  borderRadius: 6,
                  height: turbo0LogoLoaded ? 54 : 1,
                  width: "auto",
                  opacity: turbo0LogoLoaded ? 1 : 0.01,
                  transition: "opacity 0.2s ease-out",
                }}
              />
            </a>
          </div>
        </>
      )}
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
  position: relative;
  z-index: 10;
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 16px; /* Add space between icon and first badge */
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