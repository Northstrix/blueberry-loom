"use client";
import React, {
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
  CSSProperties,
} from "react";
import { motion, useMotionValue } from "framer-motion";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import { CanvasRevealEffect } from "@/components/ui/CanvasRevealEffect/CanvasRevealEffect";

interface PricingCardProps {
  planInscription: string;
  plan: string;
  currency: string;
  price: string | number;
  features: string[];
  onButtonClick?: () => void;
  buttonText?: string;
  padding?: string;
  isRtl?: boolean;
  spotlightColor?: string;
  spotlightRadius?: number;
}

const CHECKBOX_ANIMATION_DELAY = 280;
const CHECKBOX_START_DELAY = 500;

const CustomCheckbox: React.FC<{
  checked: boolean;
  accentColor?: string;
  highlightForeground?: string;
  id?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({
  checked,
  accentColor = "var(--theme-color)",
  highlightForeground = "var(--foreground)",
  id,
  disabled,
  style,
}) => (
  <motion.button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-disabled={disabled}
    tabIndex={0}
    id={id}
    className="flex items-center justify-center rounded-md"
    style={{
      width: 24,
      height: 24,
      background: disabled
        ? "var(--card-background)"
        : checked
        ? accentColor
        : "var(--background-adjacent-color)",
      border: `1.5px solid var(--lightened-background-adjacent-color)`,
      transition: "background 0.2s, border 0.2s",
      cursor: "not-allowed",
      position: "relative",
      padding: 0,
      ...style,
    }}
    disabled={true}
    whileTap={{ scale: 0.93 }}
    whileHover={disabled ? {} : { scale: 1.06 }}
  >
    {checked && (
      <motion.svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        stroke={highlightForeground}
        strokeWidth={3}
        fill="none"
        style={{ display: "block", pointerEvents: "none" }}
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          exit={{ pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        />
      </motion.svg>
    )}
  </motion.button>
);

const baseSizes = {
  inscription: 18,
  plan: 38,
  price: 43,
  feature: 18,
};

const PricingCard: React.FC<PricingCardProps> = ({
  planInscription,
  plan,
  currency,
  price,
  features,
  onButtonClick,
  buttonText = "Choose Plan",
  padding = "2.5rem",
  isRtl = false,
  spotlightColor = "#0ff",
}) => {
  // Spotlight logic
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({ currentTarget, clientX, clientY }: ReactMouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // Checkbox animation logic
  const [checkedList, setCheckedList] = useState<boolean[]>(Array(features.length).fill(false));
  const checkTimers = useRef<NodeJS.Timeout[]>([]);
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Responsive text sizing
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const getTextSizeReduction = (): number => {
    const width = windowWidth;
    if (width === null) return 0;
    if (width < 150) return 10;
    if (width < 325) return 8.2;
    if (width < 377) return 6;
    if (width < 401) return 4.8;
    if (width < 480) return 3.6;
    if (width < 520) return 2.2;
    if (width < 600) return 1;
    return 0;
  };
  const textSizeReduction = getTextSizeReduction();
  const getReducedSize = (key: keyof typeof baseSizes): number => baseSizes[key] - textSizeReduction;

  // Viewport detection
  useEffect(() => {
    if (!cardRef.current) return;
    const handleScroll = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = rect.top < vh * 0.6 && rect.bottom > vh * 0.4;
      setInView(visible);
    };
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      handleScroll();
    };
    setWindowWidth(window.innerWidth);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Animate checkboxes with delay after entering viewport
  useEffect(() => {
    if (inView) {
      const startTimer = setTimeout(() => {
        features.forEach((_, idx) => {
          checkTimers.current[idx] = setTimeout(() => {
            setCheckedList((prev) => {
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          }, CHECKBOX_ANIMATION_DELAY * idx);
        });
      }, CHECKBOX_START_DELAY);
      return () => {
        clearTimeout(startTimer);
        checkTimers.current.forEach((timer) => clearTimeout(timer));
      };
    } else {
      setCheckedList(Array(features.length).fill(false));
      checkTimers.current.forEach((timer) => clearTimeout(timer));
    }
  }, [inView, features.length]);

  // RTL/LTR logic
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";
  const checkboxMargin = isRtl
    ? { marginLeft: "0.7em", marginRight: 0 }
    : { marginRight: "0.7em", marginLeft: 0 };

  // --- Feature text line-breaking and card width logic ---
  // 1. Measure the widest feature text
  // 2. Expand the card to fit that width, up to the parent/container width
  // 3. If a feature still overflows, allow it to wrap to a second line, centering both lines with the checkbox

  const featureRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [cardMinWidth, setCardMinWidth] = useState<number | undefined>(undefined);
  const [featureLineBreak, setFeatureLineBreak] = useState<boolean[]>(features.map(() => false));

  // Measure widest feature on mount and when window resizes/features change
  useEffect(() => {
    if (!featureRefs.current.length) return;
    let widest = 0;
    featureRefs.current.forEach((ref) => {
      if (ref) {
        const width = ref.scrollWidth;
        if (width > widest) widest = width;
      }
    });
    // Add checkbox width and margin
    widest += 24 + 12;
    // Clamp to parent width if possible
    if (cardRef.current && cardRef.current.parentElement) {
      const parentWidth = cardRef.current.parentElement.clientWidth;
      setCardMinWidth(Math.min(widest, parentWidth));
    } else {
      setCardMinWidth(widest);
    }
  }, [windowWidth, features, textSizeReduction]);

  // Detect if feature text is clamped (overflows) and set line break for it
  useEffect(() => {
    setTimeout(() => {
      setFeatureLineBreak(
        featureRefs.current.map((ref) => {
          if (!ref) return false;
          // If scrollWidth > clientWidth, it's clamped
          return ref.scrollWidth > ref.clientWidth;
        })
      );
    }, 0);
  }, [cardMinWidth, features, textSizeReduction, windowWidth]);

  // Styles for feature text container
  const featureTextContainerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    width: "100%",
  };

  return (
    <motion.div
      ref={cardRef}
      className="group/spotlight relative border border-neutral-800 bg-black dark:border-neutral-800"
      style={{
        padding,
        direction: dir,
        textAlign: align,
        borderRadius: "var(--outer-card-radius)",
        maxWidth: "100%",
        minWidth: cardMinWidth,
        width: "fit-content",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "var(--card-background)",
        overflow: "hidden",
        border: isHovering
          ? "1px solid var(--lightened-background-adjacent-color, #0ff)"
          : "1px solid var(--background-adjacent-color, #0ff)",
        transition: "border-color 0.3s ease-in-out",
        boxSizing: "border-box",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Full-card CanvasRevealEffect on hover */}
      <motion.div
        className="pointer-events-none absolute z-0 inset-0 rounded-md"
        animate={{ opacity: isHovering ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          backgroundColor: isHovering ? spotlightColor : "transparent",
          borderRadius: "var(--outer-card-radius)",
        }}
      >
        {isHovering && (
          <CanvasRevealEffect
            animationSpeed={5}
            containerClassName="bg-transparent absolute inset-0 pointer-events-none"
            dotSize={3}
          />
        )}
      </motion.div>

      {/* Card content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
        }}
      >
        {/* Top Inscription */}
        <motion.div
          style={{
            color: "var(--theme-color)",
            fontWeight: 600,
            fontSize: `${getReducedSize("inscription")}px`,
            marginBottom: "0.7em",
            letterSpacing: ".01em",
            opacity: 0.92,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "color 0.3s",
          }}
          animate={{ color: isHovering ? "var(--foreground)" : "var(--theme-color)" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {planInscription}
        </motion.div>
        {/* Plan Name */}
        <div
          style={{
            fontWeight: isRtl ? 700 : 800,
            fontSize: `${getReducedSize("plan")}px`,
            marginBottom: "0.5em",
            color: "var(--foreground)",
            lineHeight: 1.1,
            letterSpacing: "-.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: align,
          }}
        >
          {plan}
        </div>
        {/* Price Row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: isRtl ? "flex-start" : "flex-start",
            marginLeft: isRtl ? "auto" : "0",
            gap: "0.18em",
            marginBottom: "2.3em",
            minWidth: 0,
            flexWrap: "nowrap",
            textAlign: "left",
          }}
        >
          {!isRtl && (
            <span
              style={{
                fontSize: `${getReducedSize("price")}px`,
                fontWeight: isRtl ? 700 : 800,
                color: "var(--foreground)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexShrink: 0,
              }}
            >
              {currency}
            </span>
          )}
          <span
            style={{
              fontSize: `${getReducedSize("price")}px`,
              fontWeight: 800,
              color: "var(--foreground)",
              lineHeight: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flexShrink: 0,
            }}
          >
            {price}
          </span>
          {isRtl && (
            <span
              style={{
                fontSize: `${getReducedSize("price")}px`,
                fontWeight: isRtl ? 700 : 800,
                color: "var(--foreground)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexShrink: 0,
              }}
            >
              {currency}
            </span>
          )}
        </div>
        {/* Feature List */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 2.7em 0",
            display: "flex",
            flexDirection: "column",
            gap: "1.05em",
            minWidth: 0,
          }}
        >
          {features.map((feature, idx) => (
            <li
              key={feature}
              style={{
                display: "flex",
                flexDirection: isRtl ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: isRtl ? "flex-end" : "flex-start",
                fontSize: `${getReducedSize("feature")}px`,
                fontWeight: 500,
                color: checkedList[idx] ? "var(--foreground)" : "var(--muted-foreground)",
                opacity: checkedList[idx] ? 1 : 0.6,
                transition: "color 0.18s, opacity 0.18s",
                pointerEvents: "none",
                userSelect: "none",
                minWidth: 0,
                // Remove whiteSpace: "nowrap" to allow wrapping if needed
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isRtl ? (
                <>
                  <span
                    style={{
                      ...featureTextContainerStyle,
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      minWidth: 0,
                      width: "100%",
                      textAlign: align,
                      whiteSpace: featureLineBreak[idx] ? "normal" : "nowrap",
                      wordBreak: featureLineBreak[idx] ? "break-word" : "normal",
                    }}
                    ref={(el) => (featureRefs.current[idx] = el)}
                  >
                    {feature}
                  </span>
                  <CustomCheckbox
                    checked={checkedList[idx]}
                    id={`pricing_c_${idx + 1}`}
                    accentColor="var(--theme-color)"
                    highlightForeground="var(--foreground)"
                    style={checkboxMargin}
                  />
                </>
              ) : (
                <>
                  <CustomCheckbox
                    checked={checkedList[idx]}
                    id={`pricing_c_${idx + 1}`}
                    accentColor="var(--theme-color)"
                    highlightForeground="var(--foreground)"
                    style={checkboxMargin}
                  />
                  <span
                    style={{
                      ...featureTextContainerStyle,
                      flexDirection: "column",
                      alignItems: isRtl ? "flex-end" : "flex-start",
                      justifyContent: "center",
                      minWidth: 0,
                      width: "100%",
                      textAlign: align,
                      whiteSpace: featureLineBreak[idx] ? "normal" : "nowrap",
                      wordBreak: featureLineBreak[idx] ? "break-word" : "normal",
                    }}
                    ref={(el) => (featureRefs.current[idx] = el)}
                  >
                    {feature}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        {/* Button */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: "auto",
            minWidth: 0,
          }}
        >
          <ChronicleButton text={buttonText} onClick={onButtonClick} width="100%" />
        </div>
      </div>
    </motion.div>
  );
};

export default PricingCard;
