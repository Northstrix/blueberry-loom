"use client";
import { useCallback } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/**
 * Updates an existing form and its key in Firestore.
 */
export function useUpdateFormInFirebase() {
  return useCallback(
    async (
      formId: string,
      encryptedFormTemplate: string,
      encryptionKey: string,
      userEmail: string,
      meta?: Record<string, any>
    ): Promise<void> => {
      // Update form template and meta (merge to preserve other fields)
      const formDocRef = doc(db, `data/${userEmail}/forms/${formId}`);
      await setDoc(
        formDocRef,
        {
          ...(meta || {}),
          encryptedFormTemplate,
        },
        { merge: true }
      );
      // Update encrypted key
      const keyDocRef = doc(
        db,
        `data/${userEmail}/private/encrypted/formData/all/keys/${formId}`
      );
      await setDoc(keyDocRef, { encryptionKey }, { merge: true });
    },
    []
  );
}
