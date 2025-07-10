"use client";

export function padToMultipleAsUint8Array(
  str: string,
  multiple: number = 16,
  padChar: string = '~'
): Uint8Array {
  const length = str.length;
  const remainder = length % multiple;
  const needed = remainder === 0 ? 0 : multiple - remainder;
  const result = new Uint8Array(length + needed);

  // Fill with the string's ASCII bytes
  for (let i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i);
  }

  // If padding is needed, first is padChar, rest are crypto-random bytes
  if (needed > 0) {
    result[str.length] = padChar.charCodeAt(0); // First padding is ~
    if (needed > 1) {
      // Use window.crypto for random bytes
      const randomBytes = new Uint8Array(needed - 1);
      window.crypto.getRandomValues(randomBytes);
      result.set(randomBytes, str.length + 1);
    }
  }

  return result;
}

export function unpadMultipleAsString(
  data: Uint8Array,
  padChar: string = '~'
): [string, boolean | null] {
  const padCode = padChar.charCodeAt(0);
  let padIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] === padCode) {
      padIndex = i;
      break;
    }
  }

  // No padChar found
  if (padIndex === -1) {
    // Check if length is multiple of 16
    if (data.length % 16 === 0) {
      return [String.fromCharCode(...data), true];
    } else {
      // Length not multiple of 16 => invalid padding
      return [String.fromCharCode(...data), null];
    }
  }

  const paddingLength = data.length - padIndex;
  if (paddingLength > 15) {
    return [String.fromCharCode(...data.subarray(0, padIndex)), false];
  }

  return [String.fromCharCode(...data.subarray(0, padIndex)), true];
}