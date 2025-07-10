"use client";
import React from "react";
import styled, { css } from "styled-components";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import Badge from "@/components/ui/Badge/Badge";
import { useTranslation } from "react-i18next";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { RetrievedForm } from "@/types/retrievedForm";

// Utility functions
function formatViews(value: number): string {
  if (value < 1_000) return value.toString();
  if (value < 10_000) return (Math.floor(value / 100) / 10) + "K";
  if (value < 1_000_000) return Math.floor(value / 1_000) + "K";
  if (value < 10_000_000) return (Math.floor(value / 100_000) / 10) + "M";
  if (value < 1_000_000_000) return Math.floor(value / 1_000_000) + "M";
  return (Math.floor(value / 100_000_000) / 10) + "B";
}
function formatResponses(value: number): string {
  return value.toLocaleString("en-US");
}
function decodeBase64Unicode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}
function parseMetaFromDecryptedTemplate(template: string | null) {
  if (!template) return {};
  const metaMatch = template.match(/^META\(([^)]*)\)/);
  if (!metaMatch) return {};
  const metaParts = metaMatch[1].split(":");
  return {
    title: metaParts[0] ? decodeBase64Unicode(metaParts[0]) : "",
    description: metaParts[1] ? decodeBase64Unicode(metaParts[1]) : "",
    accentColor: metaParts[5] ? decodeBase64Unicode(metaParts[5]) : undefined,
  };
}

interface FormCardProps {
  data: RetrievedForm;
  columns: number;
  onClick: (id: string) => void;
  onViewResponses: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  optionalAccentColor?: string; // Optional prop for accent color
  optionalBorder?: string; // Optional prop for border color
  optionalButtonForeground?: string; // Optional prop for button foreground

  // New optional props
  optionalTitle?: string;
  optionalDescription?: string;
  optionalHoverColor?: string; // background on hover
  optionalHoverForeground?: string; // foreground/text on hover
}

function FormCardComponent({
  data,
  columns,
  onClick,
  onViewResponses,
  onDelete,
  onPublish,
  optionalAccentColor,
  optionalBorder,
  optionalButtonForeground,
  optionalTitle,
  optionalDescription,
  optionalHoverColor,
  optionalHoverForeground,
}: FormCardProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobileText();

  // --- Determine if the card is in an error state ---
  const isError =
    data.encryptedFormTemplateStatus === "absent" ||
    data.encryptedFormTemplateStatus === "corrupt" ||
    data.encryptedEncryptionKeyStatus === "absent" ||
    data.encryptedEncryptionKeyStatus === "corrupt" ||
    data.decryptedFormKeyIntegrity === false ||
    data.decryptedFormTemplateIntegrity === false ||
    data.decryptedFormTemplatePaddingValid === false;

  // --- Parse decryptedTemplate for title, description, accentColor ---
  const meta = parseMetaFromDecryptedTemplate(data.decryptedTemplate);

  // Use optionalTitle/optionalDescription if provided, else fallback to decoded
  const name = optionalTitle ?? meta.title ?? "";
  const description = optionalDescription ?? meta.description ?? "";
  const accentColor = optionalAccentColor || meta.accentColor || "var(--theme-color)";

  // --- Responsive font size logic based on columns and mobile ---
  let nameFont = 1.08,
    descFont = 0.98,
    statsFont = 0.98,
    labelFont = 0.93;
  if (columns === 3) {
    nameFont = 1.01;
    descFont = 0.92;
    statsFont = 0.93;
    labelFont = 0.9;
  } else if (columns === 2) {
    nameFont = isMobile ? 1.05 : 1.15;
    descFont = isMobile ? 0.97 : 1.02;
    statsFont = isMobile ? 0.98 : 1.05;
    labelFont = isMobile ? 0.95 : 1.01;
  } else if (columns === 1) {
    nameFont = isMobile ? 1.07 : 1.22;
    descFont = isMobile ? 0.99 : 1.09;
    statsFont = isMobile ? 1.01 : 1.13;
    labelFont = isMobile ? 0.98 : 1.09;
  }

  const showStats = data.isPublic;
  const visitsDisplay = showStats ? formatViews(data.visits ?? 0) : "--";
  const responsesDisplay = showStats ? formatResponses(data.responses ?? 0) : "--";
  const responseRateDisplay =
    showStats && (data.visits ?? 0) > 0
      ? `${Math.floor(((data.responses ?? 0) / (data.visits ?? 1)) * 10000) / 100}%`
      : "--";

  const badgeText = data.isPublic ? t("public") : t("private");
  const badgeColor = data.isPublic ? "var(--theme-color)" : "var(--subtle-color)";
  const badgeBackground = data.isPublic ? "rgba(0,160,216,0.08)" : "rgba(112,112,112,0.13)";

  const buttonFontSize = isMobile ? "0.875rem" : undefined;
  const buttonLineHeight = isMobile ? "0.75" : undefined;

  // Handlers
  const handleCardClick = () => onClick(data.id);
  const handleViewResponses = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewResponses(data.id);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  };
  const handlePublish = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPublish(data.id);
  };

  return (
    <CardContainer
      tabIndex={0}
      onClick={handleCardClick}
      $isError={isError}
      $optionalBorder={optionalBorder}
    >
      <CardContent>
        <NameRow>
          <Circle $color={accentColor} />
          <NameAndBadge>
            <NameText
              $font={nameFont}
              $isMobile={isMobile}
              title={name}
              data-testid="form-card-name"
            >
              {name}
            </NameText>
            <Badge
              text={badgeText}
              color={badgeColor}
              background={badgeBackground}
              isMobile={isMobile}
            />
          </NameAndBadge>
        </NameRow>
        <DescLine
          $font={descFont}
          $isMobile={isMobile}
          title={description}
          data-testid="form-card-description"
        >
          {description}
        </DescLine>
        <StatsRow>
          <Stat>
            <StatLabel $font={labelFont} $columns={columns}>
              {t("visits")}
            </StatLabel>
            <StatValue $font={statsFont}>{visitsDisplay}</StatValue>
          </Stat>
          <Stat>
            <StatLabel $font={labelFont} $columns={columns}>
              {t("responses")}
            </StatLabel>
            <StatValue $font={statsFont}>{responsesDisplay}</StatValue>
          </Stat>
          <Stat>
            <StatLabel $font={labelFont} $columns={columns}>
              {t("response_rate")}
            </StatLabel>
            <StatValue $font={statsFont}>{responseRateDisplay}</StatValue>
          </Stat>
        </StatsRow>
      </CardContent>
      <ButtonsRow $isMobile={isMobile}>
        {data.isPublic ? (
          <ChronicleButton
            text={t("view_responses")}
            onClick={handleViewResponses}
            width="100%"
            fontSize={buttonFontSize}
            lineHeight={buttonLineHeight}
            customBackground={optionalAccentColor || undefined}
            customForeground={optionalButtonForeground || undefined}
            hoverColor={optionalHoverColor || undefined}
            hoverForeground={optionalHoverForeground || undefined}
          />
        ) : (
          <ChronicleButton
            text={t("publish")}
            onClick={handlePublish}
            width="100%"
            fontSize={buttonFontSize}
            lineHeight={buttonLineHeight}
            customBackground={optionalAccentColor || undefined}
            customForeground={optionalButtonForeground || undefined}
            hoverColor={optionalHoverColor || undefined}
            hoverForeground={optionalHoverForeground || undefined}
          />
        )}
        <ChronicleButton
          text={t("delete")}
          onClick={handleDelete}
          width="100%"
          outlined
          customBackground="var(--foreground)"
          hoverColor="var(--theme-red)"
          fontSize={buttonFontSize}
          lineHeight={buttonLineHeight}
        />
      </ButtonsRow>
    </CardContainer>
  );
}

export default React.memo(FormCardComponent);

// --- Styled Components ---
const CardContainer = styled.div<{ $isError: boolean; $optionalBorder?: string }>`
  background: var(--card-background);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px 18px 18px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 230px;
  cursor: pointer;
  transition: border-color 0.3s;
  outline: none;
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  ${({ $isError, $optionalBorder }) =>
    $isError
      ? css`
          border-radius: 0;
          border-width: 1px;
          border-style: dotted;
          border-color: transparent;
          border-image: repeating-linear-gradient(
              135deg,
              var(--theme-red) 0 6px,
              var(--foreground) 6px 12px
            )
            1 round;
        `
      : css`
          border-radius: var(--general-rounding);
          border: 1px solid ${$optionalBorder || "var(--lightened-background-adjacent-color)"};
          &:hover {
            border-color: ${$optionalBorder ||
            "var(--second-degree-lightened-background-adjacent-color)"};
          }
        `}
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  width: 100%;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const Circle = styled.div<{ $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--lightened-background-adjacent-color);
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  margin-right: 2px;
`;

const NameAndBadge = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 8px;
`;

const NameText = styled.div<{ $font: number; $isMobile: boolean }>`
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: ${({ $font }) => $font}rem;
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
`;

const DescLine = styled.div<{ $font: number; $isMobile: boolean }>`
  color: var(--muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 7px;
  font-size: ${({ $font }) => $font}rem;
  min-width: 0;
  max-width: 100%;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 18px;
  margin-bottom: 6px;
  min-width: 0;
  width: 100%;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
`;

const StatLabel = styled.div<{ $font: number; $columns: number }>`
  color: var(--subtle-color);
  font-size: ${({ $font, $columns }) => ($columns === 3 ? `${$font + 0.04}rem` : `${$font}rem`)};
  font-weight: 600;
  min-width: 0;
`;

const StatValue = styled.div<{ $font: number }>`
  color: var(--foreground);
  font-weight: 600;
  font-size: ${({ $font }) => $font}rem;
  min-width: 0;
`;

const ButtonsRow = styled.div<{ $isMobile: boolean }>`
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
  width: 100%;
  ${({ $isMobile }) =>
    $isMobile
      ? `
    flex-direction: column;
    & > * { width: 100%; }
  `
      : `
    flex-direction: row;
    & > * { flex: 1 1 0; width: 100%; min-width: 0; max-width: 100%; }
  `}
`;
