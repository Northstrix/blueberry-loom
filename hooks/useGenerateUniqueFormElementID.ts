"use client"
// components/ui/FormEditorOverlay/generateUniqueId.ts
export function generateUniqueId(existingIds: Set<string>) {
  // Print all current IDs to the console
  // console.log("All existing IDs:", Array.from(existingIds));

  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = "";
  do {
    id = Array.from(window.crypto.getRandomValues(new Uint8Array(3)))
      .map(byte => charset[byte % charset.length])
      .join('');
  } while (existingIds.has(id));
  return id;
}
