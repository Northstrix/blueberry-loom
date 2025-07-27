"use client";
import React, { useState, useMemo, useEffect } from "react";
import ChronicleButton from "@/components/ui/ChronicleButton/ChronicleButton";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput/FloatingLabelInput";
import CustomCheckbox from "@/components/ui/CustomCheckBox/CustomCheckbox";
import CustomRadio from "@/components/ui/CustomRadio/CustomRadio";
import { FormSchema } from "@/types/formBuilder";
import { useTranslation } from "react-i18next";

// --- RTL detection ---
const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
function detectRTL(str: string) {
  return RTL_REGEX.test(str);
}

// --- Types ---
interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (encoded: string) => void;
  cardPadding?: string;
  cardGap?: string;
  sectionTextSize?: string;
  elementTextSize?: string;
  author?: string;
  fingerprint?: string;
  onAuthorClick?: () => void;
  onFingerprintClick?: () => void;
}

const DEFAULT_SECTION_TEXT_SIZE = "16px";
const DEFAULT_ELEMENT_TEXT_SIZE = "15px";
const GAP_BETWEEN_ELEMENTS = 22;
const GAP_AFTER_TOP_TEXT = 29;
const GAP_AFTER_TOP_TEXT_REDUCED = GAP_AFTER_TOP_TEXT - 20; // 9px

const encode = (str: string) => btoa(unescape(encodeURIComponent(str)));

const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  onSubmit,
  cardPadding = "2.25rem 2.2rem",
  cardGap = "2rem",
  sectionTextSize = DEFAULT_SECTION_TEXT_SIZE,
  elementTextSize = DEFAULT_ELEMENT_TEXT_SIZE,
  author, fingerprint, onAuthorClick, onFingerprintClick
}) => {
  const [form, setForm] = useState<Record<string, any>>({});
  const { t } = useTranslation();

  function getResponsiveFontSize() {
    const w = window.innerWidth;
    if (w > 800) return "14px";
    if (w > 700) return "13.6px";
    if (w > 600) return "13px";
    if (w > 500) return "12px";
    if (w > 400) return "11.2px";
    if (w > 380) return "10.4px";
    if (w > 360) return "10.2px";
    if (w > 340) return "10px";
    return "7.5px";
  }

  const [fontSize, setFontSize] = useState(getResponsiveFontSize());

  useEffect(() => {
    function handleResize() {
      setFontSize(getResponsiveFontSize());
    }
    window.addEventListener("resize", handleResize);
    // Set font size on mount in case window was resized before mount
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- RTL detection for title/desc/section text ---
  const titleRTL = useMemo(() => detectRTL(schema.meta.title), [schema.meta.title]);
  const descRTL = useMemo(() => detectRTL(schema.meta.description), [schema.meta.description]);

  // --- Change handlers ---
  const handleChange = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  // --- Submit logic ---
  const handleSubmit = () => {
    const result = schema.sections
      .map(
        (section) =>
          "[" +
          section.elements
            .map((el) => {
              if (el.type === "text") return "";
              if (el.type === "input" || el.type === "textarea") {
                const val = form[el.key];
                return (
                  "[" +
                  encode(el.text) +
                  ":" +
                  (val && val !== "" ? encode(val) : "n") +
                  "]"
                );
              }
              if (el.type === "checkboxes") {
                const vals: string[] = form[el.key] || [];
                return (
                  "[" +
                  encode(el.key) +
                  ":" +
                  (vals.length
                    ? vals
                        .map((v) =>
                          // Always encode values for consistency
                          encode(v)
                        )
                        .join(",")
                    : "n") +
                  "]"
                );
              }
              if (el.type === "radio") {
                const val: string | undefined = form[el.key];
                return (
                  "[" +
                  encode(el.key) +
                  ":" +
                  (val ? encode(val) : "n") +
                  "]"
                );
              }
              return "";
            })
            .join("") +
          "]"
      )
      .join("");
    onSubmit(result);
  };

  // --- Render ---
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      autoComplete="on"
      style={{
        width: "100%",
        maxHeight: "unset",
        background: "none",
        border: "none",
        boxShadow: "none",
        display: "flex",
        flexDirection: "column",
        gap: cardGap,
        alignItems: "center",
      }}
    >
      {/* Title/Description Card */}
      <div
        style={{
          width: "100%",
          background: "var(--card-background)",
          borderRadius: "var(--general-rounding)",
          border: "1px solid var(--background-adjacent-color)",
          padding: cardPadding,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          transition: "border-color 0.3s, background 0.3s, color 0.3s",
        }}
      >
        <h1
          className="font-bold"
          style={{
            fontSize: "2rem",
            color: "var(--foreground)",
            textAlign: titleRTL ? "right" : "left",
            direction: titleRTL ? "rtl" : "ltr",
            letterSpacing: "-0.01em",
            margin: 0,
            marginBottom: "0.5rem",
          }}
        >
          {schema.meta.title}
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--muted-foreground)",
            lineHeight: 1.5,
            textAlign: descRTL ? "right" : "left",
            direction: descRTL ? "rtl" : "ltr",
            margin: 0,
          }}
        >
          {schema.meta.description}
        </p>
        {/* Author & Fingerprint */}
        {(author || fingerprint) && (
          <div style={{ marginTop: "1rem" }}>
            {author && (
              <div
                style={{
                  fontSize: "16px",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.7,
                  marginBottom: fingerprint ? "0.25rem" : 0,
                }}
              >
                <span style={{ fontWeight: 700 }}>{t("author")}:</span>{" "}
                <span
                  style={{
                    textDecorationColor: "var(--muted-foreground)",
                    cursor: onAuthorClick ? "pointer" : "default",
                  }}
                  onClick={onAuthorClick}
                >
                  {author}
                </span>
              </div>
            )}
            {fingerprint && (
              <div
                style={{
                  fontSize: "16px",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.7,
                }}
              >
                <span style={{ fontWeight: 700 }}>{t("author-fingerprint")}:</span>{" "}
                <span
                  style={{
                    textDecorationColor: "var(--muted-foreground)",
                    cursor: onFingerprintClick ? "pointer" : "default",
                  }}
                  onClick={onFingerprintClick}
                >
                  {fingerprint}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Sections */}
      {schema.sections.map((section, i) => {
        const elements = section.elements;
        const isSingleTextSection =
          elements.length === 1 && elements[0].type === "text";
        return (
          <div
            key={i}
            style={{
              width: "100%",
              background: "var(--card-background)",
              borderRadius: "var(--general-rounding)",
              border: "1px solid var(--background-adjacent-color)",
              padding: cardPadding,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              transition: "border-color 0.3s, background 0.3s, color 0.3s",
            }}
          >
            {elements.map((el, j) => {
              // --- TEXT ELEMENTS ---
              if (el.type === "text") {
                const sectionTextRTL = detectRTL(el.text);
                const isFirst = j === 0;
                const isPrevText =
                  j > 0 && elements[j - 1] && elements[j - 1].type === "text";
                const isPrevNonText =
                  j > 0 && elements[j - 1] && elements[j - 1].type !== "text";
                const isNext = j + 1 < elements.length;
                const isNextNonText =
                  isNext && elements[j + 1] && elements[j + 1].type !== "text";
                // Single text element in section: use reference style, no extra margin
                if (isSingleTextSection) {
                  return (
                    <div
                      key={j}
                      style={{
                        color: "var(--foreground)",
                        fontSize: sectionTextSize,
                        fontWeight: 600,
                        textAlign: sectionTextRTL ? "right" : "left",
                        direction: sectionTextRTL ? "rtl" : "ltr",
                        margin: 0,
                      }}
                    >
                      {el.text}
                    </div>
                  );
                }
                // First text in section: always bold, special reduced bottom margin if next is non-text
                if (isFirst) {
                  return (
                    <div
                      key={j}
                      style={{
                        color: "var(--foreground)",
                        fontSize: sectionTextSize,
                        fontWeight: 600,
                        textAlign: sectionTextRTL ? "right" : "left",
                        direction: sectionTextRTL ? "rtl" : "ltr",
                        margin: 0,
                        marginBottom:
                          isNextNonText && isNext
                            ? GAP_AFTER_TOP_TEXT_REDUCED
                            : isNext
                            ? GAP_BETWEEN_ELEMENTS
                            : 0,
                      }}
                    >
                      {el.text}
                    </div>
                  );
                }
                // Consecutive text (not first): only marginTop: 22px
                if (isPrevText) {
                  return (
                    <div
                      key={j}
                      style={{
                        color: "var(--foreground)",
                        fontSize: sectionTextSize,
                        fontWeight: 400,
                        textAlign: sectionTextRTL ? "right" : "left",
                        direction: sectionTextRTL ? "rtl" : "ltr",
                        margin: 0,
                        marginTop: GAP_BETWEEN_ELEMENTS,
                        marginBottom: 0,
                      }}
                    >
                      {el.text}
                    </div>
                  );
                }
                // Text after non-text: marginTop: 22px
                if (isPrevNonText) {
                  return (
                    <div
                      key={j}
                      style={{
                        color: "var(--foreground)",
                        fontSize: sectionTextSize,
                        fontWeight: 400,
                        textAlign: sectionTextRTL ? "right" : "left",
                        direction: sectionTextRTL ? "rtl" : "ltr",
                        margin: 0,
                        marginTop: GAP_BETWEEN_ELEMENTS,
                        marginBottom: 0,
                      }}
                    >
                      {el.text}
                    </div>
                  );
                }
                // Any other text (shouldn't happen, but fallback)
                return (
                  <div
                    key={j}
                    style={{
                      color: "var(--foreground)",
                      fontSize: sectionTextSize,
                      fontWeight: 400,
                      textAlign: sectionTextRTL ? "right" : "left",
                      direction: sectionTextRTL ? "rtl" : "ltr",
                      margin: 0,
                    }}
                  >
                    {el.text}
                  </div>
                );
              }

              // --- NON-TEXT ELEMENTS ---
              // If this is not the first element, always add marginTop: 22px (except for the first element)
              const marginTop = j > 0 ? GAP_BETWEEN_ELEMENTS : undefined;

              if (el.type === "input") {
                return (
                  <div key={el.key} style={{ marginTop }}>
                    <FloatingLabelInput
                      label={el.text}
                      value={form[el.key] || ""}
                      onValueChange={(v) => handleChange(el.key, v)}
                      type="text"
                      disabled={false}
                      isRTL={detectRTL(el.text)}
                      accentColor={schema.meta.accentColor}
                    />
                  </div>
                );
              }
              if (el.type === "textarea") {
                let textareaHeight: string | undefined = undefined;
                if (el.height !== undefined) {
                  textareaHeight =
                    typeof el.height === "number"
                      ? `${el.height}px`
                      : el.height;
                }
                return (
                  <div key={el.key} style={{ marginTop }}>
                    <FloatingLabelInput
                      label={el.text}
                      value={form[el.key] || ""}
                      onValueChange={(v) => handleChange(el.key, v)}
                      type="textarea"
                      textarea
                      disabled={false}
                      isRTL={detectRTL(el.text)}
                      accentColor={schema.meta.accentColor}
                      {...(textareaHeight ? { textareaHeight } : {})}
                    />
                  </div>
                );
              }
              if (el.type === "checkboxes") {
                const vals: string[] = form[el.key] || [];
                const maxSelected = el.maxSelected || 0;
                const atMax =
                  !!el.allowMultiple && maxSelected > 0 && vals.length >= maxSelected;
                return (
                  <div key={el.key} style={{ marginTop }}>
                    <div className="flex flex-col gap-2">
                      {el.options.map((opt) => {
                        const checked = vals.includes(opt.value);
                        const disabled = atMax && !checked;
                        const isLabelRTL = detectRTL(opt.text);
                        return (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 cursor-pointer w-fit"
                            style={{
                              fontSize: elementTextSize,
                              userSelect: "none",
                              opacity: disabled ? 0.6 : 1,
                              cursor: disabled ? "not-allowed" : "pointer",
                              flexDirection: isLabelRTL ? "row-reverse" : "row",
                              textAlign: isLabelRTL ? "right" : "left",
                              width: "100%",
                              justifyContent: isLabelRTL ? "flex-end" : "flex-start",
                            }}
                            dir={isLabelRTL ? "rtl" : "ltr"}
                            onClick={(e) => {
                              e.preventDefault();
                              if (disabled) return;
                              if (checked) {
                                setForm((f) => ({
                                  ...f,
                                  [el.key]: vals.filter((v) => v !== opt.value),
                                }));
                              } else {
                                setForm((f) => ({
                                  ...f,
                                  [el.key]: el.allowMultiple
                                    ? [...vals, opt.value]
                                    : [opt.value],
                                }));
                              }
                            }}
                          >
                            {isLabelRTL ? (
                              <>
                                <span>{opt.text}</span>
                                <CustomCheckbox
                                  checked={checked}
                                  onChange={(checked) => {
                                    if (disabled) return;
                                    if (vals.includes(opt.value)) {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: vals.filter((v) => v !== opt.value),
                                      }));
                                    } else {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: el.allowMultiple
                                          ? [...vals, opt.value]
                                          : [opt.value],
                                      }));
                                    }
                                  }}
                                  accentColor={schema.meta.accentColor}
                                  highlightForeground={schema.meta.highlightForeground}
                                  id={el.key + "-" + opt.value}
                                  disabled={disabled}
                                />
                              </>
                            ) : (
                              <>
                                <CustomCheckbox
                                  checked={checked}
                                  onChange={(checked) => {
                                    if (disabled) return;
                                    if (vals.includes(opt.value)) {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: vals.filter((v) => v !== opt.value),
                                      }));
                                    } else {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: el.allowMultiple
                                          ? [...vals, opt.value]
                                          : [opt.value],
                                      }));
                                    }
                                  }}
                                  accentColor={schema.meta.accentColor}
                                  highlightForeground={schema.meta.highlightForeground}
                                  id={el.key + "-" + opt.value}
                                  disabled={disabled}
                                />
                                <span>{opt.text}</span>
                              </>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (el.type === "radio") {
                const val: string | undefined = form[el.key];
                return (
                  <div key={el.key} style={{ marginTop }}>
                    <div className="flex flex-col gap-2">
                      {el.options.map((opt) => {
                        const isLabelRTL = detectRTL(opt.text);
                        return (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 cursor-pointer w-fit"
                            style={{
                              fontSize: elementTextSize,
                              userSelect: "none",
                              flexDirection: isLabelRTL ? "row-reverse" : "row",
                              textAlign: isLabelRTL ? "right" : "left",
                              width: "100%",
                              justifyContent: isLabelRTL ? "flex-end" : "flex-start",
                            }}
                            dir={isLabelRTL ? "rtl" : "ltr"}
                            onClick={(e) => {
                              e.preventDefault();
                              if (
                                val === opt.value &&
                                (true)
                              ) {
                                setForm((f) => ({
                                  ...f,
                                  [el.key]: undefined,
                                }));
                              } else {
                                setForm((f) => ({
                                  ...f,
                                  [el.key]: opt.value,
                                }));
                              }
                            }}
                          >
                            {isLabelRTL ? (
                              <>
                                <span>{opt.text}</span>
                                <CustomRadio
                                  checked={val === opt.value}
                                  onChange={(checked) => {
                                    if (
                                      val === opt.value &&
                                      (true)
                                    ) {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: undefined,
                                      }));
                                    } else {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: opt.value,
                                      }));
                                    }
                                  }}
                                  accentColor={schema.meta.accentColor}
                                  highlightForeground={schema.meta.highlightForeground}
                                  allowUnselect={true}
                                  disabled={false}
                                  id={el.key + "-" + opt.value}
                                />
                              </>
                            ) : (
                              <>
                                <CustomRadio
                                  checked={val === opt.value}
                                  onChange={(checked) => {
                                    if (
                                      val === opt.value &&
                                      (true)
                                    ) {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: undefined,
                                      }));
                                    } else {
                                      setForm((f) => ({
                                        ...f,
                                        [el.key]: opt.value,
                                      }));
                                    }
                                  }}
                                  accentColor={schema.meta.accentColor}
                                  highlightForeground={schema.meta.highlightForeground}
                                  allowUnselect={true}
                                  disabled={false}
                                  id={el.key + "-" + opt.value}
                                />
                                <span>{opt.text}</span>
                              </>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      })}
      {/* ChronicleButton below the lowest card */}
      <div
        style={{
          width: "100%",
          margin: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChronicleButton
          text="Submit"
          onClick={handleSubmit}
          width="100%"
          hoverColor={schema.meta.accentColor || "var(--theme-color)"}
          hoverForeground={schema.meta.highlightForeground || "var(--foreground)"}
          borderRadius="var(--general-rounding)"
        />
      </div>
      {/* Footer */}
      <div
        style={{
          width: "100%",
          marginBottom: cardGap,
          textAlign: "center",
          fontSize: fontSize, // <-- We'll define this below
          color: "var(--muted-foreground)",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          This content was neither created nor endorsed by{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Blueberry Loom
          </a>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          By using the Blueberry Loom you're accepting the{" "}
          <a
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Terms of Use
          </a>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          The source code of this web app is available on{" "}
          <a
            href="https://github.com/Northstrix/blueberry-loom"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            GitHub
          </a>
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          Made by{" "}
          <a
            href="https://maxim-bortnikov.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Maxim Bortnikov
          </a>
          {" "}using{" "}
          <a
            href="https://nextjs.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Next.js
          </a>,
          {" "}
          <a
            href="https://vuejs.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Vue.js
          </a>,
          {" "}and{" "}
          <a
            href="https://www.perplexity.ai/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--theme-color)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Perplexity
          </a>
        </div>
      </div>

    </form>
  );
};

export default FormRenderer;
