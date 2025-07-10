// types/formBuilder.ts

export type FormMeta = {
  title: string;
  description: string;
  responseModal: { primary: string; subtext: string };
  successNotification: string;
  accentColor?: string;
  highlightForeground?: string;
  author?: string;
  fingerprint?: string;
  onAuthorClick?: () => void;
  onFingerprintClick?: () => void;
};

export type TextElement = { type: "text"; text: string };
export type InputElement = { type: "input"; text: string; key: string };
export type TextareaElement = { type: "textarea"; text: string; key: string; height?: number };

export type CheckboxOption = { text: string; value: string };
export type CheckboxesElement = {
  type: "checkboxes";
  key: string;
  options: CheckboxOption[];
  allowMultiple?: boolean;
  maxSelected?: number;
};

export type RadioOption = { text: string; value: string };
export type RadioElement = {
  type: "radio";
  key: string;
  options: RadioOption[];
  allowUnselect?: boolean;
};

export type SectionElement =
  | TextElement
  | InputElement
  | TextareaElement
  | CheckboxesElement
  | RadioElement;

export type Section = { elements: SectionElement[] };

export type FormSchema = { meta: FormMeta; sections: Section[] };
