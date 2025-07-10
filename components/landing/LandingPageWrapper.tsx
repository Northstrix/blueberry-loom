"use client";
import React, { useState, useEffect } from "react";
import HeroSection from "./hero/HeroSection";
import FormFloatingBackground from "./hero/FormFloatingBackground";
import SpiralBackground from "./hero/SpiralBackground";
import { MacbookScroll } from "@/components/landing/demo/macbook-scroll";
import { Logo } from "@/components/ui/Logo/Logo";
import FeaturesSection from "@/components/landing/features/FeaturesSection";
import PricingSection from "@/components/landing/pricing/PricingSection";
import Footer from "@/components/ui/Footer/Footer";
import { ResizableNavbar } from "@/components/ui/ResizableNavbar/ResizableNavbar";

interface Props {
  windowWidth: number;
  onShowLogin: (mode: "signin" | "signup") => void;
  onShowIdentityCheck: () => void;
  onRespondentFormResolved: (values: { publisherEmail: string; formID: string; decryptionKey: string }) => void;
}

export default function LandingPageWrapper({
  windowWidth,
  onShowLogin,
  onShowIdentityCheck,
  onRespondentFormResolved,
}: Props) {
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const [isMacbookVisible, setIsMacbookVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setIsMacbookVisible(window.innerWidth >= 900 && window.innerHeight >= 916);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMacbookVisible(windowWidth >= 900 && windowHeight >= 912);
  }, [windowWidth, windowHeight]);

  return (
    <>
      {/* Overlay layer for navbar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, width: "100%", maxWidth: "100vw",
        boxSizing: "border-box", zIndex: 50, display: "flex", justifyContent: "center", pointerEvents: "none",
      }}>
        <div style={{
          position: "relative", zIndex: 51, pointerEvents: "auto", width: "100%", display: "flex", justifyContent: "center",
        }}>
          <ResizableNavbar onLoginClick={() => onShowLogin("signin")} onIdentityCheckClick={onShowIdentityCheck} />
        </div>
      </div>
      {/* Main scrollable content */}
      <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflow: "hidden" }}>
        <SpiralBackground />
        <FormFloatingBackground windowWidth={windowWidth} />
        <HeroSection
          windowWidth={windowWidth}
          onShowLogin={onShowLogin}
          onRespondentFormResolved={onRespondentFormResolved}
        />
      </div>
      <FeaturesSection />
      <PricingSection onShowLogin={onShowLogin} />
      {isMacbookVisible && (
        <div className="overflow-hidden bg-[var(--second-section-background)]">
          <MacbookScroll badge={<a href="#"><Logo className="h-10 w-10" size="2.75rem" /></a>} showGradient={false} />
        </div>
      )}
      <Footer onLoginClick={() => onShowLogin("signin")} onIdentityCheckClick={onShowIdentityCheck} />
    </>
  );
}
