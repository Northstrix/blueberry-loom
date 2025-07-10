"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import FormCard from "@/components/ui/FormCard/FormCard";
import { useTranslation } from "react-i18next";

// Accent colors
const accentColors = ["#00a0d8", "#ff2800", "#00d8a0", "#a000d8", "#ffa500"];

// Helpers for random stats
const getRandomVisits = () => Math.floor(Math.random() * 1000) + 100;
const getRandomResponses = () => Math.floor(Math.random() * 100) + 10;

interface RetrievedForm {
  id: string;
  encryptedFormTemplate: string;
  encryptedEncryptionKey: string;
  decryptedTemplate: string;
  decryptedFormKey: Uint8Array;
  visits: number;
  responses: number;
  isPublic: boolean;
  createdAt: Date;
  publicationDate: Date;
}

// Helper: Get button foreground color for specific accent colors
const getButtonForegroundColor = (accentColor: string): string => {
  const specialColors = ["#ff2800", "#a000d8"];
  return specialColors.includes(accentColor) ? "#fff" : "#0a0a0a";
};

const FormFloatingBackground = ({ windowWidth }: { windowWidth: number }) => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine cards to show based on window width
  useEffect(() => {
    if (windowWidth >= 1280) setCards([0, 1, 2, 3, 4]);
    else if (windowWidth >= 800) setCards([0, 1, 4]);
    else if (windowWidth > 600) setCards([0, 3]);
    else setCards([0]);
  }, [windowWidth]);

  // Generate form data
  const getFormData = (i: number): RetrievedForm => {
    const isPublic = i !== 1; // card 1 is private
    return {
      id: `form-${i}`,
      encryptedFormTemplate: "",
      encryptedEncryptionKey: "",
      decryptedTemplate: "",
      decryptedFormKey: new Uint8Array(),
      visits: getRandomVisits(),
      responses: getRandomResponses(),
      isPublic,
      createdAt: new Date(),
      publicationDate: new Date(),
    };
  };

  // Card component with floating animation
  const Card = ({ i, cardIndex }: { i: number; cardIndex: number }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    let cardWidth;
    if (windowWidth < 340) {
      cardWidth = 242;
    } else if (windowWidth < 400) {
      cardWidth = 336;
    } else if (windowWidth < 480) {
      cardWidth = 360;
    } else if (windowWidth < 600) {
      cardWidth = 420;
    } else {
      cardWidth = 464;
    }
    const cardHeight = 242;

    // Safe area boundaries (now use entire container, not shifted by cardWidth/2)
    const getSafeArea = () => ({
      top: 0,
      bottom: (containerRef.current?.clientHeight || 1000) - cardHeight,
      left: 0,
      right: (containerRef.current?.clientWidth || 1000) - cardWidth,
    });

    // Random initial position within safe area (top-left of card must stay inside)
    const safeArea = getSafeArea();
    const initialX = useMotionValue(
      safeArea.left + Math.random() * (safeArea.right - safeArea.left)
    );
    const initialY = useMotionValue(
      safeArea.top + Math.random() * (safeArea.bottom - safeArea.top)
    );

    // Random angle between 10 and 80 degrees, multiplied by 1 to 4
    const baseAngleDeg = 10 + Math.random() * 70;
    const factor = 1 + Math.floor(Math.random() * 4);
    const angleRad = (baseAngleDeg * factor * Math.PI) / 180;

    // Random speed between 2.25 and 62.25 (upper bound increased by 10x)
    const speed = React.useRef(2.25 + Math.random() * 60);

    // Velocity vector components
    const velocityX = useMotionValue(Math.cos(angleRad) * speed.current);
    const velocityY = useMotionValue(Math.sin(angleRad) * speed.current);

    // Smooth spring animation for position
    const x = useSpring(initialX, { damping: 20, stiffness: 100 });
    const y = useSpring(initialY, { damping: 20, stiffness: 100 });

    useEffect(() => {
      if (!containerRef.current) return;
      const updatePosition = () => {
        const safeArea = getSafeArea();
        const currentX = x.get();
        const currentY = y.get();

        // Bounce off edges (now using card edges, not center)
        if (currentX <= safeArea.left) {
          velocityX.set(Math.abs(velocityX.get()));
        } else if (currentX >= safeArea.right) {
          velocityX.set(-Math.abs(velocityX.get()));
        }
        if (currentY <= safeArea.top) {
          velocityY.set(Math.abs(velocityY.get()));
        } else if (currentY >= safeArea.bottom) {
          velocityY.set(-Math.abs(velocityY.get()));
        }

        // Apply velocity
        x.set(currentX + velocityX.get());
        y.set(currentY + velocityY.get());

        // Gradually and randomly change speed (now up to 62.25)
        if (Math.random() < 0.01) {
          speed.current = Math.min(27, Math.max(2.25, speed.current + (Math.random() - 0.5) * 0.3));
          const currentAngle = Math.atan2(velocityY.get(), velocityX.get());
          velocityX.set(Math.cos(currentAngle) * speed.current);
          velocityY.set(Math.sin(currentAngle) * speed.current);
        }
        requestAnimationFrame(updatePosition);
      };
      const animationId = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(animationId);
    }, [x, y, velocityX, velocityY]);

    const accentColor = accentColors[cardIndex % accentColors.length];
    const buttonForegroundColor = getButtonForegroundColor(accentColor);

    // Use translation for title/description
    const title = t(`form_title_${cardIndex}`) || `Form Title ${cardIndex}`;
    const description = t(`form_description_${cardIndex}`) || `Form Description ${cardIndex}`;

    return (
      <motion.div
        ref={cardRef}
        style={{
          position: "absolute",
          width: cardWidth,
          height: cardHeight,
          x,
          y,
          zIndex: i + 5,
          pointerEvents: "none",
        }}
      >
        <FormCard
          data={getFormData(cardIndex)}
          columns={3}
          onClick={() => {}}
          onViewResponses={() => {}}
          onDelete={() => {}}
          onPublish={() => {}}
          optionalAccentColor={accentColor}
          optionalBorder={"var(--second-degree-lightened-background-adjacent-color)"}
          optionalButtonForeground={buttonForegroundColor}
          optionalTitle={title}
          optionalDescription={description}
        />
      </motion.div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 5,
        width: "100%",
        height: "100vh",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {cards.map((cardIndex, i) => (
          <Card key={`form-${cardIndex}`} i={i} cardIndex={cardIndex} />
        ))}
      </div>
    </div>
  );
};

export default FormFloatingBackground;
