"use client";
import React, { useState } from "react";
import { Sparkles, Zap,  Activity, KeyRound, Scaling } from "lucide-react";
import { GlowingEffect } from "@/components/ui/GlowingEffect/GlowingEffect";
import Section from "@/components/landing/Section";
import { useTranslation } from "react-i18next";

// GridItem for glowing effect cards with dark-only and border hover effect
interface GridItemProps {
  className?: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}
const GridItem = ({
  className = "",
  icon,
  title,
  description,
}: GridItemProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <li
      className={`min-h-[14rem] list-none ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3"
        style={{
          border: isHovering
            ? "1px solid var(--lightened-background-adjacent-color)"
            : "1px solid var(--background-adjacent-color)",
          transition: "border-color 0.3s ease-in-out",
          background: "var(--feature-card-background)",
        }}
      >
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 shadow-[0px_0px_27px_0px_#222]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-[var(--background-adjacent-color)] p-2 bg-[#18181b]">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-white md:text-2xl/[1.875rem]">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] md:text-base/[1.375rem] text-[var(--muted-foreground)] [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

// FeaturesSection with dark-only bento grid and translations
const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Section title={t("features")} inscription={t("featuresInscription")}>
      <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        <GridItem
          className="md:col-span-2"
          icon={<Sparkles className="h-5 w-5 text-[var(--muted-foreground)]" />}
          title={t("feature-1-name")}
          description={t("feature-1-desc")}
        />
        <GridItem
          icon={<Zap className="h-5 w-5 text-[var(--muted-foreground)]" />}
          title={t("feature-3-name")}
          description={t("feature-3-desc")}
        />
        <GridItem
          icon={<Activity className="h-5 w-5 text-[var(--muted-foreground)]" />}
          title={t("feature-4-name")}
          description={t("feature-4-desc")}
        />
        <GridItem
          icon={<KeyRound className="h-5 w-5 text-[var(--muted-foreground)]" />}
          title={t("feature-5-name")}
          description={t("feature-5-desc")}
        />
        <GridItem
          icon={<Scaling className="h-5 w-5 text-[var(--muted-foreground)]" />}
          title={t("feature-6-name")}
          description={t("feature-6-desc")}
        />
      </ul>
    </Section>
  );
};

export default FeaturesSection;
