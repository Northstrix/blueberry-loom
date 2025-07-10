// --- Base64 helpers ---
const encodeB64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
const decodeB64 = (b64: string) => decodeURIComponent(escape(atob(b64)));

// --- Element encoding ---
function encodeElement(el: any): string {
  switch (el.type) {
    case "text":
      return `(text:${encodeB64(el.text)})`;
    case "input":
      return `(input:${encodeB64(el.text)}:${encodeB64(el.key)})`;
    case "textarea":
      return `(textarea:${encodeB64(el.text)}:${encodeB64(el.key)}:${el.height ?? ""})`;
    case "checkboxes":
      return `(checkboxes:${encodeB64(el.key)}:${el.options.map((o: any) => `${encodeB64(o.text)}|${encodeB64(o.value)}`).join(",")}:${el.allowMultiple ? "1" : "0"}:${el.maxSelected ?? ""})`;
    case "radio":
      return `(radio:${encodeB64(el.key)}:${el.options.map((o: any) => `${encodeB64(o.text)}|${encodeB64(o.value)}`).join(",")}:${el.allowUnselect ? "1" : "0"})`;
    default:
      return "";
  }
}

// --- Section encoding ---
function encodeSection(section: any): string {
  return `{${section.elements.map(encodeElement).join("")}}`;
}

// --- Meta encoding ---
function encodeMeta(meta: any): string {
  return [
    encodeB64(meta.title),
    encodeB64(meta.description),
    encodeB64(meta.responseModal?.primary || ""),
    encodeB64(meta.responseModal?.subtext || ""),
    encodeB64(meta.successNotification || ""),
    encodeB64(meta.accentColor || ""),
    encodeB64(meta.highlightForeground || ""),
    encodeB64(meta.author || ""),
    encodeB64(meta.fingerprint || "")
  ].join(":");
}

// --- Full form encoding ---
export function encodeFormTemplate(form: any): string {
  return `META(${encodeMeta(form.meta)})` + form.sections.map(encodeSection).join("");
}

// --- Element decoding ---
function decodeElement(str: string): any {
  const match = str.match(/^\(([^:]+):(.+)\)$/);
  if (!match) return null;
  const [_, type, rest] = match;
  const parts = rest.split(":");
  switch (type) {
    case "text":
      return { type, text: decodeB64(parts[0]) };
    case "input":
      return { type, text: decodeB64(parts[0]), key: decodeB64(parts[1]) };
    case "textarea":
      return { type, text: decodeB64(parts[0]), key: decodeB64(parts[1]), height: parts[2] ? Number(parts[2]) : undefined };
    case "checkboxes":
      return {
        type,
        key: decodeB64(parts[0]),
        options: parts[1]
          ? parts[1].split(",").map((pair: string) => {
              const [t, v] = pair.split("|");
              return { text: decodeB64(t), value: decodeB64(v) };
            })
          : [],
        allowMultiple: parts[2] === "1",
        maxSelected: parts[3] ? Number(parts[3]) : undefined
      };
    case "radio":
      return {
        type,
        key: decodeB64(parts[0]),
        options: parts[1]
          ? parts[1].split(",").map((pair: string) => {
              const [t, v] = pair.split("|");
              return { text: decodeB64(t), value: decodeB64(v) };
            })
          : [],
        allowUnselect: parts[2] === "1"
      };
    default:
      return null;
  }
}

// --- Section decoding ---
function decodeSection(str: string): any {
  const elements: any[] = [];
  let rest = str.slice(1, -1); // remove {}
  while (rest.length) {
    const elMatch = rest.match(/^\(([^)]+)\)/);
    if (!elMatch) break;
    const elStr = elMatch[0];
    elements.push(decodeElement(elStr));
    rest = rest.slice(elStr.length);
  }
  return { elements };
}

// --- Meta decoding ---
function decodeMeta(str: string) {
  const [
    title,
    description,
    responseModalPrimary,
    responseModalSubtext,
    successNotification,
    accentColor,
    highlightForeground,
    author,
    fingerprint
  ] = str.split(":").map(decodeB64);
  return {
    title,
    description,
    responseModal: { primary: responseModalPrimary, subtext: responseModalSubtext },
    successNotification,
    accentColor,
    highlightForeground,
    author,
    fingerprint
  };
}

// --- Full form decoding ---
export function decodeFormTemplate(encoded: string): any {
  const metaMatch = encoded.match(/^META\(([^)]+)\)/);
  if (!metaMatch) throw new Error("No meta found");
  const metaStr = metaMatch[1];
  const meta = decodeMeta(metaStr);

  let rest = encoded.slice(metaMatch[0].length);
  const sections: any[] = [];
  while (rest.startsWith("{")) {
    let depth = 0, end = 0;
    for (let i = 0; i < rest.length; ++i) {
      if (rest[i] === "{") depth++;
      if (rest[i] === "}") depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
    if (end === 0) break;
    const sectionStr = rest.slice(0, end);
    sections.push(decodeSection(sectionStr));
    rest = rest.slice(end);
  }
  return { meta, sections };
}
