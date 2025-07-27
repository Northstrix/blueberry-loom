"use client";
import React, { useEffect, useState } from "react";
import FormRenderer from "@/components/ui/FormRenderer/FormRenderer";
import FormEditorOverlay from "@/components/ui/FormEditorOverlay/FormEditorOverlay";
import AdvancedParametersPreview from "@/components/ui/AdvancedParametersPreview/AdvancedParametersPreview";
import { FormSchema } from "@/types/formBuilder";
import {
  showConfirmModal,
  showClosableErrorModal,
  showProcessingModal,
  updateProcessingModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";
import { useIsRtl } from "@/hooks/useIsRtl";
import { useTranslation } from "react-i18next";
import { auth, db } from "@/app/lib/firebase";
import useStore from "@/store/store";
import { getPublicMlKem1024Fingerprint } from "@/lib/getPublicMlKem1024Fingerprint";
import { padToMultipleAsUint8Array } from "@/hooks/usePadStringToMultiple";
import { useGenerateRandomFormKey } from "@/hooks/useGenerateRandomFormKey";
import { silentlyEncryptDataWithTwoCiphersCBCnoPadding } from "@/app/cryptographicPrimitives/twoCiphersSilentMode";
import { useUploadNewFormToFirebase } from "@/hooks/useUploadNewFormToFirebase";
import { useUpdateFormInFirebase } from "@/hooks/useUpdateFormInFirebase";
import { useExtractFormDataFromFirebase } from "@/hooks/useExtractFormDataFromFirebase";
import { useConfirmExit } from "react-haiku";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { doc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { decodeFormTemplate } from "@/utils/formTemplateCodec";
import { base64ToUint8Array } from "@/lib/utils";
import { decryptFieldValueWithTwoCiphersCBCnoPadding } from "@/app/cryptographicPrimitives/twoCiphersSilentMode";
import { unpadMultipleAsString } from "@/hooks/usePadStringToMultiple";
import { usePublishForm } from "@/hooks/usePublishForm";

interface FormBuilderWrapperProps {
  mode: "new" | "edit";
  formId?: string;
  onReturn: () => void;
}

const defaultForm: FormSchema = {
  meta: {
    title: "Untitled Form",
    description: "No description.",
    responseModal: {
      primary: "Submitting your response",
      subtext: "Please wait for a while...",
    },
    successNotification: "Response has been submitted successfully!",
    accentColor: "#00a0d8",
    highlightForeground: "#fff",
  },
  sections: [],
};

// Helper functions for tag encoding
function encodeBase64Custom(input: string): string {
  const base64 = btoa(input);
  return base64.replace(/\+/g, "(").replace(/\//g, ")");
}
function encodeUint8ArrayToBase64Custom(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return encodeBase64Custom(binary);
}

export default function FormBuilderWrapper({
  mode: initialMode,
  formId: initialFormId,
  onReturn,
}: FormBuilderWrapperProps) {
  const { masterKey, iterations, isLoggedIn } = useStore();
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  const [form, setForm] = useState<FormSchema>(defaultForm);
  const [unsaved, setUnsaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [fingerprint, setFingerprint] = useState<string>("Loading...");
  const [loading, setLoading] = useState(initialMode === "edit");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [mode, setMode] = useState<"new" | "edit">(initialMode);
  const [formId, setFormId] = useState<string | undefined>(initialFormId);

  // Store decrypted key for tag
  const [decryptedFormKey, setDecryptedFormKey] = useState<Uint8Array | null>(null);

  const generateRandomFormKey = useGenerateRandomFormKey();
  const uploadNewForm = useUploadNewFormToFirebase();
  const updateForm = useUpdateFormInFirebase();
  const { extractForm } = useExtractFormDataFromFirebase();
  useConfirmExit(unsaved);

  // Get Firebase user if available (client-side only)
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const userEmail = user?.email || "";

  // Responsive width
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function getMaxWidth(width: number): string | number {
    if (width >= 900) return 740;
    if (width >= 800) return 715;
    if (width >= 720) return 654;
    if (width >= 680) return 612;
    if (width >= 640) return 580;
    if (width >= 600) return 524;
    if (width >= 512) return 460;
    if (width >= 464) return 418;
    if (width >= 400) return 380;
    if (width >= 360) return 360;
    return "100%";
  }

  // Helper: Check if the master key is valid (length 272, not null/undefined)
  const isMasterKeyValid = () => {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  };

  // Check all conditions for being logged in
  const isAuthenticated =
    userEmail && isMasterKeyValid() && iterations > 0 && isLoggedIn;

  // Load form for edit mode
  useEffect(() => {
    if (mode === "edit" && formId && isAuthenticated) {
      setLoading(true);
      (async () => {
        try {
          const retrievedForm = await extractForm(userEmail, formId);
          setIsPublic(retrievedForm.isPublic ?? true);
          // Get encrypted key
          const keyDocRef = doc(
            db,
            `data/${userEmail}/private/encrypted/formData/all/keys/${formId}`
          );
          const keySnap = await getDoc(keyDocRef);
          const encryptedEncryptionKey = keySnap.exists()
            ? keySnap.data().encryptionKey ?? null
            : null;
          if (!retrievedForm.encryptedFormTemplate || !encryptedEncryptionKey) {
            throw new Error("Encrypted form template or key is missing.");
          }
          const decodedTemplate = base64ToUint8Array(
            retrievedForm.encryptedFormTemplate
          );
          const decodedKey = base64ToUint8Array(encryptedEncryptionKey);
          const cutIterations = Math.floor(iterations / 9);
          const [decryptedKey] = await decryptFieldValueWithTwoCiphersCBCnoPadding(
            decodedKey,
            masterKey.slice(42),
            cutIterations
          );
          if (!decryptedKey) throw new Error("Failed to decrypt form key.");
          setDecryptedFormKey(decryptedKey); // Store for tag
          const [decryptedFormTemplateBytes] =
            await decryptFieldValueWithTwoCiphersCBCnoPadding(
              decodedTemplate,
              decryptedKey,
              125
            );
          const [unpadded] = unpadMultipleAsString(decryptedFormTemplateBytes, "~");
          if (!unpadded) throw new Error("Failed to unpad form template.");
          let decoded: FormSchema;
          try {
            decoded = decodeFormTemplate(unpadded);
          } catch (e: any) {
            throw new Error("Failed to decode form: " + (e?.message || e));
          }
          setForm(decoded);
        } catch (e: any) {
          showClosableErrorModal(
            t,
            `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${e?.message || e}</p>`
          );
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [
    mode,
    formId,
    isAuthenticated,
    userEmail,
    masterKey,
    iterations,
    extractForm,
    t,
    isRtl,
  ]);

  // Fetch fingerprint for new forms
  useEffect(() => {
    if ((mode === "new" && isAuthenticated) || (mode === "edit" && isAuthenticated)) {
      let isMounted = true;
      getPublicMlKem1024Fingerprint(userEmail).then(([fp, err]) => {
        if (!isMounted) return;
        if (fp) {
          setFingerprint(fp);
        } else {
          const errMessage = err?.message || "Unknown error";
          setFingerprint("Error: " + errMessage);
          // eslint-disable-next-line no-console
          console.error("Error: " + errMessage);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [mode, isAuthenticated, t, masterKey, iterations, userEmail]);

  // Save new form
  const handleSaveFormNew = async (plaintextFormTemplate: string) => {
    try {
      const randomKey = await generateRandomFormKey(masterKey.slice(42));
      const cutIterations = parseInt((iterations / 9).toString(), 10);
      const paddedFormTemplateStringAsUint8Array =
        padToMultipleAsUint8Array(plaintextFormTemplate);
      const encryptedFormTemplate =
        await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
          paddedFormTemplateStringAsUint8Array,
          randomKey,
          125
        );
      const encryptedFormKey = await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
        randomKey,
        masterKey.slice(42),
        cutIterations
      );
      // Upload and get the new formId
      const newFormId = await uploadNewForm(
        btoa(String.fromCharCode(...encryptedFormTemplate)),
        btoa(String.fromCharCode(...encryptedFormKey)),
        userEmail
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      setUnsaved(false);
      await new Promise((resolve) => setTimeout(resolve, 150));
      Swal.close();
      toast.success(t("form_saved_successfully"));
      // Switch to edit mode for the new form (no reload)
      setMode("edit");
      setFormId(newFormId);
    } catch (error) {
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
      // eslint-disable-next-line no-console
      console.error("Error:", error);
    }
  };

  // Save existing form
  const handleSaveFormEdit = async (plaintextFormTemplate: string) => {
    try {
      const randomKey = await generateRandomFormKey(masterKey.slice(42));
      const cutIterations = Math.floor(iterations / 9);
      const padded = padToMultipleAsUint8Array(plaintextFormTemplate);
      const encryptedFormTemplate =
        await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
          padded,
          randomKey,
          125
        );
      const encryptedFormKey = await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
        randomKey,
        masterKey.slice(42),
        cutIterations
      );
      await updateForm(
        formId!,
        btoa(String.fromCharCode(...encryptedFormTemplate)),
        btoa(String.fromCharCode(...encryptedFormKey)),
        userEmail
      );
      Swal.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
      setUnsaved(false);
      toast.success(t("form_saved_successfully"));
    } catch (error) {
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
      // eslint-disable-next-line no-console
      console.error("Error:", error);
    }
  };

  // Delete form (only available in edit mode)
  const handleDeleteForm = async () => {
    if (!formId) return;
    const confirmed = await showConfirmModal({
      title: t("delete_form_confirm_title"),
      message: `
        <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
        "delete_form_confirm_line1"
      )}</p>
        <p dir="${isRtl ? "rtl" : "ltr"}">${t("delete_form_confirm_line2")}</p>
      `,
      confirmText: t("yes") || "Yes",
      cancelText: t("no") || "No",
      isRtl,
    });
    if (!confirmed) return;
    try {
      // 1. Deleting responses
      showProcessingModal(
        t("deleting_responses"),
        `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      // Delete all responses
      const responsesColRef = collection(
        db,
        `data/${userEmail}/receivedResponses/encrypted/${formId}`
      );
      const responsesSnap = await getDocs(responsesColRef);
      for (const docSnap of responsesSnap.docs) {
        await deleteDoc(docSnap.ref);
      }
      // 2. Deleting form and keys
      updateProcessingModal(
        t("deleting_form"),
        `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      await deleteDoc(doc(db, `data/${userEmail}/forms/${formId}`));
      await deleteDoc(
        doc(db, `data/${userEmail}/private/encrypted/formData/all/keys/${formId}`)
      );
      Swal.close();
      toast.success(t("form_deleted_successfully"));
      onReturn();
    } catch (error) {
      Swal.close();
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
      // eslint-disable-next-line no-console
      console.error("Error deleting form:", error);
    }
  };

  const handleDiscard = async () => {
    const message = `
      <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t(
      'confirm_form_discard'
    )}</p>
      <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('delete_item_confirm_line2')}</p>
    `;
    const confirmed = await showConfirmModal({
      title: t('confirm'),
      message,
      confirmText: t('yes') || "Yes",
      cancelText: t('no') || "No",
      isRtl,
    });
    if (confirmed) {
      onReturn();
    }
  };

  // --- PUBLISH LOGIC ---
  const publishForm = usePublishForm();

  const handlePublishForm = async () => {
    if (!formId) return;
    try {
      await publishForm(userEmail, formId);

      // Build the tag
      const encodedEmail = encodeBase64Custom(userEmail);
      const keyParam =
        decryptedFormKey && decryptedFormKey instanceof Uint8Array
          ? encodeUint8ArrayToBase64Custom(decryptedFormKey)
          : "";
      const tag = `${encodedEmail}/${formId}${keyParam ? `?key=${keyParam}` : ""}`;
      const link = `https://blueberry-loom-form-loader.netlify.app/form/${encodedEmail}/${formId}${
        keyParam ? `?key=${keyParam}` : ""
      }`;
      await Swal.fire({
        icon: "success",
        title: t("success"),
        html: `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">
          ${t("form-published successfully")}
        </p>
        <p style="margin-top: 16px;" dir="${isRtl ? "rtl" : "ltr"}">
          ${t("you_can_share_this_form_by_providing_the_link_below_to_the_recipients")}
        </p>
        <div style="margin-top: 8px; text-align: left;">
          <a
            href="${link}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              font-family: monospace;
              font-size: 0.875em;
              word-break: break-all;
              color: var(--theme-color);
              text-decoration: underline;
              cursor: pointer;
              display: inline-block;
            "
          >
            ${link}
          </a>
        </div>
        <p style="margin-top: 16px;" dir="${isRtl ? "rtl" : "ltr"}">
          ${t("alternatively_you_can_share_this_form_by_distributing_the_following_tag_to_the_recipients")}
        </p>
        <div style="margin-top: 8px; text-align: left;">
          <a
            style="font-family: monospace; font-size: 0.875em; word-break: break-all; color: var(--theme-color);">
              ${tag}
          </a>
        </div>`,
        width: 600,
        padding: "3em",
        color: "var(--foreground)",
        background: "var(--card-background)",
        confirmButtonText: t("ok_button"),
        showConfirmButton: false,
        footer: `<a class="btn_grd"><span>${t('ok_button')}</span></a>`,
        customClass: {
          popup: isRtl ? "swal-custom-popup swal2-rtl" : "swal-custom-popup",
          footer: "swal-custom-footer",
        },
        allowOutsideClick: true,
        allowEscapeKey: true,
        didOpen: () => {
          const button = Swal.getFooter()?.querySelector('.btn_grd');
          if (button) {
            button.addEventListener('click', () => {
              Swal.close();
            });
          } else {
            console.error("Button element not found!");
          }
        }
      });

      // Always return to dashboard after modal closes (OK or outside click)
      onReturn();

    } catch (error) {
      Swal.close();
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
        <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
      // eslint-disable-next-line no-console
      console.error("Error publishing form:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>{t("loading")}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "48px 0 0 0",
        }}
      >
        <div
          style={{
            maxWidth: getMaxWidth(windowWidth),
            width: "100%",
            margin: "0 auto",
            padding: "0 10px",
            background: "none",
          }}
        >
          {activeTab === "advanced" ? (
            <AdvancedParametersPreview meta={form.meta} />
          ) : (
            <FormRenderer
              schema={form}
              onSubmit={() => { }}
              cardPadding="2.25rem 2.2rem"
              cardGap="2rem"
              sectionTextSize="16px"
              elementTextSize="15px"
              author={userEmail}
              fingerprint={fingerprint}
            />
          )}
        </div>
      </div>
      <FormEditorOverlay
        form={form}
        onFormChange={f => {
          setForm(f);
          setUnsaved(true);
        }}
        onSaveForm={mode === "new" ? handleSaveFormNew : handleSaveFormEdit}
        onDeleteForm={mode === "edit" ? handleDeleteForm : undefined}
        onDiscard={handleDiscard}
        unsaved={unsaved}
        isNewForm={mode === "new"}
        isPublic={isPublic}
        onTabChange={setActiveTab}
        onReturn={onReturn}
        onPublish={handlePublishForm}
      />
    </div>
  );
}
