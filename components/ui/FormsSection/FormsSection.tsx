"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { useIsRtl } from "@/hooks/useIsRtl";
import { useExtractFormDataFromFirebase } from "@/hooks/useExtractFormDataFromFirebase";
import { RetrievedForm } from "@/types/retrievedForm";
import FormCard from "@/components/ui/FormCard/FormCard";
import CreateFormCard from "@/components/ui/CreateFormCard/CreateFormCard";
import { auth } from "@/app/lib/firebase";
import EmailVerificationModalForMyForms from "@/components/ui/EmailVerificationModalForMyForms/EmailVerificationModalForMyForms";
import {
  updateProcessingModal,
  showClosableErrorModal,
  showAuthenticationErrorModal,
  showClosableSuccessModal,
  showConfirmModal,
  showProcessingModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";
import Swal from "sweetalert2";
import useStore from "@/store/store";
import { useRouter } from "next/navigation";
import { decryptFieldValueWithTwoCiphersCBCnoPadding } from "@/app/cryptographicPrimitives/twoCiphersSilentMode";
import { DecryptedFormResult, RetrievalStatus } from "@/types/retrievedForm";
import { base64ToUint8Array } from "@/lib/utils";
import { unpadMultipleAsString } from "@/hooks/usePadStringToMultiple";
import FormInfoModal from "@/components/ui/FormInfoModal/FormInfoModal";
import { usePublishForm } from "@/hooks/usePublishForm";
import {  collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { toast } from "react-toastify";

interface FormsSectionProps {
  gap?: number;
  onCreateClick?: () => void;
  fetchFormsFromDashboard?: (fetchFn: () => Promise<void>) => void;
  onFetchDoneFromDashboard?: () => void;
  onEditForm?: (formId: string) => void;
  onViewResponses?: (formId: string) => void;
}

// Helper: Get app root URL (no trailing slash)
function getAppRootUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

// Helper: Fetch a single form's publicationDate and any new fields after publish
async function fetchPublishedFields(userEmail: string, formId: string) {
  const formDocRef = doc(db, `data/${userEmail}/forms/${formId}`);
  const formSnap = await getDoc(formDocRef);
  if (!formSnap.exists()) return {};
  const formData = formSnap.data();
  // Only extract fields that may have changed on publish
  return {
    publicationDate: formData.publicationDate ?? null,
    isPublic: formData.isPublic ?? null,
    visits: formData.visits ?? null,
    responses: formData.responses ?? null,
    // Add any other fields you expect to be updated on publish
  };
}

// Helper: Sort forms by publicationDate or createdAt (newest first)
function sortForms(forms: RetrievedForm[]) {
  return [...forms].sort((a, b) => {
    const aDate = a.publicationDate ?? a.createdAt;
    const bDate = b.publicationDate ?? b.createdAt;
    if (!aDate || !bDate) return 0;
    // Helper to get milliseconds from possible types
    const getMillis = (date: any): number => {
      if (date && typeof date.toMillis === "function") {
        // Firestore Timestamp
        return date.toMillis();
      } else if (date instanceof Date) {
        return date.getTime();
      } else if (typeof date === "number") {
        return date;
      } else if (typeof date === "string") {
        return new Date(date).getTime();
      } else {
        return 0;
      }
    };
    const aMillis = getMillis(aDate);
    const bMillis = getMillis(bDate);
    return bMillis - aMillis;
  });
}

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

function getColumns(width: number) {
  if (width >= 1512) return 3;
  if (width < 1152) return 1;
  return 2;
}

export default function FormsSection({
  gap = 24,
  onCreateClick,
  fetchFormsFromDashboard,
  onFetchDoneFromDashboard,
  onEditForm,
  onViewResponses,
}: FormsSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isMobile = useIsMobileText();
  const isRtl = useIsRtl();
  const [forms, setForms] = useState<RetrievedForm[]>([]);
  const { extractAllFormsWithKeys } = useExtractFormDataFromFirebase();
  const { masterKey, iterations, isLoggedIn } = useStore();

  // Check if user is verified
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const userEmail = user?.email || "";
  const isEmailVerified = user?.emailVerified;
  const windowWidth = useWindowWidth();
  const columns = getColumns(windowWidth);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<RetrievedForm | null>(null);

  const publishForm = usePublishForm();

  // Helper: Check if the master key is valid (length 272, not null/undefined)
  const isMasterKeyValid = () => {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  };

  // Check all conditions for being logged in
  const isAuthenticated = userEmail && isMasterKeyValid() && iterations > 0 && isLoggedIn;

  // Fetch forms (used by both singleton and refresh)
  const fetchForm = async () => {
    if (!isAuthenticated) {
      showAuthenticationErrorModal(t, isRtl, () => router.push("/")); // It used to be the "login" route
      onFetchDoneFromDashboard?.();
      return;
    }
    if (!userEmail) {
      onFetchDoneFromDashboard?.();
      return;
    }
    try {
      let forms: RetrievedForm[] = await extractAllFormsWithKeys(userEmail, t, isRtl);
      const updatedForms: RetrievedForm[] = [];
      for (let idx = 0; idx < forms.length; idx++) {
        const form = forms[idx];
        const result = await decryptFormTemplate(
          form.encryptedFormTemplate,
          form.encryptedEncryptionKey,
          masterKey,
          iterations,
          t,
          isRtl,
          idx + 1, // current form index (1-based)
          forms.length // total forms count
        );
        updatedForms.push({
          ...form,
          decryptedTemplate: result.decryptedTemplate,
          decryptedFormKey: result.decryptedFormKey,
          encryptedFormTemplateStatus: result.encryptedFormTemplateStatus,
          encryptedEncryptionKeyStatus: result.encryptedEncryptionKeyStatus,
          decryptedFormKeyIntegrity: result.decryptedFormKeyIntegrity,
          decryptedFormTemplateIntegrity: result.decryptedFormTemplateIntegrity,
          decryptedFormTemplatePaddingValid: result.decryptedFormTemplatePaddingValid,
        });
      }
      setForms(sortForms(updatedForms));
      Swal.close();
      onFetchDoneFromDashboard?.();
    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('something_went_wrong_line1')}</p>
         <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('check_the_console')}</p>`
      );
      onFetchDoneFromDashboard?.();
    }
  };

  // Allow dashboard to trigger fetchForm via fetchFormsFromDashboard prop
  useEffect(() => {
    if (fetchFormsFromDashboard) {
      fetchFormsFromDashboard(fetchForm);
    }
    // eslint-disable-next-line
  }, [fetchFormsFromDashboard, isEmailVerified, isAuthenticated, userEmail, t, isRtl, masterKey, iterations]);

  // Helper: decrypt form template and key
  const decryptFormTemplate = async (
    encryptedFormTemplate: string | null,
    encryptedEncryptionKey: string | null,
    masterKey: Uint8Array,
    iterations: number,
    t: any,
    isRtl: boolean,
    current: number,
    total: number
  ): Promise<DecryptedFormResult> => {
    const message = `
      <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('decrypting_form_n_of_m', { current, total })}</p>
      <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('please_wait')}</p>
    `;
    updateProcessingModal(t('loading_your_forms'), message);
    await new Promise(resolve => setTimeout(resolve, 24));
    let templateStatus: RetrievalStatus = "valid";
    let keyStatus: RetrievalStatus = "valid";
    if (!encryptedFormTemplate) templateStatus = "absent";
    if (!encryptedEncryptionKey) keyStatus = "absent";
    const decodedTemplate = encryptedFormTemplate ? base64ToUint8Array(encryptedFormTemplate) : null;
    const decodedKey = encryptedEncryptionKey ? base64ToUint8Array(encryptedEncryptionKey) : null;
    if (decodedTemplate && decodedTemplate.length === 1) templateStatus = "corrupt";
    if (decodedKey && decodedKey.length === 1) keyStatus = "corrupt";
    if (templateStatus !== "valid" || keyStatus !== "valid") {
      return {
        decryptedTemplate: null,
        decryptedFormKey: null,
        encryptedFormTemplateStatus: templateStatus,
        encryptedEncryptionKeyStatus: keyStatus,
        decryptedFormKeyIntegrity: null,
        decryptedFormTemplateIntegrity: null,
        decryptedFormTemplatePaddingValid: null,
      };
    }
    const cutIterations = Math.floor(iterations / 9);
    const [decryptedFormKey, formKeyIntegrity] = await decryptFieldValueWithTwoCiphersCBCnoPadding(
      decodedKey!,
      masterKey.slice(42),
      cutIterations
    );
    let decryptedTemplate: string | null = null;
    let templateIntegrity: boolean | null = null;
    let templatePaddingValid: boolean | null = null;
    if (decryptedFormKey) {
      const [decryptedFormTemplateBytes, formTemplateIntegrity] = await decryptFieldValueWithTwoCiphersCBCnoPadding(
        decodedTemplate!,
        decryptedFormKey,
        125
      );
      templateIntegrity = formTemplateIntegrity;
      const [unpadded, isPaddingValid] = unpadMultipleAsString(decryptedFormTemplateBytes, '~');
      decryptedTemplate = unpadded;
      templatePaddingValid = isPaddingValid;
    }
    return {
      decryptedTemplate,
      decryptedFormKey,
      encryptedFormTemplateStatus: templateStatus,
      encryptedEncryptionKeyStatus: keyStatus,
      decryptedFormKeyIntegrity: formKeyIntegrity,
      decryptedFormTemplateIntegrity: templateIntegrity,
      decryptedFormTemplatePaddingValid: templatePaddingValid,
    };
  };

  // Modal and UI handlers
  const handleCardClick = (id: string) => {
    const form = forms.find(f => f.id === id) || null;
    setSelectedForm(form);
    
    setModalOpen(true);
  };

  const handleDelete = async (formId: string) => {
    // Confirm with the user
    const confirmed = await showConfirmModal({
      title: t("delete_form_confirm_title"),
      message: `
        <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("delete_form_confirm_line1")}</p>
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
      // Fetch all response docs
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
      // Delete form doc
      await deleteDoc(doc(db, `data/${userEmail}/forms/${formId}`));
      // Delete form key
      await deleteDoc(doc(db, `data/${userEmail}/private/encrypted/formData/all/keys/${formId}`));

      // Success
      Swal.close();
      toast.success(t("form_deleted_successfully"));
      // Refresh forms list
      fetchForm();
    } catch (error) {
      console.error("Error deleting form:", error);
      Swal.close();
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("something_went_wrong_line1")}</p>
        <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
    }
  };

  // Custom base64 encode with replacements
  function encodeBase64Custom(input: string): string {
    const base64 = btoa(input);
    return base64.replace(/\+/g, "(").replace(/\//g, ")");
  }

  // Custom base64 encode for Uint8Array with replacements
  function encodeUint8ArrayToBase64Custom(arr: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < arr.length; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return encodeBase64Custom(binary);
  }

  const handlePublish = async (id: string) => {
    const confirmed = await showConfirmModal({
      title: t("confirm"),
      message: `<p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
        "publish_form_confirm_line1"
      )}</p>
      <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("publish_form_confirm_line2")}</p>
      <p dir="${isRtl ? "rtl" : "ltr"}">${t("publish_form_confirm_line3")}</p>`,
      confirmText: t("yes") || "Yes",
      cancelText: t("no") || "No",
      isRtl,
    });
    if (!confirmed) return;

    // Show processing modal before publishing
    const processingMessage = `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`;
    showProcessingModal(t("publishing-form"), processingMessage);

    try {
      await publishForm(userEmail, id);

      // Find the decrypted key for this form in state
      const existingForm = forms.find(f => f.id === id);
      const decryptedFormKey = existingForm?.decryptedFormKey ?? null;

      // Fetch only the new fields (publicationDate, isPublic, etc)
      const publishedFields = await fetchPublishedFields(userEmail, id);

      setForms((prevForms) => {
        return sortForms(
          prevForms.map(f =>
            f.id === id
              ? {
                  ...f,
                  ...publishedFields,
                  decryptedFormKey, // preserve the key
                }
              : f
          )
        );
      });

      // Build the shareable link with decryption key as base64
      const encodedEmail = encodeBase64Custom(userEmail);
      const keyParam = decryptedFormKey && decryptedFormKey instanceof Uint8Array ? encodeUint8ArrayToBase64Custom(decryptedFormKey) : "";
      const tag = `${encodedEmail}/${id}${keyParam ? `?key=${keyParam}` : ""}`;
      const link = `https://blueberry-loom-form-loader.netlify.app/form/${encodedEmail}/${id}${
        keyParam ? `?key=${keyParam}` : ""
      }`;
      showClosableSuccessModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">
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
        </div>`
      );
    } catch (error) {
      console.error("Error:", error);
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
    }
  };

  const handleCreateClick = () => {
    onCreateClick?.();
  };

  return (
    <>
      <Section>
        <TitleFlexContainer>
          <MyFormsTitle $isMobile={isMobile}>
            {t("my_forms")}
          </MyFormsTitle>
        </TitleFlexContainer>
        {!isEmailVerified ? (
          <ModalFlexContainer $isRtl={isRtl}>
            <ModalWrapper>
              <EmailVerificationModalForMyForms />
            </ModalWrapper>
          </ModalFlexContainer>
        ) : (
          <>
            <CardsGrid $columns={columns} $gap={gap}>
              <CreateFormCard columns={columns} onClick={handleCreateClick} />
              {forms.map((form) => (
                <FormCard
                  key={form.id}
                  data={form}
                  columns={columns}
                  onClick={handleCardClick}
                  onViewResponses={onViewResponses}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                />
              ))}
            </CardsGrid>
            <div className="pt-8 pb-8 text-center">
              <span
                onClick={fetchForm}
                className=" text-[0.95rem] text-[var(--subtle-color)] whitespace-nowrap truncate overflow-hidden cursor-pointer transition-colors duration-300 outline-none select-text underline decoration-dotted underline-offset-3 hover:text-[var(--foreground)] active:text-[var(--subtle-color)] "
              >
                {t("refresh")}
              </span>
            </div>
          </>
        )}
      </Section>
      <FormInfoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={selectedForm}
        onOpenInEditor={onEditForm}
        onViewResponses={onViewResponses}
        onDelete={handleDelete}
        onPublish={handlePublish}
      />
    </>
  );
}

const Section = styled.section`
  margin-top: 32px;
`;

const TitleFlexContainer = styled.div`
  display: flex;
  justify-content: "flex-start");
  width: 100%;
`;

const MyFormsTitle = styled.h2<{ $isMobile: boolean}>`
  font-size: ${({ $isMobile }) => ($isMobile ? "1.12rem" : "1.75rem")};
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: ${({ $isMobile }) => ($isMobile ? "14px" : "24px")};
  margin-top: 0;
  letter-spacing: -0.01em;
  text-align: left;
  max-width: 480px;
  width: 100%;
`;

const CardsGrid = styled.div<{ $columns: number; $gap: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$columns}, 1fr);
  gap: ${(props) => props.$gap}px;
  width: 100%;
  justify-items: stretch;
`;

const ModalFlexContainer = styled.div<{ $isRtl: boolean }>`
  display: flex;
  justify-content: ${({ $isRtl }) => ($isRtl ? "flex-end" : "flex-start")};
  width: 100%;
`;

const ModalWrapper = styled.div`
  max-width: 364px;
  width: 100%;
`;
