"use client"
// utils/decodeURL.ts

/**
 * Decodes percent-encoded strings if present.
 * If decoding fails, returns the original input.
 */
export function decodePercentEncoding(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

/**
 * Decodes a custom base64 string where
 * '(' is used instead of '+', and ')' instead of '/'.
 */
export function customBase64Decode(encoded: string): string {
  const base64 = encoded.replace(/\(/g, "+").replace(/\)/g, "/");
  return atob(base64);
}

/**
 * Decodes a custom base64 string to a UTF-8 string.
 */
export function customBase64ToUtf8(encoded: string): string {
  const binaryString = customBase64Decode(encoded);
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(binaryString, (c: string) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );
  } catch {
    // fallback for non-UTF8
    return binaryString;
  }
}

/**
 * Decodes a custom base64 string to a Uint8Array.
 */
export function customBase64ToUint8Array(encoded: string): Uint8Array {
  const binaryString = customBase64Decode(encoded);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
