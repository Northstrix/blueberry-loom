"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPublicMlKem1024Fingerprint } from "@/lib/getPublicMlKem1024Fingerprint";
import {
  showConfirmModal,
  showProcessingModal,
  updateProcessingModal,
  showClosableErrorModal,
  showClosableSuccessModal,
} from "@/components/ui/Swal2Modals/Swal2Modals";
import { useIsRtl } from "@/hooks/useIsRtl";
import useStore from "@/store/store";
import { auth, db } from "@/app/lib/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { silentlyEncryptDataWithTwoCiphersCBCnoPadding } from "@/app/cryptographicPrimitives/twoCiphersSilentMode";
import { MlKem1024 } from "mlkem";
import { formatDate } from "@/utils/formatDate";

interface ProfileModalProps {
  email: string;
  onClose: () => void;
  onKeypairUpdate?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  email,
  onClose,
  onKeypairUpdate,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = useIsRtl();
  const { masterKey, iterations } = useStore();
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const language = i18n.language || "en";
  const accountCreated = user?.metadata?.creationTime
    ? formatDate(new Date(user.metadata.creationTime), language)
    : "--";
  const lastLogin = user?.metadata?.lastSignInTime
    ? formatDate(new Date(user.metadata.lastSignInTime), language)
    : "--";

  const fetchFingerprint = useCallback(async () => {
    setFingerprint(null);
    setError(null);
    const [fp, err] = await getPublicMlKem1024Fingerprint(email);
    setFingerprint(fp);
    setError(err);
  }, [email]);

  useEffect(() => {
    fetchFingerprint();
  }, [fetchFingerprint]);

  const handleGenerateNewKey = useCallback(async () => {
    const message = `
      <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
      "are_you_sure_generate_mlkem"
    )}</p>
      <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
      "mlkem_warning_1"
    )}</p>
      <p style="margin-bottom: 10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
      "mlkem_warning_2"
    )}</p>
      <p dir="${isRtl ? "rtl" : "ltr"}">${t("mlkem_warning_3")}</p>
    `;
    const confirmed = await showConfirmModal({
      title: t("confirm"),
      message,
      confirmText: t("yes") || "Yes",
      cancelText: t("no") || "No",
      isRtl,
    });
    if (!confirmed) return;

    setLoading(true);

    try {
      // Small delay before showing processing modal
      await new Promise((resolve) => setTimeout(resolve, 120));

      // 1. Show processing modal: generating key pair
      const processingMessage = `<p dir="${isRtl ? "rtl" : "ltr"}">${t("please_wait")}</p>`;
      showProcessingModal(t("generating mlkem1024-key-pair"), processingMessage);

      await new Promise((resolve) => setTimeout(resolve, 220));

      const recipient = new MlKem1024();
      const [pkR, skR] = await recipient.generateKeyPair();

      // 2. Update processing modal: uploading public key
      updateProcessingModal(t("uploading_mlkem_public_key_to_firebase"), processingMessage);

      await new Promise((resolve) => setTimeout(resolve, 220));

      if (!user) throw new Error("User not authenticated");

      const publicKey = btoa(String.fromCharCode(...pkR));
      const publicKeyData = { publicKey };
      const pubDocRef = doc(collection(db, "data"), `${user.email}/public/mlkem-public-key`);
      await setDoc(pubDocRef, publicKeyData);

      // 3. Update processing modal: encrypting private key
      updateProcessingModal(t("encrypting_mlkem_private_key"), processingMessage);

      await new Promise((resolve) => setTimeout(resolve, 220));

      if (!masterKey || !(masterKey instanceof Uint8Array))
        throw new Error("Master key missing or invalid");
      const cut_iterations = parseInt((iterations / 9).toString(), 10);
      const encryptedPrivateKey = await silentlyEncryptDataWithTwoCiphersCBCnoPadding(
        skR,
        masterKey,
        cut_iterations
      );
      const privateKey = btoa(String.fromCharCode(...encryptedPrivateKey));
      const privateKeyData = { privateKey };
      const privDocRef = doc(
        collection(db, "data"),
        `${user.email}/private/encrypted/keyring/mlkem-private-key`
      );
      await setDoc(privDocRef, privateKeyData);

      setLoading(false);

      // Small delay before closing processing modal
      await new Promise((resolve) => setTimeout(resolve, 200));
      // @ts-ignore
      window.Swal?.close?.();

      await fetchFingerprint();
      if (onKeypairUpdate) onKeypairUpdate();
      showClosableSuccessModal(t, t("mlkem_keypair_generated_success"));
    } catch (error: any) {
      setLoading(false);
      // @ts-ignore
      window.Swal?.close?.();
      console.error("Error:", error);
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('something_went_wrong_line1')}</p>
         <p dir="${isRtl ? 'rtl' : 'ltr'}">${t('check_the_console')}</p>`
      );
    }
  }, [t, isRtl, masterKey, fetchFingerprint, onKeypairUpdate, user, iterations]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={`
          bg-[var(--card-background)]
          rounded-[var(--general-rounding)]
          shadow-xl w-full
          max-w-lg
          p-4
          relative
          border
          transition-colors
          duration-300
          hover:border-[var(--lightened-background-adjacent-color)]
          border-[var(--background-adjacent-color)]
          box-border
        `}
      >
        {/* Close button */}
        <button
          className="
            absolute top-3 right-3
            bg-transparent border-none
            text-[var(--theme-color)]
            rounded-full p-2
            hover:bg-[var(--background-adjacent-color)]
            transition-colors
            cursor-pointer
          "
          onClick={onClose}
          aria-label={t("close") || "Close"}
        >
          <X size={22} />
        </button>

        {/* Modal Title */}
        <div className="text-xl font-semibold text-[var(--foreground)] mb-4 pl-0">
          {t("profile_settings") || "Profile Settings"}
        </div>

        {/* Info rows: Label: Value, always left-aligned, values wrap under label */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row flex-wrap items-baseline w-full break-all">
            <span className="font-medium text-[var(--subtle-color)] select-text">{t("account_email")}:</span>
            <span className="ml-2 break-all select-text">{email}</span>
          </div>
          <div className="flex flex-row flex-wrap items-baseline w-full break-all">
            <span className="font-medium text-[var(--subtle-color)] select-text">{t("account_created")}:</span>
            <span className="ml-2 break-all select-text" dir={isRtl ? "rtl" : "ltr"}>{accountCreated}</span>
          </div>
          <div className="flex flex-row flex-wrap items-baseline w-full break-all">
            <span className="font-medium text-[var(--subtle-color)] select-text">{t("last_login")}:</span>
            <span className="ml-2 break-all select-text" dir={isRtl ? "rtl" : "ltr"}>{lastLogin}</span>
          </div>
          <div className="flex flex-row flex-wrap items-baseline w-full break-all">
            <span className="font-medium text-[var(--subtle-color)] select-text">{t("mlkem_public_key_fingerprint")}:</span>
            <span className="ml-2 break-all select-text">
              {error ? (
                <span className="text-[var(--theme-red)]">{t("public-key-for-mlkem-1024-fingerprint-error")}</span>
              ) : fingerprint === null ? t("loading") : fingerprint}
            </span>
          </div>
        </div>

        {/* Generate new ML-KEM key pair link */}
        <div className="pt-3 pb-1 text-center">
          <span
            onClick={loading ? undefined : handleGenerateNewKey}
            className={`
              text-[0.95rem]
              text-[var(--subtle-color)]
              whitespace-nowrap
              truncate
              overflow-hidden
              cursor-pointer
              transition-colors
              duration-300
              outline-none
              select-text
              underline
              decoration-dotted
              underline-offset-3
              hover:text-[var(--foreground)]
              active:text-[var(--subtle-color)]
              ${loading ? "opacity-60 pointer-events-none" : ""}
            `}
          >
            {t("generate_new_mlkem_key_pair")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
