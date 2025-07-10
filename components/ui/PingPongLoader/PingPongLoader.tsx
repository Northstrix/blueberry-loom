"use client";
import React, { ComponentProps, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type DotLoaderProps = {
  frames: number[][];
  ballIndex: number[];
  dotClassName?: string;
  isPlaying?: boolean;
  duration?: number;
  repeatCount?: number;
  onComplete?: () => void;
} & ComponentProps<"div">;

export const DotLoader = ({
  frames,
  ballIndex,
  isPlaying = true,
  duration = 100,
  dotClassName,
  className,
  repeatCount = -1,
  onComplete,
  ...props
}: DotLoaderProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(0);
  const repeats = useRef(0);
  const interval = useRef<NodeJS.Timeout>(null);

  const applyFrameToDots = useCallback(
    (dots: HTMLDivElement[], frameIndex: number) => {
      const frame = frames[frameIndex];
      const ball = ballIndex[frameIndex];
      if (!frame) return;
      dots.forEach((dot, index) => {
        dot.classList.remove("active-ball", "active-handle");
        if (index === ball) {
          dot.classList.add("active-ball");
        } else if (frame.includes(index)) {
          dot.classList.add("active-handle");
        }
      });
    },
    [frames, ballIndex]
  );

  useEffect(() => {
    currentIndex.current = 0;
    repeats.current = 0;
  }, [frames]);

  useEffect(() => {
    if (isPlaying) {
      if (currentIndex.current >= frames.length) {
        currentIndex.current = 0;
      }
      const dotElements = gridRef.current?.children;
      if (!dotElements) return;
      const dots = Array.from(dotElements) as HTMLDivElement[];
      interval.current = setInterval(() => {
        applyFrameToDots(dots, currentIndex.current);
        if (currentIndex.current + 1 >= frames.length) {
          if (repeatCount !== -1 && repeats.current + 1 >= repeatCount) {
            clearInterval(interval.current!);
            onComplete?.();
          }
          repeats.current++;
        }
        currentIndex.current = (currentIndex.current + 1) % frames.length;
      }, duration);
    } else {
      if (interval.current) clearInterval(interval.current);
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [frames, isPlaying, applyFrameToDots, duration, repeatCount, onComplete]);

  return (
    <div
      {...props}
      ref={gridRef}
      className={cn("grid w-fit grid-cols-7 gap-0.5", className)}
    >
      {Array.from({ length: 49 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-sm bg-[var(--background-adjacent-color)]",
            dotClassName
          )}
        />
      ))}
      <style jsx global>{`
        .active-ball {
          background: var(--theme-color) !important;
        }
        .active-handle {
          background: var(--foreground) !important;
        }
      `}</style>
    </div>
  );
};

const pingpongFrames = [
  [7, 0, 8, 6, 13, 20],
  [7, 13, 20, 16, 27, 21],
  [20, 27, 21, 34, 24, 28],
  [21, 34, 28, 41, 32, 35],
  [28, 41, 35, 48, 40, 42],
  [28, 41, 35, 48, 42, 46],
  [28, 41, 35, 48, 42, 38],
  [28, 41, 35, 48, 30, 21],
  [28, 41, 48, 21, 22, 14],
  [28, 41, 21, 14, 16, 27],
  [28, 21, 14, 10, 20, 27],
  [21, 14, 4, 13, 20, 27],
  [21, 14, 12, 6, 13, 20],
  [21, 14, 6, 13, 20, 11],
  [21, 14, 6, 13, 20, 10],
  [6, 13, 20, 9, 7, 21],
];
const pingpongBall = [
  14, 14, 14, 27, 34, 34, 34, 34, 34, 34, 34, 28, 28, 28, 28, 14
];

export const PingPongLoader = ({
  message,
  ...props
}: { message?: string } & Partial<DotLoaderProps>) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        background: "var(--background)",
        border: "1px solid var(--lightened-background-adjacent-color)",
        color: "var(--foreground)",
        padding: "2.5rem 2.5rem 2rem 2.5rem",
        borderRadius: "var(--general-rounding)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 220,
        minHeight: 120,
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.09)",
        justifyContent: "center"
      }}
    >
      <DotLoader
        frames={pingpongFrames}
        ballIndex={pingpongBall}
        className="gap-0.5"
        dotClassName=""
        duration={60}
        {...props}
      />
      <div
        style={{
          marginTop: 26,
          fontWeight: 600,
          fontSize: "1.08rem",
          color: "var(--foreground)"
        }}
      >
        {message ?? t("loading_form")}
      </div>
    </div>
  );
};

export default PingPongLoader;
