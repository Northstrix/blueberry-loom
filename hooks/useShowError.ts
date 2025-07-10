"use client";
import { useCallback } from "react";
import { showClosableErrorModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import { useRouter } from "next/navigation";
import { useIsRtl } from "@/hooks/useIsRtl";
import { useTranslation } from "react-i18next";

/**
 * Error modal hook.
 * - All errors: one line, except "something went wrong" (two lines).
 * - Always prints the error to the console.
 */
export function useShowError(setLoading: (v: boolean) => void) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();

  return useCallback(
    (
      errorKey: string,
      extra?: string,
      errorObj?: any,
      isCatch?: boolean // <-- pass true if from a catch block
    ) => {
      let msg = "";
      if (isCatch) {
        // Always show two lines for catch errors
        msg = `
          <p style="margin-bottom:10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t(
          "something_went_wrong_line1"
        )}</p>
          <p dir="${isRtl ? 'rtl' : 'ltr'}">${t("check_the_console")}</p>
        `;
      } else {
        switch (errorKey) {
          case "form-id-missing":
          case "invalid-email":
          case "invalid-key":
          case "form_not_found":
          case "form_schema_decode_failed":
          case "invalid-encoding-of-the-encrypted-form-template-retrieved-from-firebase":
          case "form_integrity_compromised":
          case "form_padding_invalid":
          case "publisher_key_not_found":
          case "publisher_key_invalid":
            msg = `<p dir="${isRtl ? 'rtl' : 'ltr'}">${t(errorKey)}</p>`;
            break;
          default:
            msg = `
              <p style="margin-bottom:10px;" dir="${isRtl ? 'rtl' : 'ltr'}">${t(
              "something_went_wrong_line1"
            )}</p>
              <p dir="${isRtl ? 'rtl' : 'ltr'}">${t("check_the_console")}</p>
            `;
        }
      }
      if (extra) msg += `<div style="margin-top:10px">${extra}</div>`;
      if (errorObj) {
        console.error(errorObj);
      }
      showClosableErrorModal(t, msg, () => router.push("/"));
      setLoading(false);
    },
    [t, isRtl, router, setLoading]
  );
}