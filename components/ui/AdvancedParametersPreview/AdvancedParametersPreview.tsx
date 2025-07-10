"use client";
import React, { useRef, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormMeta } from "@/types/formBuilder";
import RiggedInput from "./RiggedInput/RiggedInput";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import CustomCheckbox from "@/components/ui/CustomCheckBox/CustomCheckbox";
import CustomRadio from "@/components/ui/CustomRadio/CustomRadio";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import { useIsRtl } from "@/hooks/useIsRtl";

// RTL detection for label direction
const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
function detectRTL(str: string) {
  return RTL_REGEX.test(str);
}

interface Props {
  meta: FormMeta;
}

export default function AdvancedParametersPreview({ meta }: Props) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  // All values and labels are always up-to-date with the current language
  const userInputValue = t("user-input");
  const checkboxLabels = [
    t("selected-checkbox"),
    t("default-checkbox"),
    t("disabled-checkbox"),
  ];
  const radioLabels = [t("selected-radio"), t("unselected-radio")];

  const accentColor = meta.accentColor || "#00a0d8";
  const highlightForeground = meta.highlightForeground || "#fff";

  // Title and bare text alignment
  const titleText = t("section-inscription");
  const titleIsRtl = detectRTL(titleText);
  const bareText = t("text-anywhere");
  const bareTextIsRtl = detectRTL(bareText);

  // Refs for overlays
  const sectionRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [sectionOverlayStyle, setSectionOverlayStyle] = useState<React.CSSProperties>({});
  const [buttonsOverlayStyle, setButtonsOverlayStyle] = useState<React.CSSProperties>({});

  // Position overlays exactly over their targets
  useLayoutEffect(() => {
    function updateOverlays() {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setSectionOverlayStyle({
          position: "absolute",
          left: 0,
          top: 0,
          width: rect.width,
          height: rect.height,
          background: "transparent",
          zIndex: 10,
          pointerEvents: "all",
        });
      }
      if (buttonsRef.current) {
        const rect = buttonsRef.current.getBoundingClientRect();
        setButtonsOverlayStyle({
          position: "absolute",
          left: 0,
          top: 0,
          width: rect.width,
          height: rect.height,
          background: "transparent",
          zIndex: 10,
          pointerEvents: "all",
        });
      }
    }
    updateOverlays();
    window.addEventListener("resize", updateOverlays);
    return () => window.removeEventListener("resize", updateOverlays);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={sectionRef}
        className="advanced-demo-preview"
        style={{
          background: "var(--card-background)",
          borderRadius: "var(--general-rounding)",
          border: "1px solid var(--background-adjacent-color)",
          padding: "2.25rem 2.2rem",
          margin: "40px auto 0 auto",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          minWidth: 320,
          maxWidth: 520,
          width: "100%",
          fontFamily: "inherit",
        }}
      >
        {/* Title */}
        <div
          style={{
            color: "var(--foreground)",
            fontSize: "16px",
            fontWeight: 600,
            textAlign: titleIsRtl ? "right" : "left",
            direction: titleIsRtl ? "rtl" : "ltr",
            margin: 0,
            marginBottom: "29px",
          }}
        >
          {titleText}
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: "22px" }}>
          <RiggedInput
            label={t("label-of-active-input")}
            value={userInputValue}
            onValueChange={() => {}}
            alwaysActive
            accentColor={accentColor}
            isRTL={isRtl}
          />
        </div>
        <div style={{ marginBottom: "22px" }}>
          <FloatingLabelInput
            label={t("label-of-passive-input")}
            value={userInputValue}
            onValueChange={() => {}}
            accentColor={accentColor}
            isRTL={isRtl}
          />
        </div>
        <div style={{ marginBottom: "22px" }}>
          <FloatingLabelInput
            label={t("label-of-empty-input")}
            value={""}
            onValueChange={() => {}}
            accentColor={accentColor}
            isRTL={isRtl}
          />
        </div>
        {/* Extra text */}
        <div
          style={{
            color: "var(--foreground)",
            fontSize: "15px",
            fontWeight: 400,
            textAlign: bareTextIsRtl ? "right" : "left",
            direction: bareTextIsRtl ? "rtl" : "ltr",
            margin: 0,
            marginBottom: "22px",
          }}
        >
          {bareText}
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map((i) => {
              const label = checkboxLabels[i];
              const isLabelRTL = detectRTL(label);
              return (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    userSelect: "none",
                    opacity: i === 2 ? 0.6 : 1,
                    flexDirection: isLabelRTL ? "row-reverse" : "row",
                    textAlign: isLabelRTL ? "right" : "left",
                    width: "100%",
                    justifyContent: isLabelRTL ? "flex-end" : "flex-start",
                  }}
                  dir={isLabelRTL ? "rtl" : "ltr"}
                >
                  {isLabelRTL ? (
                    <>
                      <span>{label}</span>
                      <CustomCheckbox
                        checked={i === 0}
                        onChange={() => {}}
                        id={["selected-checkbox", "default-checkbox", "disabled-checkbox"][i]}
                        accentColor={accentColor}
                        highlightForeground={highlightForeground}
                        disabled={i === 2}
                      />
                    </>
                  ) : (
                    <>
                      <CustomCheckbox
                        checked={i === 0}
                        onChange={() => {}}
                        id={["selected-checkbox", "default-checkbox", "disabled-checkbox"][i]}
                        accentColor={accentColor}
                        highlightForeground={highlightForeground}
                        disabled={i === 2}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Radios */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1].map((i) => {
              const label = radioLabels[i];
              const isLabelRTL = detectRTL(label);
              return (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    userSelect: "none",
                    flexDirection: isLabelRTL ? "row-reverse" : "row",
                    textAlign: isLabelRTL ? "right" : "left",
                    width: "100%",
                    justifyContent: isLabelRTL ? "flex-end" : "flex-start",
                  }}
                  dir={isLabelRTL ? "rtl" : "ltr"}
                >
                  {isLabelRTL ? (
                    <>
                      <span>{label}</span>
                      <CustomRadio
                        checked={i === 0}
                        onChange={() => {}}
                        id={["radio-selected", "radio-unselected"][i]}
                        accentColor={accentColor}
                        highlightForeground={highlightForeground}
                      />
                    </>
                  ) : (
                    <>
                      <CustomRadio
                        checked={i === 0}
                        onChange={() => {}}
                        id={["radio-selected", "radio-unselected"][i]}
                        accentColor={accentColor}
                        highlightForeground={highlightForeground}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        </div>
        {/* Section overlay */}
        <div
          style={{
            ...sectionOverlayStyle,
            top: 0,
            left: 0,
            pointerEvents: "all",
          }}
          tabIndex={-1}
          aria-hidden="true"
          onClick={e => e.preventDefault()}
          onMouseDown={e => e.preventDefault()}
          onMouseUp={e => e.preventDefault()}
          onMouseMove={e => e.preventDefault()}
          onMouseEnter={e => e.preventDefault()}
          onMouseLeave={e => e.preventDefault()}
          onFocus={e => e.preventDefault()}
          onKeyDown={e => e.preventDefault()}
        />
      </div>

      {/* Chronicle Buttons below the section */}
      <div
        ref={buttonsRef}
        style={{
          margin: "18px auto 0 auto",
          maxWidth: 520,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative"
        }}
      >
        <ChronicleButton
          text={t("submit-button")}
          onClick={() => {}}
          width="100%"
        />
        <ChronicleButton
          text={t("hovered-submit-button")}
          onClick={() => {}}
          width="100%"
          customBackground={accentColor}
          customForeground={highlightForeground}
          hoverColor={accentColor}
          hoverForeground={highlightForeground}
        />
        <style jsx global>{`
          .advanced-demo-preview + div .chronicleButton + .chronicleButton,
          .advanced-demo-preview + div .chronicleButton + .chronicleButton:hover {
            background: ${accentColor} !important;
            color: ${highlightForeground} !important;
            filter: brightness(1.08);
            pointer-events: none !important;
            box-shadow: none !important;
          }
        `}</style>
        {/* Buttons overlay */}
        <div
          style={{
            ...buttonsOverlayStyle,
            top: 0,
            left: 0,
            pointerEvents: "all",
          }}
          tabIndex={-1}
          aria-hidden="true"
          onClick={e => e.preventDefault()}
          onMouseDown={e => e.preventDefault()}
          onMouseUp={e => e.preventDefault()}
          onMouseMove={e => e.preventDefault()}
          onMouseEnter={e => e.preventDefault()}
          onMouseLeave={e => e.preventDefault()}
          onFocus={e => e.preventDefault()}
          onKeyDown={e => e.preventDefault()}
        />
      </div>
    </div>
  );
}
