"use client";
import { useCallback } from "react";
import { doc, collection, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { RetrievedForm } from "@/types/retrievedForm";
import { showProcessingModal, updateProcessingModal } from "@/components/ui/Swal2Modals/Swal2Modals";

export function useExtractFormDataFromFirebase() {
  // Helper to get the encryption key for a form
  const getFormKey = useCallback(
    async (
      userEmail: string,
      formId: string,
      current: number,
      total: number,
      t: (key: string, options?: any) => string,
      isRtl: boolean
    ): Promise<string | null> => {
      const message = `
        <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("retrieving_form_key_n_of_m", { current, total })}</p>
        <p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>
      `;
      updateProcessingModal(t("loading_your_forms"), message);
      const keyDocRef = doc(
        db,
        `data/${userEmail}/private/encrypted/formData/all/keys/${formId}`
      );
      const keySnap = await getDoc(keyDocRef);
      return keySnap.exists() ? keySnap.data().encryptionKey ?? null : null;
    },
    []
  );

  // Fetch a single form by ID (no key)
  const extractForm = useCallback(
    async (userEmail: string, formId: string): Promise<RetrievedForm> => {
      const formDocRef = doc(db, `data/${userEmail}/forms/${formId}`);
      const formSnap = await getDoc(formDocRef);
      if (!formSnap.exists()) {
        throw new Error("Form not found");
      }
      const formData = formSnap.data();
      return {
        id: formId,
        encryptedFormTemplate: formData.encryptedFormTemplate ?? null,
        createdAt: formData.createdAt ?? null,
        isPublic: formData.isPublic ?? null,
        publicationDate: formData.publicationDate ?? null,
        visits: formData.visits ?? null,
        responses: formData.responses ?? null,
        encryptedEncryptionKey: null,
        decryptedTemplate: null,
      };
    },
    []
  );

  // Fetch all forms, get keys for all, no sorting
  const extractAllFormsWithKeys = useCallback(
    async (
      userEmail: string,
      t: (key: string, options?: any) => string,
      isRtl: boolean
    ): Promise<RetrievedForm[]> => {
      const initialMessage = `
        <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("retrieving_encrypted_form_data")}</p>
        <p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>
      `;
      showProcessingModal(t("loading_your_forms"), initialMessage);

      const formsCollection = collection(db, `data/${userEmail}/forms`);
      // No orderBy: get all docs as they are in the bucket
      const formsSnapshot = await getDocs(formsCollection);
      const forms: RetrievedForm[] = [];

      for (let i = 0; i < formsSnapshot.docs.length; i++) {
        const docSnap = formsSnapshot.docs[i];
        const formId = docSnap.id;
        const formData = docSnap.data();

        let encryptedEncryptionKey: string | null = null;
        try {
          encryptedEncryptionKey = await getFormKey(
            userEmail,
            formId,
            i + 1,
            formsSnapshot.size,
            t,
            isRtl
          );
        } catch {
          encryptedEncryptionKey = null;
        }

        forms.push({
          id: formId,
          encryptedFormTemplate: formData.encryptedFormTemplate ?? null,
          createdAt: formData.createdAt ?? null,
          isPublic: formData.isPublic ?? null,
          publicationDate: formData.publicationDate ?? null,
          visits: formData.visits ?? null,
          responses: formData.responses ?? null,
          encryptedEncryptionKey,
          decryptedTemplate: null,
        });
      }
      return forms;
    },
    [getFormKey]
  );

  return { extractForm, extractAllFormsWithKeys };
}