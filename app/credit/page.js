"use client";
import React from "react";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { useTranslation } from "react-i18next";
import { useIsRtl } from "@/hooks/useIsRtl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

// The markdown string with credits (separate entries by empty line)
const creditsMarkdown = `
[Text Rotate](https://www.fancycomponents.dev/docs/components/text/text-rotate) by [fancy components](https://www.fancycomponents.dev/)

[motion](https://github.com/motiondivision/motion) by [motiondivision](https://github.com/motiondivision)

[GSAP](https://github.com/greensock/GSAP) by [greensock](https://github.com/greensock)

[Sign In](https://hextaui.com/docs/marketing/sign-in) by [HextaUI](https://hextaui.com/)

[Chronicle Button](https://codepen.io/Haaguitos/pen/OJrVZdJ) by [Haaguitos](https://codepen.io/Haaguitos)

[Input Floating Label animation](https://codepen.io/Mahe76/pen/qBQgXyK) by [Elpeeda](https://codepen.io/Mahe76)

[react-toastify](https://github.com/fkhadra/react-toastify) by [Fadi Khadra](https://github.com/fkhadra)

[sweetalert2](https://github.com/sweetalert2/sweetalert2) by [sweetalert2](https://github.com/sweetalert2)

[react-i18next](https://github.com/i18next/react-i18next) by [i18next](https://github.com/i18next)

[hash-wasm](https://github.com/Daninet/hash-wasm) by [Daninet](https://github.com/Daninet)

[firebase-js-sdk](https://github.com/firebase/firebase-js-sdk) by [firebase](https://github.com/firebase/firebase-js-sdk)

[mipher](https://github.com/mpaland/mipher) by [mpaland](https://github.com/mpaland)

[BUTTONS](https://codepen.io/uchihaclan/pen/NWOyRWy) by [TAYLOR](https://codepen.io/uchihaclan)

[Bento Grid](https://ui.aceternity.com/components/bento-grid) by [Aceternity UI](https://ui.aceternity.com/)

[lucide](https://github.com/lucide-icons/lucide) by [lucide-icons](https://github.com/lucide-icons)

[Shining Text](https://hextaui.com/docs/text/text-shining) by [HextaUI](https://hextaui.com/)

[Radix Checkbox](https://21st.dev/animate-ui/radix-checkbox/radix-checkbox-demo) by [Animate UI](https://21st.dev/animate-ui)

[Custom Checkbox](https://21st.dev/Edil-ozi/custom-checkbox/default) by [Edil Ozi](https://21st.dev/Edil-ozi)

[チェックしないと押せないボタン](https://codepen.io/ash_creator/pen/JjZReNm) by [あしざわ - Webクリエイター](https://codepen.io/ash_creator)

[Help Button](https://21st.dev/ln-dev7/help-button/default) by [LN](https://21st.dev/ln-dev7)

[DraggableList](https://hextaui.com/docs/application/draggable-list) by [HextaUI](https://hextaui.com/)

[Haiku](https://www.reacthaiku.dev/) by [DavidHDev](https://github.com/DavidHDev)

[Dot Loader](https://21st.dev/paceui/dot-loader/default) by [PaceUI](https://www.paceui.com/)

[UZUMAKI](https://codepen.io/Alansdead/pen/zxGyOmx) by [Jules](https://codepen.io/Alansdead)

[Parallax Floating](https://www.fancycomponents.dev/docs/components/image/parallax-floating) by [fancy components](https://www.fancycomponents.dev/)

[Glowing Effect](https://ui.aceternity.com/components/glowing-effect) by [Aceternity UI](https://ui.aceternity.com/)

[Card Spotlight](https://ui.aceternity.com/components/card-spotlight) by [Aceternity UI](https://ui.aceternity.com/)

[Canvas Reveal Effect](https://ui.aceternity.com/components/canvas-reveal-effect) by [Aceternity UI](https://ui.aceternity.com/)

[Fey.com Macbook Scroll](https://ui.aceternity.com/components/macbook-scroll) by [Aceternity UI](https://ui.aceternity.com/)

[Tranquiluxe](https://uvcanvas.com/docs/components/tranquiluxe) by [UV Canvas](https://uvcanvas.com/)

[Animated Tooltip](https://ui.aceternity.com/components/animated-tooltip) by [Aceternity UI](https://ui.aceternity.com/)

[Wheel Picker](https://21st.dev/ncdai/wheel-picker/default) by [Chánh Đại](https://21st.dev/ncdai)

[React Wheel Picker](https://www.npmjs.com/package/@ncdai/react-wheel-picker) by [Chánh Đại](https://github.com/ncdai)

[Resizable Navbar](https://ui.aceternity.com/components/resizable-navbar) by [Aceternity UI](https://ui.aceternity.com/)

[Menu Vertical](https://21st.dev/berlix/menu-vertical/default) by [Berlix UI](https://berlix.vercel.app/)

[Perplexity](https://www.perplexity.ai/)
`;

// Parses a markdown entry into React elements
function parseMarkdownEntry(entry) {
  // Match all [text](url)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  const elements = [];
  let key = 0;
  while ((match = regex.exec(entry)) !== null) {
    // Text before the link
    if (match.index > lastIndex) {
      elements.push(
        <span key={key++} style={{ color: "var(--foreground)" }}>
          {entry.slice(lastIndex, match.index)}
        </span>
      );
    }
    // The link itself
    elements.push(
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--theme-color)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          textDecorationThickness: 1.5,
          fontWeight: 600,
          margin: "0 3px",
        }}
      >
        {match[1]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }
  // Any text after the last link
  if (lastIndex < entry.length) {
    elements.push(
      <span key={key++} style={{ color: "var(--foreground)" }}>
        {entry.slice(lastIndex)}
      </span>
    );
  }
  return elements;
}

export default function CreditPage() {
  const isMobile = useIsMobileText();
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();
  const horizontalPadding = isMobile ? "10px" : "24px";

  // Split entries by empty line (two or more newlines)
  const creditEntries = creditsMarkdown
    .split(/\n\s*\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  // Height of the overlay bar (same as in login form)
  const overlayBarHeight = isMobile ? 48 : 64;

  return (
    <main
      style={{
        background: "var(--background)",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Overlay Return Link */}
      {isRtl ? (
        <div
          className="absolute top-0 left-0 z-50 flex items-center justify-start w-full"
          style={{
            height: overlayBarHeight,
            marginLeft: isMobile ? 10 : 24,
            marginRight: isMobile ? 10 : 24,
            pointerEvents: "none",
          }}
        >
          <a
            href="/"
            tabIndex={0}
            aria-label={t("home")}
            className={`flex items-center h-full font-semibold ${
              isMobile ? "text-base" : "text-xl"
            } text-[var(--foreground)] no-underline transition-colors duration-300 cursor-pointer pointer-events-auto group`}
            style={{ width: "auto" }}
            onClick={e => {
              e.preventDefault();
              router.push("/");
            }}
            dir="ltr"
          >
            <span
              className="items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
            >
              {t("home")}
            </span>
            <span
              className="items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
              style={{
                marginRight: isMobile ? 2.5 : 4,
                display: "flex-end",
                alignItems: "center",
              }}
            >
              <ChevronRight
                size={isMobile ? 20 : 24}
                stroke="currentColor"
                strokeWidth={isMobile ? 2 : 2.25}
                className="transition-colors duration-300"
              />
            </span>
          </a>
        </div>
      ) : (
        <div
          className="absolute top-0 left-0 z-50 flex items-center"
          style={{
            height: overlayBarHeight,
            marginLeft: isMobile ? 10 : 24,
            marginRight: isMobile ? 10 : 24,
            pointerEvents: "none",
          }}
        >
          <a
            href="/"
            tabIndex={0}
            aria-label={t("home")}
            className={`flex items-center h-full font-semibold ${
              isMobile ? "text-base" : "text-xl"
            } text-[var(--foreground)] no-underline transition-colors duration-300 cursor-pointer pointer-events-auto group`}
            style={{ width: "auto" }}
            onClick={e => {
              e.preventDefault();
              router.push("/");
            }}
          >
            <span
              className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
              style={{
                marginRight: isMobile ? 2.5 : 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft
                size={isMobile ? 20 : 24}
                stroke="currentColor"
                strokeWidth={isMobile ? 2 : 2.25}
                className="transition-colors duration-300"
              />
            </span>
            <span className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]">
              {t("home")}
            </span>
          </a>
        </div>
      )}

      {/* Spacer to compensate for overlay bar */}
      <div style={{ height: overlayBarHeight }} />

      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 0 0 0",
        }}
      >
        {/* Title */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "3rem",
            fontWeight: 700,
            marginBottom: "40px",
            color: "var(--foreground)",
            letterSpacing: "-1px",
          }}
        >
          {t("credit")}
        </h1>
        {/* Credit text */}
        <div
          style={{
            color: "var(--foreground)",
            fontSize: "1.15rem",
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
            marginBottom: "32px",
            direction: isRtl ? "rtl" : "ltr",
            textAlign: "center",
          }}
        >
          {t("credit-text")}
        </div>
        {/* Credit entries */}
        <div
          style={{
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {creditEntries.map((entry, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 18,
                fontSize: "1.11rem",
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.7,
              }}
            >
              {parseMarkdownEntry(entry)}
            </div>
          ))}
        </div>
        {/* 32px space before footer */}
        <div style={{ height: "32px" }} />
      </div>
    </main>
  );
}
