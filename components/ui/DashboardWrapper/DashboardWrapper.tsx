"use client";
import React, { useRef, useState, useEffect, createContext } from "react";
import styled from "styled-components";

export const DashboardMobileContext = createContext(false);

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (ref.current) {
        setIsMobile(ref.current.offsetWidth < 768);
      }
    };
    const observer = new ResizeObserver(handleResize);
    if (ref.current) observer.observe(ref.current);
    handleResize();
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <WrapperOuter>
      <StyledWrapper ref={ref} $isMobile={isMobile}>
        <DashboardMobileContext.Provider value={isMobile}>
          {children}
        </DashboardMobileContext.Provider>
      </StyledWrapper>
    </WrapperOuter>
  );
}

const WrapperOuter = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const StyledWrapper = styled.div<{ $isMobile: boolean }>`
  width: 100%;
  max-width: 1536px;
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  transition: padding 0.2s;
  padding-left: ${({ $isMobile }) => ($isMobile ? "10px" : "24px")};
  padding-right: ${({ $isMobile }) => ($isMobile ? "10px" : "24px")};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;
