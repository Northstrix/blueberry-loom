"use client";
import React, { useEffect, useState } from "react";
import Section from "@/components/landing/Section";
import PricingCard from "@/components/ui/PricingCard/PricingCard";
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useIsRtl } from "@/hooks/useIsRtl";

const featureKeys = [
  "feature-1-name",
  "feature-2-name",
  "feature-3-name",
  "feature-4-name",
  "feature-5-name",
  "feature-6-name",
];

// Helper to interpolate between two paddings
function interpolatePadding(width: number): string {
  // Clamp width between 240 and 800
  const minW = 240, maxW = 800;
  const minPadding = [1.25, 1]; // [vertical, horizontal] in rem
  const maxPadding = [2.5, 2];  // [vertical, horizontal] in rem

  if (width <= minW) return "1.25rem 1rem";
  if (width >= maxW) return "2.5rem 2rem";

  // Linear interpolation
  const t = (width - minW) / (maxW - minW);
  const vPad = minPadding[0] + (maxPadding[0] - minPadding[0]) * t;
  const hPad = minPadding[1] + (maxPadding[1] - minPadding[1]) * t;
  return `${vPad}rem ${hPad}rem`;
}

interface Props {
  onShowLogin: (mode: "signin" | "signup") => void;
}
const PricingSection: React.FC<Props> = ({ onShowLogin }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  const [padding, setPadding] = useState(() =>
    typeof window !== "undefined"
      ? interpolatePadding(window.innerWidth)
      : "2.5rem 2rem"
  );

  useEffect(() => {
    function handleResize() {
      setPadding(interpolatePadding(window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    // Set initial padding
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleGetStarted() {
    onShowLogin("signup");
  }

  const features = featureKeys.map(key => t(key));

  return (
    <div className="bg-[var(--first-section-background)]">
      <Section
        title={t('pricing')}
        inscription={t('pricingInscription')}
      >
        <PricingCard
          planInscription={t('first-pricing-plan-inscription')}
          plan={t('first-pricing-plan-name')}
          currency={t('currency')}
          price={0}
          features={features}
          buttonText={t('get_started')}
          onButtonClick={handleGetStarted}
          padding={padding}
          isRtl={isRtl}
        />
      </Section>
    </div>
  );
};

export default PricingSection;
