"use client";
import React from "react";
import styled from "styled-components";

interface BadgeProps {
  text: string;
  color: string;      // text color
  background: string; // background color
  borderColor?: string; // outline color, defaults to var(--background-adjacent-color)
  isMobile?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  color,
  background,
  borderColor = "var(--background-adjacent-color)",
  isMobile = false,
}) => (
  <StyledBadge
    $color={color}
    $background={background}
    $borderColor={borderColor}
    $isMobile={isMobile}
  >
    {text}
  </StyledBadge>
);

const StyledBadge = styled.div<{
  $color: string;
  $background: string;
  $borderColor: string;
  $isMobile: boolean;
}>`
  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};
  font-size: ${({ $isMobile }) => ($isMobile ? "0.85rem" : "0.95rem")};
  font-weight: 400;
  padding: ${({ $isMobile }) => ($isMobile ? "0.18em 0.65em" : "0.24em 0.86em")};
  border-radius: 999px;
  user-select: none;
  margin-left: ${({ $isMobile }) => ($isMobile ? "12px" : "18px")};
  margin-right: 0px;
  flex-shrink: 0;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  display: inline-block;
`;

export default Badge;
