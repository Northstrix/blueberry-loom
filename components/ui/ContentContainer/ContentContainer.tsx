"use client";
import React, { useRef, useEffect, useState, ReactNode, createContext, useContext } from "react";

export const ContainerWidthContext = createContext<number>(1404);

interface ContentContainerProps {
  children: ReactNode;
}

const MAX_WIDTH = 1404;

const ContentContainer: React.FC<ContentContainerProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(MAX_WIDTH);

  useEffect(() => {
    function checkWidth() {
      if (ref.current) {
        // getBoundingClientRect().width includes padding & border
        setContainerWidth(ref.current.getBoundingClientRect().width);
      }
    }
    checkWidth();
    const resizeObserver = new ResizeObserver(checkWidth);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    window.addEventListener("resize", checkWidth);
    return () => {
      window.removeEventListener("resize", checkWidth);
      if (ref.current) {
        resizeObserver.unobserve(ref.current);
      }
    };
  }, []);

  // Responsive padding
  const isMobile = containerWidth < 768;

  return (
    <ContainerWidthContext.Provider value={containerWidth}>
      <div
        ref={ref}
        style={{
          maxWidth: MAX_WIDTH,
          margin: "0 auto",
          paddingLeft: isMobile ? 10 : 24,
          paddingRight: isMobile ? 10 : 24,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </ContainerWidthContext.Provider>
  );
};

export default ContentContainer;

// Usage: useContext(ContainerWidthContext) to get the current width (including padding)
