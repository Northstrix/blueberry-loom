"use client";
import React, { useEffect, useState, useRef, CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from "next/navigation";
import { IconMenu2 } from "@tabler/icons-react";
import { LogOut } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import LanguageIcon from "@/components/ui/LanguageIcon/LanguageIcon";
import LanguageSelector, { LanguageSelectorHandle } from "@/components/ui/LanguageSelector/LanguageSelector";
import { cn } from "@/lib/utils";
import { useHover } from "react-haiku";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { Menu } from "@/components/ui/Menu/Menu";
import { auth } from "@/app/lib/firebase";
import useStore from "@/store/store";
import { showProcessingModal, showConfirmModal, showClosableErrorModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import { useIsRtl } from "@/hooks/useIsRtl";
import Swal from "sweetalert2";

interface ResizableNavbarProps {
  maxWidth?: number | string;
  sidePadding?: number;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onIdentityCheckClick?: () => void;
}

export function ResizableNavbar({
  maxWidth = 1200,
  sidePadding,
  onLogout,
  onLoginClick,
  onIdentityCheckClick,
}: ResizableNavbarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobileText();
  const { masterKey, iterations, isLoggedIn } = useStore();
  const isRtl = useIsRtl();
  const { setLoginData, setIsLoggedIn } = useStore();

  // --- Auth logic (from your FormsSection) ---
  function isMasterKeyValid() {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  }
  function getAuthStatus() {
    const user = typeof window !== "undefined" ? auth.currentUser : null;
    const userEmail = user?.email || "";
    return Boolean(userEmail && isMasterKeyValid() && iterations > 0 && isLoggedIn);
  }
  const [authenticated, setAuthenticated] = useState(getAuthStatus());
  useEffect(() => {
    setAuthenticated(getAuthStatus());
    const unsub = auth.onAuthStateChanged(() => setAuthenticated(getAuthStatus()));
    return unsub;
  }, [pathname, masterKey, iterations, isLoggedIn]);

  // Responsive font size for app name and login button visibility
  const [isTiny, setIsTiny] = useState(false);
  const [isSuperTiny, setIsSuperTiny] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [iconSize, setIconSize] = useState(28);
  useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth;
      setIsSuperTiny(w <= 320);
      setIsTiny(w < 400);
      setShowLogin(w >= 600);
      if (w < 400) setIconSize(24);
      else if (w < 500) setIconSize(26);
      else setIconSize(28);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll detection for background/outline
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest: number) => {
    setVisible(latest > 2);
  });

  // Hover states
  const [langHovered, setLangHovered] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [appHovered, setAppHovered] = useState(false);
  const [navbarHovered, setNavbarHovered] = useState(false);

  // LanguageSelector modal ref
  const languageSelectorRef = useRef<LanguageSelectorHandle>(null);

  // --- Menu overlay state ---
  const [menuOpen, setMenuOpen] = useState(false);

  // App name style
  const appNameStyle: CSSProperties = {
    fontWeight: 600,
    fontSize: isSuperTiny ? "0.78rem" : isTiny ? "0.86rem" : isMobile ? "0.94rem" : "1.06rem",
    color: appHovered ? "var(--theme-color)" : "var(--foreground)",
    letterSpacing: "0.01em",
    marginLeft: 12,
    marginRight: 22,
    userSelect: "none" as CSSProperties["userSelect"],
    cursor: "pointer",
    transition: "color 0.3s, font-size 0.3s",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  };

  // Language icon background: always iconSize + 12 (6px extra each side)
  const langBgWidth = iconSize + 12;
  const iconContainerHeight = 36;

  // Border color logic for navbar
  const navbarBorder = visible
    ? navbarHovered
      ? "1px solid var(--second-degree-lightened-background-adjacent-color)"
      : "1px solid var(--lightened-background-adjacent-color)"
    : "1px solid transparent";

  // Responsive margin based on isMobile
  const sideMargin = typeof sidePadding === "number" ? sidePadding : isMobile ? 10 : 24;

  // --- Logout logic with modals ---
  const handleLogout = async () => {
    const confirmed = await showConfirmModal({
      title: t("log-out-the-verb"),
      message: `<p">${t("log-out-confirm-line")}</p>`,
      confirmText: t("yes") || "Yes",
      cancelText: t("no") || "No",
      isRtl,
    });
    if (!confirmed) return;
    const processingMessage = `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`;
    showProcessingModal(t("logging-out"), processingMessage);
    try {
      await new Promise((r) => setTimeout(r, 100));
      await auth.signOut();
      const masterKey1 = new Uint8Array(272);
      window.crypto.getRandomValues(masterKey1);
      const iterations1 = Math.floor(Math.random() * 10000) + 1;
      setLoginData(masterKey1, iterations1);
      setIsLoggedIn(false);
      Swal.close();
      if (typeof onLogout === "function") onLogout();
    } catch (error) {
      console.error("Error:", error);
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('log-out-failed')}</p>
        <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('check_the_console')}</p>`
      );
    }
  };

  // --- NavbarButton ---
  type AnchorButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: "a";
    href: string;
    children: React.ReactNode;
    className?: string;
    variant?: string;
  };
  type RealButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as: "button";
    href?: undefined;
    children: React.ReactNode;
    className?: string;
    variant?: string;
  };
  type NavbarButtonProps = AnchorButtonProps | RealButtonProps;
  const NavbarButton = React.forwardRef<HTMLAnchorElement | HTMLButtonElement, NavbarButtonProps>(
    function NavbarButton(props, ref) {
      const { hovered, ref: hoverRef } = useHover();
      const { as = "a", children, className, variant = "primary", ...rest } = props;
      const baseStyles =
        "px-4 py-2 rounded-md text-sm font-bold relative cursor-pointer inline-block text-center";
      function setRefs(el: any) {
        if (typeof hoverRef === "function") hoverRef(el);
        else if (hoverRef) (hoverRef as React.MutableRefObject<any>).current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<any>).current = el;
      }
      const style = {
        background: hovered ? "var(--theme-color)" : "var(--foreground)",
        color: hovered ? "var(--foreground)" : "var(--background)",
        border: "none",
        fontWeight: 700,
        transition: "background 0.3s, color 0.3s",
      };
      if (as === "button") {
        return (
          <button ref={setRefs} className={cn(baseStyles, className)} style={style} type="button" {...rest}>
            {children}
          </button>
        );
      }
      return (
        <a ref={setRefs} className={cn(baseStyles, className)} style={style} {...rest}>
          {children}
        </a>
      );
    }
  );

  return (
    <>
      <motion.div
        ref={ref}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          maxWidth: "100vw",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{
            backdropFilter: visible ? "blur(10px)" : "none",
            background: visible
              ? "var(--card-background, rgba(255,255,255,0.82))"
              : "transparent",
            boxShadow: visible
              ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
              : "none",
            border: navbarBorder,
            y: visible ? 28 : 0,
            paddingLeft: visible ? 24 : 0,
            paddingRight: visible ? 24 : 0,
            marginLeft: sideMargin,
            marginRight: sideMargin,
          }}
          transition={{
            type: "tween",
            duration: 0.2,
            ease: "easeInOut",
          }}
          style={{
            width: "100%",
            maxWidth,
            borderRadius: "var(--general-rounding)",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 0,
            marginBottom: 0,
            pointerEvents: "auto",
            backgroundClip: "padding-box",
            boxSizing: "border-box",
            transition:
              "padding 0.2s cubic-bezier(.4,0,.2,1), margin 0.2s cubic-bezier(.4,0,.2,1), border 0.3s, box-shadow 0.3s",
          }}
          className="relative z-[60] mx-auto flex-row items-center justify-between self-start bg-transparent"
          onMouseEnter={() => setNavbarHovered(true)}
          onMouseLeave={() => setNavbarHovered(false)}
        >
          {/* Left: Logo + App name */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              router.push("/");
            }}
            className="flex items-center group"
            onMouseEnter={() => setAppHovered(true)}
            onMouseLeave={() => setAppHovered(false)}
            tabIndex={0}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                width: iconSize,
                height: iconSize,
                borderRadius: "var(--general-rounding)",
                background: "var(--foreground)",
                cursor: "pointer",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                padding: 3,
                boxSizing: "border-box",
              }}
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
            <span style={appNameStyle}>Blueberry Loom</span>
          </a>
          {/* Right: Language, Menu, Button */}
          <div className="flex items-center gap-4">
            {/* Language icon container */}
            <div
              style={{
                width: langBgWidth,
                height: iconContainerHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.3s",
                background: langHovered ? "var(--theme-color)" : "transparent",
                borderRadius: "var(--general-rounding)",
              }}
              onMouseEnter={() => setLangHovered(true)}
              onMouseLeave={() => setLangHovered(false)}
              onClick={() => languageSelectorRef.current?.open()}
              tabIndex={0}
              aria-label="Change language"
            >
              <div
                style={{
                  width: iconSize,
                  height: iconSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "filter 0.3s",
                }}
              >
                <LanguageIcon width={iconSize} />
              </div>
            </div>
            {/* Menu icon container */}
            <div
              style={{
                width: iconContainerHeight,
                height: iconContainerHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--general-rounding)",
                color: "var(--foreground)",
                background: menuHovered ? "var(--theme-color)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "color 0.3s, background 0.3s",
                padding: 3,
              }}
              onMouseEnter={() => setMenuHovered(true)}
              onMouseLeave={() => setMenuHovered(false)}
              tabIndex={0}
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu2 size={iconSize - 2} strokeWidth={2.1} />
            </div>
            {/* Login/Logout */}
            {authenticated ? (
              <div
                style={{
                  width: iconContainerHeight,
                  height: iconContainerHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--general-rounding)",
                  color: "var(--foreground)",
                  background: logoutHovered ? "var(--theme-color)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.3s, background 0.3s",
                  padding: 3,
                }}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                tabIndex={0}
                aria-label={t("log-out-the-verb")}
                onClick={handleLogout}
                title={t("log-out-the-verb")}
              >
                <LogOut size={iconSize - 2} strokeWidth={2.1} />
              </div>
            ) : (
              showLogin && (
                <NavbarButton
                  as="button"
                  variant="primary"
                  className="ml-2"
                  onClick={() => {
                    if (typeof onLoginClick === "function") onLoginClick();
                  }}
                >
                  {t("login")}
                </NavbarButton>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
      {/* Language Selector Modal */}
      <LanguageSelector ref={languageSelectorRef} />
      {/* --- Fullscreen Menu Overlay --- */}
      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLoginClick={() => {
          setMenuOpen(false);
          if (typeof onLoginClick === "function") onLoginClick();
        }}
        onIdentityCheckClick={() => {
          setMenuOpen(false);
          if (typeof onIdentityCheckClick === "function") onIdentityCheckClick();
        }}
      />
    </>
  );
}
