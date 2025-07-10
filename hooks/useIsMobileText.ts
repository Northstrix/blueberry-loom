"use client"
import { useEffect, useState } from "react";

export function useIsMobileText(): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 624 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 624);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
