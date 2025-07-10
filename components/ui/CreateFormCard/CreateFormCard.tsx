"use client";
import React from "react";
import styled from "styled-components";
import { FilePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobileText } from "@/hooks/useIsMobileText"; // Adjust path as needed

interface CreateFormCardProps {
  columns: number;
  onClick: () => void;
}

export default function CreateFormCard({
  columns,
  onClick,
}: CreateFormCardProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobileText();

  // Font size logic (same as FormCard nameFont)
  let nameFont = 1.08;
  if (columns === 3) nameFont = 1.01;
  else if (columns === 2) nameFont = isMobile ? 1.05 : 1.15;
  else if (columns === 1) nameFont = isMobile ? 1.07 : 1.22;

  return (
    <CreateCardContainer tabIndex={0} onClick={onClick} $nameFont={nameFont}>
      <CreateContent>
        <StyledFilePlus size={26} className="create-icon" />
        <ShimmerText $nameFont={nameFont}>
          {t("create_new_form")}
        </ShimmerText>
      </CreateContent>
    </CreateCardContainer>
  );
}

const CreateCardContainer = styled.div<{ $nameFont: number }>`
  background: var(--card-background);
  border-radius: var(--general-rounding);
  border: 1.5px solid var(--lightened-background-adjacent-color);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  padding: 20px 18px 18px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  min-height: 230px;
  cursor: pointer;
  transition: border-color 0.3s;
  outline: none;
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;

  &:hover {
    border-color: var(--second-degree-lightened-background-adjacent-color);

    .create-icon {
      color: var(--theme-color);
    }
    /* The shimmer effect on text is handled in ShimmerText below */
  }
`;

const CreateContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  height: 100%;
`;

const StyledFilePlus = styled(FilePlus)`
  color: var(--input-outline);
  flex-shrink: 0;
  transition: color 0.2s;
  ${CreateCardContainer}:hover & {
    color: var(--theme-color);
  }
`;

// ShimmerText: always visible, shimmer only on hover, left-to-right, starts at left
const ShimmerText = styled.span<{ $nameFont: number }>`
  font-weight: 700;
  font-size: ${({ $nameFont }) => $nameFont}rem;
  color: var(--input-outline);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  position: relative;
  transition: color 0.2s;

  /* Shimmer effect only on hover */
  ${CreateCardContainer}:hover & {
    background: linear-gradient(
      110deg,
      var(--input-outline) 30%,
      var(--foreground) 50%,
      var(--input-outline) 70%
    );
    background-size: 200% 100%;
    background-position: 200% 0;
    animation: shimmer-move 2s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }

  @keyframes shimmer-move {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
