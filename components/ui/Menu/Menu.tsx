"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsRtl } from "@/hooks/useIsRtl";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import useStore from "@/store/store";
import { auth } from "@/app/lib/firebase";

// --- CONFIG ---
const APP_NAME = "Blueberry Loom";
const APP_ICON = "/icon.webp";
const APP_HREF = "/";
const navOrder = [
  { label: "home", href: "/" },
  { label: "login", href: "/login" },
  { label: "dashboard", href: "/dashboard" },
  { label: "identitycheck", href: "/identity-check" },
  { label: "credit", href: "/credit", external: true },
  { label: "termsofuse", href: "/terms-of-use", external: true },
];

// --- Responsive font size logic ---
const menuTextRanges = [
  { min: 1404, max: 1300, minSize: 2.4, maxSize: 2.8 },
  { min: 1300, max: 1200, minSize: 2.1, maxSize: 2.4 },
  { min: 1200, max: 1100, minSize: 1.8, maxSize: 2.1 },
  { min: 1100, max: 900, minSize: 1.5, maxSize: 1.8 },
  { min: 900, max: 240, minSize: 1, maxSize: 1.5 },
];
const appNameRanges = [
  { min: 400, max: 600, minSize: 0.94, maxSize: 1 },
  { min: 240, max: 400, minSize: 0.6, maxSize: 0.94 },
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

// --- Styled Components ---
const MenuOverlay = styled.div`
  z-index: 100;
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: var(--background);
  color: var(--foreground);
  display: flex;
  flex-direction: column;
`;
const ResponsiveSection = styled.div<{ $isMobile: boolean }>`
  width: 100%;
  box-sizing: border-box;
  padding-left: ${({ $isMobile }) => ($isMobile ? "10px" : "24px")};
  padding-right: ${({ $isMobile }) => ($isMobile ? "10px" : "24px")};
`;
const MenuTopBar = styled(ResponsiveSection)`
  height: 64px;
  min-height: 64px;
  max-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--card-background);
  background: transparent;
  box-sizing: border-box;
  transition: border-color 0.3s ease-in-out;
  &:hover {
    border-color: var(--background-adjacent-color);
  }
`;
const AppLogoRow = styled.a<{ $iconSize: number }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: var(--foreground);
  text-decoration: none;
`;
const AppIconWrapper = styled.div<{ $iconSize: number }>`
  width: ${({ $iconSize }) => $iconSize}px;
  height: ${({ $iconSize }) => $iconSize}px;
  border-radius: var(--general-rounding, 1rem);
  background: var(--foreground);
  border: 1px solid var(--foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 3px;
`;
const AppIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
`;
const AppName = styled.span<{ $hovered: boolean; $fontSize: number }>`
  font-weight: 600;
  font-size: ${({ $fontSize }) => $fontSize}rem;
  color: ${({ $hovered }) => ($hovered ? "var(--theme-color)" : "var(--foreground)")};
  letter-spacing: 0.01em;
  margin-left: 12px;
  margin-right: 22px;
  user-select: none;
  cursor: pointer;
  transition: color 0.3s, font-size 0.3s;
  line-height: 1;
  display: flex;
  align-items: center;
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: color 0.3s ease-in-out, background 0.3s ease-in-out;
  &:hover {
    color: var(--theme-red);
    background: var(--card-background);
  }
`;
const MenuContentSection = styled(ResponsiveSection)`
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding-top: 72px;
  padding-bottom: 72px;
`;
const MenuVerticalRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
  width: 100%;
`;

// --- MenuVertical with RTL/LTR switch ---
const MotionLink = motion.create("a");
const MenuVertical: React.FC<{
  menuItems: typeof navOrder;
  color?: string;
  skew?: number;
  fontSize: number;
  onLoginClick?: () => void;
  onIdentityCheckClick?: () => void;
}> = ({
  menuItems,
  color = "var(--theme-color)",
  skew = 0,
  fontSize,
  onLoginClick,
  onIdentityCheckClick,
}) => {
  const isRtl = useIsRtl();
  const router = useRouter();
  const { t } = useTranslation();
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  return (
    <MenuVerticalRoot>
      {menuItems.map((item) => {
        // Remove href for login and identitycheck
        const isLogin = item.label === "login";
        const isIdentityCheck = item.label === "identitycheck";
        const isExternal = !!item.external;

        return (
          <motion.div
            key={item.href}
            className="group/nav flex items-center gap-2 cursor-pointer"
            initial="initial"
            whileHover="hover"
            style={{
              flexDirection: isRtl ? "row-reverse" : "row",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Arrow (RTL: left, LTR: right) */}
            <motion.div
              variants={{
                initial: {
                  x: isRtl ? "100%" : "-100%",
                  color: "inherit",
                  opacity: 0,
                },
                hover: { x: 0, color, opacity: 1 },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="z-0"
              style={
                isRtl
                  ? { marginLeft: 8, transform: "scaleX(-1)" }
                  : { marginRight: 8 }
              }
            >
              <Arrow strokeWidth={3} className="size-10" />
            </motion.div>
            {/* Centered Link */}
            <MotionLink
              {...(isExternal
                ? {
                    href: item.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : !isLogin && !isIdentityCheck
                ? { href: item.href }
                : {})}
              variants={{
                initial: { x: isRtl ? 40 : -40, color: "inherit" },
                hover: { x: 0, color, skewX: skew },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="font-semibold no-underline"
              tabIndex={0}
              style={{
                order: 1,
                fontSize: `${fontSize}rem`,
                textAlign: "center",
                flex: "0 1 auto",
                minWidth: "0",
                width: "auto",
                lineHeight: 1.1,
              }}
              onClick={e => {
                if (isExternal) return; // let browser handle
                e.preventDefault();
                if (isLogin && typeof onLoginClick === "function") {
                  onLoginClick();
                } else if (isIdentityCheck && typeof onIdentityCheckClick === "function") {
                  onIdentityCheckClick();
                } else {
                  router.push(item.href);
                }
              }}
            >
              {t(item.label)}
            </MotionLink>
          </motion.div>
        );
      })}
    </MenuVerticalRoot>
  );
};

// --- Main Menu Overlay ---
interface MenuProps {
  open: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
  onIdentityCheckClick?: () => void;
}

export const Menu: React.FC<MenuProps> = ({
  open,
  onClose,
  onLoginClick,
  onIdentityCheckClick,
}) => {
  const isRtl = useIsRtl();
  const isMobile = useIsMobileText();
  const router = useRouter();
  const { t } = useTranslation();
  const { masterKey, iterations, isLoggedIn } = useStore();

  // Get Firebase user if available (client-side only)
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const userEmail = user?.email || "";

  // Helper: Check if the master key is valid (length 272, not null/undefined)
  const isMasterKeyValid = () => {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  };

  // Check all conditions for being logged in
  const isAuthenticated =
    userEmail && isMasterKeyValid() && iterations > 0 && isLoggedIn;

  // Responsive font size for app name and menu items
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [appHovered, setAppHovered] = useState(false);
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuFontSize = getInterpolatedSize(windowWidth, menuTextRanges);
  const appNameFontSize = getInterpolatedSize(windowWidth, appNameRanges);
  const iconSize = 28;

  if (!open) return null;

  // --- Only change: remove first two menu items if authenticated ---
  const menuItems = isAuthenticated ? navOrder.slice(2) : navOrder;

  return (
    <MenuOverlay>
      <MenuTopBar $isMobile={isMobile}>
        <AppLogoRow
          $iconSize={iconSize}
          href={APP_HREF}
          tabIndex={0}
          onClick={e => {
            e.preventDefault();
            router.push(APP_HREF);
          }}
          onMouseEnter={() => setAppHovered(true)}
          onMouseLeave={() => setAppHovered(false)}
        >
          <AppIconWrapper $iconSize={iconSize}>
            <AppIcon src={APP_ICON} alt="Logo" draggable={false} />
          </AppIconWrapper>
          <AppName $hovered={appHovered} $fontSize={appNameFontSize}>
            {APP_NAME}
          </AppName>
        </AppLogoRow>
        <CloseButton
          onClick={onClose}
          aria-label={t("close")}
          tabIndex={0}
          title={t("close")}
        >
          <X size={32} />
        </CloseButton>
      </MenuTopBar>
      <MenuContentSection $isMobile={isMobile}>
        <MenuVertical
          menuItems={menuItems}
          color="var(--theme-color)"
          skew={isRtl ? -7 : 7}
          fontSize={menuFontSize}
          onLoginClick={onLoginClick}
          onIdentityCheckClick={onIdentityCheckClick}
        />
      </MenuContentSection>
    </MenuOverlay>
  );
};
