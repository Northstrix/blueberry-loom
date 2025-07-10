"use client";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getPublicMlKem1024Fingerprint } from "@/lib/getPublicMlKem1024Fingerprint";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { showClosableErrorModal, showCryptographicIdentityInfoModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import { useIsRtl } from "@/hooks/useIsRtl";
import { Settings2 } from "lucide-react";
import ProfileModal from "@/components/ui/ProfileModal/ProfileModal";

interface ProfileSectionProps {
  email: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ email }) => {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hovered, setHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isMobile = useIsMobileText();

  const fetchFingerprint = useCallback(() => {
    setFingerprint(null);
    setError(null);
    getPublicMlKem1024Fingerprint(email).then(([fp, err]) => {
      setFingerprint(fp);
      setError(err);
    });
  }, [email]);

  useEffect(() => {
    let isMounted = true;
    setFingerprint(null);
    setError(null);
    getPublicMlKem1024Fingerprint(email).then(([fp, err]) => {
      if (!isMounted) return;
      setFingerprint(fp);
      setError(err);
    });
    return () => { isMounted = false; };
  }, [email]);

  const firstChar = useMemo(() => email?.[0]?.toUpperCase() || "?", [email]);
  const avatarSize = isMobile ? "w-12 h-12 text-2xl" : "w-14 h-14 text-[2.3rem]";

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);
  const handleClick = useCallback(() => {
    if (fingerprint) {
      const identityInfoMessage = `
        <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('cryptographic_identity_info_line1')}</p>
        <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('cryptographic_identity_info_line2')}</p>
        <p style="margin-bottom: 10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t('cryptographic_identity_info_line3')}</p>
      `;
      showCryptographicIdentityInfoModal(
        t,
        isRtl,
        t('cryptographic_identity_info_title'),
        identityInfoMessage,
        fingerprint
      );
    } else if (error) {
      showClosableErrorModal(t, error.message);
    }
    setHovered(false);
  }, [fingerprint, error, t, isRtl]);

  const displayFingerprint = useMemo(() => {
    if (error) {
      return (
        <span className="text-[var(--theme-red)]" title={error.message}>
          {t("public-key-for-mlkem-1024-fingerprint-error")}
        </span>
      );
    }
    if (fingerprint === null) {
      return t("loading");
    }
    return `${fingerprint.slice(0, 19)}...`;
  }, [fingerprint, error, t]);

  return (
    <div className="relative w-full">
      {/* Settings Icon */}
      <button
        className="
          absolute right-0 top-0 z-10
          bg-[var(--card-background)]
          border border-[var(--background-adjacent-color)]
          rounded-[var(--general-rounding)]
          text-[var(--theme-color)]
          p-2 flex items-center justify-center
          transition-colors duration-200
          min-w-[36px] min-h-[36px]
          hover:border-[var(--lightened-background-adjacent-color)]
          focus:outline-none
          cursor-pointer
        "
        title={t("profile_settings")}
        onClick={() => setShowModal(true)}
        aria-label={t("profile_settings")}
        type="button"
      >
        <Settings2 size={20} />
      </button>

      {/* Profile Row */}
      <div className="flex items-center gap-5 w-full pr-12">
        <div className="relative flex items-center">
          <div
            className={`
              rounded-full bg-[var(--foreground)] text-[var(--theme-color)]
              flex items-center justify-center font-bold border border-[var(--muted-foreground)]
              box-border select-none ${avatarSize}
            `}
          >
            <span>{firstChar}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-[1.1rem] font-medium text-[var(--foreground)] whitespace-nowrap text-ellipsis overflow-hidden">
            {email}
          </div>
          <div
            tabIndex={0}
            className={`
              text-[0.95rem]
              whitespace-nowrap text-ellipsis overflow-hidden
              cursor-pointer transition-colors duration-300 outline-none select-text
              ${hovered ? "text-[var(--foreground)]" : "text-[var(--subtle-color)]"}
              hover:text-[var(--foreground)]
              active:text-[var(--subtle-color)]
            `}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            title={error ? error.message : fingerprint ?? undefined}
          >
            {displayFingerprint}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showModal && (
        <ProfileModal
          email={email}
          onClose={() => setShowModal(false)}
          onKeypairUpdate={fetchFingerprint}
        />
      )}
    </div>
  );
};

export default React.memo(ProfileSection);
