"use client";
import { useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/**
 * Publishes a form by its ID:
 * - Sets isPublic to true
 * - Sets publicationDate to serverTimestamp
 * - Removes createdAt field
 * - Initializes visits and responses to 0
 */
export function usePublishForm() {
  return useCallback(
    async (userEmail: string, formId: string): Promise<void> => {
      const formDocRef = doc(db, `data/${userEmail}/forms/${formId}`);

      // Remove createdAt by setting it to delete (Firestore field deletion)
      // But updateDoc does not support delete directly in web, so we set to null and then ignore in the app, or use FieldValue.delete()
      // We'll use FieldValue.delete() for proper removal:
      const { deleteField } = await import("firebase/firestore");

      await updateDoc(formDocRef, {
        isPublic: true,
        publicationDate: serverTimestamp(),
        visits: 0,
        responses: 0,
        createdAt: deleteField(),
      });
    },
    []
  );
}
