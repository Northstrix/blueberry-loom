"use client";
import React from "react";
import {
  FormSchema,
  SectionElement,
  TextElement,
  InputElement,
  TextareaElement,
  CheckboxesElement,
  RadioElement,
  CheckboxOption,
  RadioOption,
} from "@/types/formBuilder";

// --- Base64 helpers ---
const encode = (str: string) => btoa(unescape(encodeURIComponent(str)));
const decode = (str: string) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
};

function parseResult(str: string) {
  // Returns: Array of sections, each with {elements: [{label, value}]}
  const sections: { elements: { label: string; value: string }[] }[] = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === "[") {
      i++;
      const elements: { label: string; value: string }[] = [];
      while (i < str.length && str[i] === "[") {
        i++;
        let label = "";
        while (i < str.length && str[i] !== ":") label += str[i++];
        i++;
        let value = "";
        while (i < str.length && str[i] !== "]") value += str[i++];
        i++;
        elements.push({ label: decode(label), value });
      }
      if (i < str.length && str[i] === "]") i++;
      sections.push({ elements });
    } else {
      i++;
    }
  }
  return sections;
}

// --- Type guards ---
function isTextElement(el: SectionElement): el is TextElement {
  return el.type === "text";
}
function isInputElement(el: SectionElement): el is InputElement {
  return el.type === "input";
}
function isTextareaElement(el: SectionElement): el is TextareaElement {
  return el.type === "textarea";
}
function isCheckboxesElement(el: SectionElement): el is CheckboxesElement {
  return el.type === "checkboxes";
}
function isRadioElement(el: SectionElement): el is RadioElement {
  return el.type === "radio";
}

interface FormResultDecoderProps {
  result: string;
  template: FormSchema | null;
}

const FormResultDecoder: React.FC<FormResultDecoderProps> = ({ result, template }) => {
  // Parse the encoded result into a map: label -> value
  const parsed = parseResult(result);
  // Build a flat map of label -> value for all fields in all sections
  const answerMap = new Map<string, string>();
  parsed.forEach(section =>
    section.elements.forEach((el) => {
      answerMap.set(el.label, el.value);
    })
  );

  // Helper: for checkboxes/radios, get the template element by key
  const groupMap = new Map<string, CheckboxesElement | RadioElement>();
  if (template) {
    template.sections.forEach(section => {
      section.elements.forEach((el) => {
        if (isCheckboxesElement(el) || isRadioElement(el)) {
          groupMap.set(el.key, el);
        }
      });
    });
  }

  return (
    <div className="mt-2">
      {template
        ? template.sections.map((section, i) => (
            <div
              key={i}
              style={{
                padding: "1rem",
                background: "var(--background)",
                border: "1px solid var(--background-adjacent-color)",
                borderRadius: "var(--general-rounding)",
                marginBottom: "0.5rem",
                transition: "border-color 0.3s",
              }}
            >
              <ul className="ml-4 list-disc">
                {section.elements.map((el, j) => {
                  // --- Static text/textarea (no key): always show, no bullet
                  if (
                    isTextElement(el) ||
                    (isTextareaElement(el) && (!el.key || el.key === ""))
                  ) {
                    return (
                      <li
                        key={j}
                        style={{
                          marginBottom: 6,
                          borderRadius: "var(--general-rounding)",
                          color: "var(--muted-foreground)",
                          fontStyle: "italic",
                          listStyle: "none",
                          paddingLeft: 0,
                        }}
                      >
                        {el.text}
                      </li>
                    );
                  }
                  // --- Inputs/textarea with key ---
                  if ((isInputElement(el) || isTextareaElement(el)) && el.key) {
                    const value = answerMap.get(el.text) ?? answerMap.get(el.key);
                    return (
                      <li key={j} style={{ marginBottom: 6, borderRadius: "var(--general-rounding)" }}>
                        <span
                          style={{
                            color: "var(--subtle-color)",
                            fontWeight: 600,
                            fontSize: "0.98em",
                            marginRight: 6,
                            whiteSpace: "nowrap",
                            display: "inline",
                          }}
                        >
                          {el.text}:
                        </span>
                        <span style={{ display: "inline" }}>
                          {value === "n" || value === null || value === undefined
                            ? (
                              <span className="text-[var(--muted-foreground)] italic">
                                No value
                              </span>
                            )
                            : (() => {
                                try {
                                  return decode(value);
                                } catch {
                                  return value;
                                }
                              })()}
                        </span>
                      </li>
                    );
                  }
                  // --- Checkboxes/radios ---
                  if ((isCheckboxesElement(el) || isRadioElement(el)) && el.key) {
                    const templateEl = groupMap.get(el.key);
                    let selectedValues: string[] = [];
                    const value = answerMap.get(el.key) ?? answerMap.get(el.text);
                    if (
                      value !== "n" &&
                      value !== null &&
                      value !== undefined &&
                      value !== ""
                    ) {
                      selectedValues = value.includes(",")
                        ? value.split(",").map((v: string) => {
                            try {
                              return decode(v);
                            } catch {
                              return v;
                            }
                          })
                        : [
                            (() => {
                              try {
                                return decode(value);
                              } catch {
                                return value;
                              }
                            })(),
                          ];
                    }
                    return (
                      <li
                        key={j}
                        style={{
                          marginBottom: 6,
                          borderRadius: "var(--general-rounding)",
                        }}
                      >
                        <ul
                          style={{
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            display: "inline-flex",
                            flexWrap: "wrap",
                            gap: 10,
                            verticalAlign: "middle",
                          }}
                        >
                          {templateEl &&
                            templateEl.options.map(
                              (opt: CheckboxOption | RadioOption, idx: number) => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                  <li
                                    key={idx}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: "2px 10px",
                                      borderRadius: "var(--general-rounding)",
                                      background: "transparent",
                                      color: isSelected
                                        ? "var(--theme-green)"
                                        : "var(--foreground)",
                                      fontWeight: isSelected ? 700 : 400,
                                      textDecoration: isSelected ? "underline" : "none",
                                      textDecorationColor: isSelected
                                        ? "var(--theme-green)"
                                        : "inherit",
                                      textDecorationThickness: isSelected
                                        ? "2px"
                                        : "initial",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    {opt.text}
                                  </li>
                                );
                              }
                            )}
                        </ul>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          ))
        : null}
    </div>
  );
};

export default FormResultDecoder;
