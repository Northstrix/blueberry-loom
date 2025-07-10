"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { CanvasRevealEffect } from "@/components/ui/CanvasRevealEffect/CanvasRevealEffect";

interface SecondPlayingCardProps {
  componentWidth?: string;
  aspectRatio?: string;
  outerRounding?: string;
  innerRounding?: string;
  backgroundColor?: string;
  hoveredBackgroundColor?: string;
  imageHeightPercentage?: number;
  imageSrc: string;
  imageAlt?: string;
  outlineColor?: string;
  hoverOutlineColor?: string;
  textArray: string[];
  minWidth: number;
  maxWidth: number;
  minTextSize: number;
  maxTextSize: number;
  verticalPadding?: string;
  horizontalPadding?: string;
  manualLetterSpacing?: number;
  componentId?: string;
  onCardClicked: () => void;
  textColor?: string;
  hoverTextColor?: string;
  transitionDuration?: number; // ms
  transitionDelay?: number; // ms
}

const SecondPlayingCard: React.FC<SecondPlayingCardProps> = ({
  componentWidth = "412px",
  aspectRatio = "3/4",
  outerRounding = "18px",
  innerRounding = "18px",
  backgroundColor = "#fff",
  hoveredBackgroundColor,
  imageHeightPercentage = 70,
  imageSrc,
  imageAlt = "",
  outlineColor = "#ddd",
  hoverOutlineColor = "#aaa",
  textArray,
  minWidth,
  maxWidth,
  minTextSize,
  maxTextSize,
  verticalPadding = "20px",
  horizontalPadding = "20px",
  manualLetterSpacing,
  componentId = "card-2",
  onCardClicked,
  textColor = "#000",
  hoverTextColor = "#fff",
  transitionDuration = 300,
  transitionDelay = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [textSize, setTextSize] = useState(maxTextSize);
  const [letterSpacing, setLetterSpacing] = useState(manualLetterSpacing ?? 0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverReady, setHoverReady] = useState(false);
  const [showCanvasReveal, setShowCanvasReveal] = useState(false);

  // Responsive text sizing
  useEffect(() => {
    const updateTextSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const calculatedTextSize =
          ((maxTextSize - minTextSize) / (maxWidth - minWidth)) *
            (width - minWidth) +
          minTextSize;
        const cappedTextSize = Math.min(calculatedTextSize, maxTextSize);
        setTextSize(cappedTextSize);
      }
    };
    const handleResize = () => {
      setTimeout(updateTextSize, 500);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    updateTextSize();
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [minWidth, maxWidth, minTextSize, maxTextSize]);

  useEffect(() => {
    if (manualLetterSpacing !== undefined) {
      setLetterSpacing(manualLetterSpacing);
      return;
    }
    const textElement = containerRef.current?.querySelector(
      `#${componentId}-text`
    );
    if (!textElement) return;
    const letterWidth =
      (textElement as HTMLElement).clientWidth / textArray.length;
    setLetterSpacing(letterWidth);
  }, [textArray, textSize, manualLetterSpacing, componentId]);

  // Hover logic with delay (for text/canvas only)
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (isHovered && transitionDelay > 0) {
      setHoverReady(false);
      timeout = setTimeout(() => setHoverReady(true), transitionDelay);
    } else {
      setHoverReady(isHovered);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isHovered, transitionDelay]);

  // Canvas reveal effect timing logic
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (isHovered) {
      timeout = setTimeout(() => setShowCanvasReveal(true), transitionDuration);
    } else {
      setShowCanvasReveal(false);
      if (timeout) clearTimeout(timeout);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isHovered, transitionDuration]);

  // Color logic
  const cardBg =
    isHovered && hoveredBackgroundColor ? hoveredBackgroundColor : backgroundColor;
  const cardTextColor = hoverReady && isHovered ? hoverTextColor : textColor;
  const borderColor = isHovered ? hoverOutlineColor : outlineColor;

  // --- KEY CHANGE: background-color transition is 0ms, others are smooth ---
  const transition = `background-color 0ms, color ${transitionDuration}ms, border-color ${transitionDuration}ms`;

  return (
    <a
      href="/"
      style={{
        display: "block",
        maxWidth: componentWidth,
        width: "100%",
      }}
      tabIndex={0}
      ref={containerRef as any}
    >
      <div
        style={{
          borderRadius: outerRounding,
          padding: "1px",
          background: borderColor,
          display: "inline-block",
          width: "100%",
          aspectRatio: aspectRatio,
          transition: transition,
          cursor: "pointer",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoverReady(false);
        }}
        onClick={e => {
          e.preventDefault();
          onCardClicked();
        }}
      >
        <div
          style={{
            backgroundColor: cardBg,
            padding: `${verticalPadding} ${horizontalPadding}`,
            borderRadius: innerRounding,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            transition: transition,
          }}
        >
          {/* CANVAS REVEAL EFFECT */}
          {showCanvasReveal && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1, // below text, above bg
                pointerEvents: "none",
                borderRadius: innerRounding,
              }}
            >
              <CanvasRevealEffect
                animationSpeed={5}
                containerClassName="bg-transparent absolute inset-0 pointer-events-none"
                dotSize={3}
              />
            </div>
          )}
          {/* Main Text - Top Left */}
          <div
            id={`${componentId}-text`}
            style={{
              position: "absolute",
              top: verticalPadding,
              left: horizontalPadding,
              display: "flex",
              justifyContent: "flex-start",
              zIndex: 2,
              color: cardTextColor,
              fontWeight: "bold",
              fontSize: `${textSize}px`,
              flexDirection: "row",
              transition: transition,
            }}
          >
            {textArray.map((letter, index) => (
              <div
                key={`${componentId}-letter-${index}`}
                style={{
                  transform:
                    letterSpacing < 0 && index > 0
                      ? `translateX(${letterSpacing * index}px)`
                      : "none",
                  marginLeft: letterSpacing >= 0 ? `${Math.abs(letterSpacing)}px` : "0",
                  letterSpacing: `${letterSpacing}px`,
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          {/* Mirrored Text - Bottom Right */}
          <div
            id={`${componentId}-mirror`}
            style={{
              position: "absolute",
              bottom: verticalPadding,
              right: horizontalPadding,
              display: "flex",
              justifyContent: "flex-start",
              zIndex: 2,
              color: cardTextColor,
              fontWeight: "bold",
              fontSize: `${textSize}px`,
              flexDirection: "row",
              transform: "scale(-1)",
              transition: transition,
            }}
          >
            {textArray.map((letter, index) => (
              <div
                key={`${componentId}-mirror-letter-${index}`}
                style={{
                  transform:
                    letterSpacing < 0 && index > 0
                      ? `translateX(${letterSpacing * index}px)`
                      : "none",
                  marginLeft: letterSpacing >= 0 ? `${Math.abs(letterSpacing)}px` : "0",
                  letterSpacing: `${letterSpacing}px`,
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              width: "100%",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                height: `${imageHeightPercentage}%`,
                width: "auto",
                aspectRatio: "1/1",
                zIndex: 1,
              }}
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                style={{
                  objectFit: "contain",
                  objectPosition: "center",
                }}
                priority
                sizes={`${componentWidth} ${aspectRatio.replace("/", " ")}`}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default SecondPlayingCard;
