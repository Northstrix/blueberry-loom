"use client";
import React, { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useTranslation } from "react-i18next";
import {
  showClosableSuccessModal,
  showClosableErrorModal,
  showAuthenticationErrorModal
} from "@/components/ui/Swal2Modals/Swal2Modals";
import styled from "styled-components";
import { useIsRtl } from "@/hooks/useIsRtl";
import useStore from "@/store/store";
import { useRouter } from "next/navigation";

const TIMER_DURATION = 300; // seconds

export default function EmailVerificationModalForMyForms() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();
  const { masterKey, iterations, isLoggedIn } = useStore();

  const [isSending, setIsSending] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);

  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const userEmail = user?.email || "";

  const isMasterKeyValid = () => {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  };

  const isAuthenticated =
    userEmail && isMasterKeyValid() && iterations > 0 && isLoggedIn;

  const startTimer = () => {
    let time = TIMER_DURATION;
    setTimeLeft(time);
    setIsTimerActive(true);
    const interval = setInterval(() => {
      time--;
      setTimeLeft(time);
      if (time <= 0) {
        clearInterval(interval);
        setIsTimerActive(false);
      }
    }, 1000);
  };

  const handleSendVerification = async () => {
    setIsSending(true);

    // Only one authentication check, using the dedicated modal
    if (!isAuthenticated) {
      setIsSending(false);
      showAuthenticationErrorModal(t, isRtl, () => router.push("/")); // It used to be the "login" route
      return;
    }

    try {
      // user! is safe here due to the above check
      await sendEmailVerification(user!);
      setIsSending(false);
      showClosableSuccessModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "verification_email_sent_successfully"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_your_inbox")}</p>`
      );
      startTimer();
    } catch (err) {
      setIsSending(false);
      console.error("Error:", (err as Error).message);
      showClosableErrorModal(
        t,
        `<p style="margin-bottom:10px;" dir="${isRtl ? "rtl" : "ltr"}">${t(
          "something_went_wrong_line1"
        )}</p>
         <p dir="${isRtl ? "rtl" : "ltr"}">${t("check_the_console")}</p>`
      );
    }
  };

  return (
    <CardContainer dir={isRtl ? "rtl" : "ltr"}>
      <TitleRow>
        <Title>{t("email_verification_required")}</Title>
      </TitleRow>
      <Description>{t("email_verification_description")}</Description>
      <ActionRow>
        {isSending ? (
          <LoadingText>{t("sending-verification-email")}</LoadingText>
        ) : isTimerActive ? (
          <TimerText>
            {t("request_new_link_in", { seconds: timeLeft })}
          </TimerText>
        ) : (
          <SendLink
            onClick={e => {
              e.preventDefault();
              handleSendVerification();
            }}
          >
            {t("send_verification_email")}
          </SendLink>
        )}
      </ActionRow>
    </CardContainer>
  );
}

// Styled-components
const CardContainer = styled.div`
  background: var(--card-background);
  border-radius: var(--general-rounding);
  border: 1.5px solid var(--lightened-background-adjacent-color);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 18px 20px;
  color: var(--foreground);
  width: 100%;
  outline: none;
  transition: border-color 0.3s ease-in-out;
  &:hover {
    border-color: var(--second-degree-lightened-background-adjacent-color);
  }
  text-align: ${(props) => (props.dir === "rtl" ? "right" : "left")};
`;
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
`;
const Title = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: var(--foreground);
  line-height: 1.2;
`;
const Description = styled.p`
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: var(--muted-foreground);
  line-height: 1.4;
`;
const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const SendLink = styled.a`
  color: var(--input-outline);
  text-decoration: underline;
  transition: color 0.3s ease-in-out;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  &:hover {
    color: var(--theme-color);
  }
`;
const LoadingText = styled.span`
  color: var(--muted-foreground);
  font-weight: 500;
  font-size: 0.95rem;
`;
const TimerText = styled.span`
  color: var(--muted-foreground);
  font-weight: 500;
  font-size: 0.95rem;
`;
