"use client";
import { useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

// Unique ID generator
function generateUniqueId(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = window.crypto.getRandomValues(new Uint8Array(10));
  return Array.from(randomValues, (byte) => charset[byte % charset.length]).join('');
}

/**
 * Hook to upload a new form to Firestore.
 * - encryptedFormTemplate: the encrypted form data (string)
 * - encryptionKey: the encrypted encryption key (string)
 * - userEmail: the user's email (string)
 * @returns A callback that returns the unique form ID on success, throws error on failure
 */
export function useUploadNewFormToFirebase() {
  return useCallback(
    async (
      encryptedFormTemplate: string,
      encryptionKey: string,
      userEmail: string
    ): Promise<string> => {
      let uniqueFormId = "";
      let isUnique = false;

      // Ensure unique ID for the form
      while (!isUnique) {
        uniqueFormId = generateUniqueId();
        const docRef = doc(db, `data/${userEmail}/forms/${uniqueFormId}`);
        const docSnap = await getDoc(docRef);
        isUnique = !docSnap.exists();
      }

      try {
        // Store non-private form metadata and encrypted form template in Firestore
        const nonPrivateFormDocRef = doc(db, `data/${userEmail}/forms/${uniqueFormId}`);
        await setDoc(nonPrivateFormDocRef, {
          createdAt: serverTimestamp(),
          isPublic: false,
          encryptedFormTemplate,
        });

        // Store encryption key in the specified private Firestore path
        const privateFormKeyDocRef = doc(
          db,
          `data/${userEmail}/private/encrypted/formData/all/keys/${uniqueFormId}`
        );
        await setDoc(privateFormKeyDocRef, {
          encryptionKey,
        });

        // On success, return the unique form ID
        return uniqueFormId;
      } catch (error) {
        // On error, throw it
        throw error;
      }
    },
    []
  );
}