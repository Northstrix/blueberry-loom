"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import useStore from "@/store/store";
import { useTranslation } from "react-i18next";
import { useSingleEffect } from "react-haiku";
import ResponseCard from "@/components/ui/ResponseCard/ResponseCard";
import FormResultDecoder from "@/components/ui/FormResultDecoder/FormResultDecoder";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/app/lib/firebase";
import {
  showProcessingModal,
  updateProcessingModal,
  showClosableErrorModal,
  showAuthenticationErrorModal,
  showConfirmModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";
import {
  silentlyDecryptDataWithTwoCiphersCBC,
  decryptFieldValueWithTwoCiphersCBCnoPadding,
} from "@/app/cryptographicPrimitives/twoCiphersSilentMode";
import { base64ToUint8Array } from "@/lib/utils";
import { unpadMultipleAsString } from "@/hooks/usePadStringToMultiple";
import { MlKem1024 } from "mlkem";
import { decodeFormTemplate } from "@/utils/formTemplateCodec";
import { toast } from "react-toastify";
import { useIsRtl } from "@/hooks/useIsRtl";

// --- Helper: Validate base64 ---
function isValidBase64(str: string) {
  if (typeof str !== "string") return false;
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

// --- Helper: Get metadata status, with decapsulation failure support ---
function getResponseStatus(
  t: any,
  opts: {
    decapsulationFailed?: boolean;
    integrityFailed?: boolean;
    paddingInvalid?: boolean;
    base64Corrupt?: boolean;
    missingFields?: boolean;
  }
) {
  const errors: string[] = [];
  if (opts.missingFields) errors.push(t("error_response_absent"));
  if (opts.base64Corrupt) errors.push(t("error_response_corrupt"));
  if (opts.decapsulationFailed) errors.push(t("error_decapsulation_failed"));
  if (opts.integrityFailed === true) errors.push(t("error_response_integrity"));
  if (opts.paddingInvalid === true) errors.push(t("error_response_padding_invalid"));
  if (errors.length > 0) return { ok: false, messages: errors };
  return { ok: true, messages: [t("response_integrity_verified")] };
}

// --- Helper: Decapsulate secret (ML-KEM) ---
const decapsulateSecret = async (ct: Uint8Array, skR: Uint8Array): Promise<Uint8Array | undefined> => {
  try {
    const recipient = new MlKem1024();
    const ssR = await recipient.decap(ct, skR);
    return ssR;
  } catch (err) {
    console.error("Error:", (err as Error).message);
    return undefined;
  }
};

interface ResponsesProps {
  formId: string;
  onReturn: () => void;
}

export default function Responses({ formId, onReturn }: ResponsesProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { masterKey, iterations, isLoggedIn } = useStore();
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const userEmail = user?.email || "";

  function isMasterKeyValid() {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  }
  const isAuthenticated = userEmail && isMasterKeyValid() && iterations > 0 && isLoggedIn;

  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEverything = async () => {
    if (!isAuthenticated) {
      showAuthenticationErrorModal(t, isRtl, () => router.push("/")); // It used to be the "login" route
      return;
    }
    setLoading(true);

    // --- Fetch and decrypt the form template ---
    let templateObj: any = null;
    try {
      showProcessingModal(
        t("loading_form_template"),
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t("loading_form_template")}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      const formDocRef = doc(db, `data/${userEmail}/forms/${formId}`);
      const formSnap = await getDoc(formDocRef);
      const formData = formSnap.exists() ? formSnap.data() : null;
      const encryptedTemplateB64 = formData?.encryptedFormTemplate || null;
      const keyDocRef = doc(
        db,
        `data/${userEmail}/private/encrypted/formData/all/keys/${formId}`
      );
      const keySnap = await getDoc(keyDocRef);
      const encryptedKeyB64 = keySnap.exists() ? keySnap.data().encryptionKey ?? null : null;
      if (!encryptedTemplateB64 || !encryptedKeyB64) {
        setTemplate(null);
        setResponses([]);
        setLoading(false);
        return;
      }
      const decodedTemplate = base64ToUint8Array(encryptedTemplateB64);
      const decodedKey = base64ToUint8Array(encryptedKeyB64);
      const cutIterations = Math.floor(iterations / 9);
      const [decryptedFormKey] = await decryptFieldValueWithTwoCiphersCBCnoPadding(
        decodedKey,
        masterKey.slice(42),
        cutIterations
      );
      if (!decryptedFormKey) {
        setTemplate(null);
        setResponses([]);
        setLoading(false);
        return;
      }
      const [decryptedFormTemplateBytes] = await decryptFieldValueWithTwoCiphersCBCnoPadding(
        decodedTemplate,
        decryptedFormKey,
        125
      );
      const [unpaddedTemplate] = unpadMultipleAsString(decryptedFormTemplateBytes, "~");
      try {
        templateObj = decodeFormTemplate(unpaddedTemplate);
      } catch (err) {
        console.error("Error:", (err as Error).message);
        showClosableErrorModal(
          t,
          `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
            "something_went_wrong_line1"
          )}</p>
           <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
        );
        setTemplate(null);
        setResponses([]);
        setLoading(false);
        return;
      }
      setTemplate(templateObj);
    } catch (err) {
      console.error("Error:", (err as Error).message);
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
      setTemplate(null);
      setResponses([]);
      setLoading(false);
      return;
    }

    // --- Fetch/decrypt responses ---
    try {
      const Swal = (await import("sweetalert2")).default;
      showProcessingModal(
        t("responses_loading"),
        `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      await new Promise((r) => setTimeout(r, 75));
      const keyDocRef = doc(
        collection(db, "data"),
        `${userEmail}/private/encrypted/keyring/mlkem-private-key`
      );
      const keySnap = await getDoc(keyDocRef);
      if (!keySnap.exists()) {
        Swal.close();
        showClosableErrorModal(
          t,
          `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
            "something_went_wrong_line1"
          )}</p>
           <p dir="${isRtl ? "rtl" : "ltr"}">${t("responses_mlkem_key_missing")}</p>`
        );
        setResponses([]);
        setLoading(false);
        return;
      }
      const encryptedPrivateKeyB64 = keySnap.data().privateKey;
      if (!isValidBase64(encryptedPrivateKeyB64)) {
        Swal.close();
        showClosableErrorModal(
          t,
          `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
            "something_went_wrong_line1"
          )}</p>
           <p dir="${isRtl ? "rtl" : "ltr"}">${t("responses_mlkem_key_corrupt")}</p>`
        );
        setResponses([]);
        setLoading(false);
        return;
      }
      const encryptedPrivateKey = base64ToUint8Array(encryptedPrivateKeyB64);
      const cut_iterations = parseInt((iterations / 9).toString(), 10);
      await new Promise((r) => setTimeout(r, 75));
      updateProcessingModal(
        t("responses_loading"),
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "responses_decrypting_mlkem_key"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      await new Promise((r) => setTimeout(r, 75));
      const [skR, integrityFailed] = await silentlyDecryptDataWithTwoCiphersCBC(
        encryptedPrivateKey,
        masterKey,
        cut_iterations
      );
      if (!skR || integrityFailed) {
        Swal.close();
        showClosableErrorModal(
          t,
          `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
            "something_went_wrong_line1"
          )}</p>
           <p dir="${isRtl ? "rtl" : "ltr"}">${t("responses_mlkem_key_decrypt_fail")}</p>`
        );
        setResponses([]);
        setLoading(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 75));
      updateProcessingModal(
        t("responses_loading"),
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "responses_decrypting_responses"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      await new Promise((r) => setTimeout(r, 75));
      const responsesColRef = collection(
        db,
        `data/${userEmail}/receivedResponses/encrypted/${formId}`
      );
      const responsesSnap = await getDocs(responsesColRef);
      if (responsesSnap.empty) {
        Swal.close();
        setResponses([]);
        setLoading(false);
        return;
      }
      const decryptedResponses: any[] = [];
      for (const docSnap of responsesSnap.docs) {
        const resp = docSnap.data();
        let decrypted: string | null = null;
        let integrityFailed: boolean | undefined = undefined;
        let paddingInvalid: boolean | undefined = undefined;
        let decapsulationFailed = false;
        let base64Corrupt = false;
        let missingFields = false;

        // Check for missing/invalid fields
        if (
          !("encryptedFormResponse" in resp) ||
          !("mlkemCiphertext1" in resp) ||
          !("mlkemCiphertext2" in resp) ||
          resp.encryptedFormResponse === undefined ||
          resp.mlkemCiphertext1 === undefined ||
          resp.mlkemCiphertext2 === undefined ||
          resp.encryptedFormResponse === null ||
          resp.mlkemCiphertext1 === null ||
          resp.mlkemCiphertext2 === null
        ) {
          missingFields = true;
        }
        if (
          !missingFields && (
            !isValidBase64(resp.encryptedFormResponse) ||
            !isValidBase64(resp.mlkemCiphertext1) ||
            !isValidBase64(resp.mlkemCiphertext2)
          )
        ) {
          base64Corrupt = true;
        }

        if (!missingFields && !base64Corrupt) {
          try {
            const ct1 = base64ToUint8Array(resp.mlkemCiphertext1);
            const ct2 = base64ToUint8Array(resp.mlkemCiphertext2);
            const ss1 = await decapsulateSecret(ct1, skR);
            const ss2 = await decapsulateSecret(ct2, skR);
            if (!ss1 || !ss2) {
              decapsulationFailed = true;
              decrypted = null;
              integrityFailed = true;
              paddingInvalid = true;
            } else {
              const mergedKey = new Uint8Array(ss1.length + ss2.length);
              mergedKey.set(ss1, 0);
              mergedKey.set(ss2, ss1.length);
              const encryptedFormResponse = base64ToUint8Array(resp.encryptedFormResponse);
              const [decryptedBytes, integrityFailedRaw] = await silentlyDecryptDataWithTwoCiphersCBC(
                encryptedFormResponse,
                mergedKey,
                125
              );
              integrityFailed = integrityFailedRaw;
              const [unpadded, isPaddingValid] = unpadMultipleAsString(decryptedBytes, "~");
              paddingInvalid = isPaddingValid !== true;
              decrypted = typeof unpadded === "string" ? unpadded : "";
            }
          } catch (err) {
            console.error("Error:", (err as Error).message);
            decapsulationFailed = true;
            decrypted = null;
            integrityFailed = true;
            paddingInvalid = true;
          }
        }

        const status = getResponseStatus(t, {
          decapsulationFailed,
          integrityFailed,
          paddingInvalid,
          base64Corrupt,
          missingFields,
        });

        decryptedResponses.push({
          id: docSnap.id,
          ...resp,
          decrypted,
          decryptedIntegrity: integrityFailed === false,
          decryptedPadding: paddingInvalid === false,
          status,
          metadataStatus: status,
          metrics: resp.metrics,
          submittedAt: resp.submittedAt?.toDate?.() || null,
        });
      }
      decryptedResponses.sort((a, b) => {
        const aTime = a.submittedAt ? a.submittedAt.getTime() : 0;
        const bTime = b.submittedAt ? b.submittedAt.getTime() : 0;
        return bTime - aTime;
      });
      Swal.close();
      setResponses(decryptedResponses);
      setLoading(false);
    } catch (err) {
      console.error("Error:", (err as Error).message);
      const Swal = (await import("sweetalert2")).default;
      Swal.close();
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
      setResponses([]);
      setLoading(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!isAuthenticated) {
      showAuthenticationErrorModal(t, isRtl, () => router.push("/")); // It used to be the "login" route
      return;
    }
    const message = `
      <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
      "delete_response_confirm_line1"
    )}</p>
      <p dir="${isRtl ? "rtl" : "ltr"}">${t("delete_item_confirm_line2")}</p>
    `;
    const confirmed = await showConfirmModal({
      title: t("confirm"),
      message,
      confirmText: t("yes") || "Yes",
      cancelText: t("no") || "No",
      isRtl,
    });
    if (!confirmed) return;
    setDeletingId(responseId);
    try {
      showProcessingModal(
        t("deleting_response"),
        `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`
      );
      await deleteDoc(doc(db, `data/${userEmail}/receivedResponses/encrypted/${formId}/${responseId}`));
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      toast.success(t("response_deleted_successfully"));
    } catch (err) {
      console.error("Error:", (err as Error).message);
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
    } finally {
      setDeletingId(null);
      const Swal = (await import("sweetalert2")).default;
      Swal.close();
    }
  };

  useSingleEffect(() => {
    fetchEverything();
  });

  return (
    <Container>
      <TopBar>
        <CenteredTitle>
          <h2 style={{ marginTop: 32 }}>{t("responses_for_form", { formId })}</h2>
        </CenteredTitle>
      </TopBar>
      <CenteredLinkContainer>
        <span
          onClick={onReturn}
          className="text-[0.95rem] text-[var(--subtle-color)] whitespace-nowrap truncate overflow-hidden cursor-pointer transition-colors duration-300 outline-none select-text underline decoration-dotted underline-offset-3 hover:text-[var(--foreground)] active:text-[var(--subtle-color)]"
        >
          {t("return-to-dashboard")}
        </span>
      </CenteredLinkContainer>
      {loading ? (
        <div className="p-8 text-center">{t("responses_loading")}</div>
      ) : responses.length === 0 ? (
        <div className="text-gray-500 text-center">{t("responses_none_found")}</div>
      ) : (
        <VerticalCards>
          {responses.map((resp) => (
            <ResponseCard
              key={resp.id}
              id={resp.id}
              metadataStatus={resp.metadataStatus}
              submittedAt={resp.submittedAt}
              decrypted={
                <FormResultDecoder result={resp.decrypted || ""} template={template} />
              }
              metrics={resp.metrics}
              onDelete={handleDeleteResponse}
              isDeleting={deletingId === resp.id}
            />
          ))}
        </VerticalCards>
      )}
      <div className="pt-8 pb-2 text-center" style={{ marginBottom: 7 }}>
        <span
          onClick={fetchEverything}
          className="inline-flex mb-[40px] items-center text-[0.95rem] text-[var(--subtle-color)] whitespace-nowrap truncate overflow-hidden cursor-pointer transition-colors duration-300 outline-none select-text underline decoration-dotted underline-offset-3 hover:text-[var(--foreground)] active:text-[var(--subtle-color)]"
        >
          {t("refresh")}
        </span>
      </div>
    </Container>
  );
}

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
`;
const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  gap: 16px;
  flex-wrap: wrap;
`;
const CenteredTitle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  h2 {
    text-align: center;
    margin: 0;
  }
`;
const CenteredLinkContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  margin-top: 20px;
`;
const VerticalCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  margin: 0 auto;
`;
