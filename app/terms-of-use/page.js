"use client";
import React from "react";
import { useIsMobileText } from "@/hooks/useIsMobileText";
import { useTranslation } from "react-i18next";
import { useIsRtl } from "@/hooks/useIsRtl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfUsePage() {
  const isMobile = useIsMobileText();
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();
  const horizontalPadding = isMobile ? "10px" : "24px";
  const overlayBarHeight = isMobile ? 48 : 64;

  return (
    <main
      style={{
        background: "var(--background)",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Overlay Return Link */}
      {isRtl ? (
        <div
          className="absolute top-0 left-0 z-50 flex items-center justify-start w-full"
          style={{
            height: overlayBarHeight,
            marginLeft: isMobile ? 10 : 24,
            marginRight: isMobile ? 10 : 24,
            pointerEvents: "none",
          }}
        >
          <a
            href="/"
            tabIndex={0}
            aria-label={t("home")}
            className={`flex items-center h-full font-semibold ${
              isMobile ? "text-base" : "text-xl"
            } text-[var(--foreground)] no-underline transition-colors duration-300 cursor-pointer pointer-events-auto group`}
            style={{ width: "auto" }}
            onClick={e => {
              e.preventDefault();
              router.push("/");
            }}
            dir="ltr"
          >
            <span
              className="items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
            >
              {t("home")}
            </span>
            <span
              className="items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
              style={{
                marginRight: isMobile ? 2.5 : 4,
                display: "flex-end",
                alignItems: "center",
              }}
            >
              <ChevronRight
                size={isMobile ? 20 : 24}
                stroke="currentColor"
                strokeWidth={isMobile ? 2 : 2.25}
                className="transition-colors duration-300"
              />
            </span>
          </a>
        </div>
      ) : (
        <div
          className="absolute top-0 left-0 z-50 flex items-center"
          style={{
            height: overlayBarHeight,
            marginLeft: isMobile ? 10 : 24,
            marginRight: isMobile ? 10 : 24,
            pointerEvents: "none",
          }}
        >
          <a
            href="/"
            tabIndex={0}
            aria-label={t("home")}
            className={`flex items-center h-full font-semibold ${
              isMobile ? "text-base" : "text-xl"
            } text-[var(--foreground)] no-underline transition-colors duration-300 cursor-pointer pointer-events-auto group`}
            style={{ width: "auto" }}
            onClick={e => {
              e.preventDefault();
              router.push("/");
            }}
          >
            <span
              className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]"
              style={{
                marginRight: isMobile ? 2.5 : 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft
                size={isMobile ? 20 : 24}
                stroke="currentColor"
                strokeWidth={isMobile ? 2 : 2.25}
                className="transition-colors duration-300"
              />
            </span>
            <span className="flex items-center justify-center transition-colors duration-300 group-hover:text-[var(--theme-color)]">
              {t("home")}
            </span>
          </a>
        </div>
      )}

      {/* Spacer to compensate for overlay bar */}
      <div style={{ height: overlayBarHeight }} />

      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 0 0 0",
        }}
      >
        {/* Title */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "3rem",
            fontWeight: 700,
            marginBottom: "40px",
            color: "var(--foreground)",
            letterSpacing: "-1px",
          }}
        >
          Terms of Use
        </h1>

        <div
          style={{
            color: "var(--foreground)",
            fontSize: "1.15rem",
            paddingLeft: horizontalPadding,
            paddingRight: horizontalPadding,
          }}
        >
          {/* 1. Agreement to Terms */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using Blueberry Loom in any form, you, as an end user, agree to these Terms of Use. If you do not accept these terms, you are not authorized to access or use this application.
            </p>
          </section>
          
          {/* 2. User-Generated Content and Responsibility */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              2. User-Generated Content and Responsibility
            </h2>
            <p>
              All content within Blueberry Loom is generated by users. The application itself does not create, moderate, review, or verify any content posted, submitted, or shared by users in any form. Users are solely and fully responsible for their actions within the app and for any content they generate, upload, submit, or share, including, but not limited to, text, images, files, and form submissions. The app creator does not assume, accept, or bear any responsibility or liability for user-generated content, nor for any consequences that may arise from such content being made available through the application.
            </p>
            <p>
              Users must not post, upload, share, or distribute any content for which they do not have the appropriate legal rights or permissions, including, but not limited to, material that is unlicensed, pirated, illegal, or that infringes upon the intellectual property, privacy, or other rights of any third party. Any violation of these requirements is the sole responsibility of the user, and the app creator reserves the right to remove content or restrict access in response to violations or suspected violations of these terms.
            </p>
          </section>

          {/* 3. Encryption and Security */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              3. Encryption and Security
            </h2>
            <p>
              Responses submitted through forms in Blueberry Loom are protected using end-to-end encryption. The <b>ChaCha20 + Serpent-256 CBC + HMAC-SHA3-512</b> authenticated encryption scheme is used to encrypt data. The <b>ML-KEM-1024</b> algorithm is used to generate the shared secret key between the respondent and form author. This combination of modern encryption algorithms and post-quantum key encapsulation is intended to provide strong confidentiality and integrity for all submissions.
            </p>
            <p>
              Encryption is not guaranteed to work as intended, and users should not submit sensitive, confidential, classified, or regulated data through the application.
            </p>
          </section>

          {/* 4. Third-Party Services */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              4. Third-Party Services
            </h2>
            <p>
              The application uses Google services for authentication and data storage. User data is stored on Google servers located in the United States, specifically in the <b>us-south1 (Dallas)</b> region.
            </p>
          </section>

          {/* 5. Data Usage */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              5. Data Usage
            </h2>
            <p>
              User email addresses and other information present in the application may be used for promotional and advertisement purposes, whether related or unrelated to the application. User data may also be used for compiling and publishing anonymized statistics regarding application usage.
            </p>
          </section>

          {/* 6. Experimental Nature and Service Availability */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              6. Experimental Nature and Service Availability
            </h2>
            <p>
              Blueberry Loom is an <b>experimental application</b>. There is no guarantee that it will work as intended, or that it will work at all. The application and its features may be updated, modified, suspended, or discontinued at any time without prior notice. By using this application, you, as an end user, agree to use Blueberry Loom at your own risk.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              7. Limitation of Liability
            </h2>
            <p>
              The application is provided under the MIT License and is offered “as is” and “as available,” without any warranties or guarantees, express or implied. To the fullest extent permitted by law, the creator shall not be liable for any direct, indirect, incidental, special, consequential, punitive, exemplary, or other damages—including, but not limited to, loss of profits, revenue, data, use, goodwill, business interruption, or other intangible losses—arising from or related to the use, misuse, inability to use, or reliance on the application, regardless of the legal theory and even if the creator has been advised of the possibility of such damages. The creator reserves the right to terminate user accounts or delete user data at any time, with or without notice or explanation. Users assume all risks and responsibilities for their actions and any consequences resulting from use of the application.
            </p>
          </section>

          {/* 8. Changes to Terms */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>
              8. Changes to Terms
            </h2>
            <p>
              These Terms of Use may be changed at any time, with or without notice. It is the user's responsibility to review the current version of the Terms of Use. Continued use of the application following any changes constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
        {/* 32px space before footer */}
        <div style={{ height: "32px" }} />
      </div>
    </main>
  );
}
