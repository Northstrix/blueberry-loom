"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import DashboardWrapper from "@/components/ui/DashboardWrapper/DashboardWrapper";
import ProfileSection from "@/components/ui/ProfileSection/ProfileSection";
import FormsSection from "@/components/ui/FormsSection/FormsSection";
import { auth, db } from '@/app/lib/firebase';
import { doc, getDoc, collection } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { showAuthenticationErrorModal } from "@/components/ui/Swal2Modals/Swal2Modals";
import { useRouter } from "next/navigation";
import useStore from "@/store/store";
import { useIsRtl } from "@/hooks/useIsRtl";
import { ResizableNavbar } from "@/components/ui/ResizableNavbar/ResizableNavbar";
import { useSingleEffect } from 'react-haiku';
import IdentityCheckPage from "@/components/ui/IdentityCheck/IdentityCheckPage";
import FormBuilderWrapper from "@/components/ui/FormBuilderWrapper/FormBuilderWrapper";
import Responses from "@/components/ui/Responses/Responses";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { masterKey, iterations, isLoggedIn } = useStore();
  const isRtl = useIsRtl();
  const user = typeof window !== "undefined" ? auth.currentUser : null;
  const email = user?.email || "";

  // Helper: Check if the master key is valid (length 272, not null/undefined)
  const isMasterKeyValid = () => {
    if (!masterKey || !(masterKey instanceof Uint8Array)) return false;
    return masterKey.length === 272;
  };
  // Check all conditions for being logged in
  const isAuthenticated = email && isMasterKeyValid() && iterations > 0 && isLoggedIn;

  // Store the fetch function from FormsSection
  const formsSectionFetch = useRef<(() => Promise<void>) | null>(null);
  // Track if logout was called on this page load
  const logoutCalledRef = useRef(false);

  // Dashboard view state
  // "dashboard" | "form-builder-new" | "form-builder-edit" | "identity" | "responses"
  const [view, setView] = useState<
    "dashboard" | "form-builder-new" | "form-builder-edit" | "identity" | "responses"
  >("dashboard");
  const [editFormId, setEditFormId] = useState<string | null>(null);
  const [responsesFormId, setResponsesFormId] = useState<string | null>(null);

  // Set i18n language from Firebase user settings (run only once per mount)
  useSingleEffect(() => {
    async function setLanguageFromFirebase() {
      if (user && email) {
        try {
          const docRef = doc(collection(db, 'data'), `${email}/private/settings`);
          const docSnap = await getDoc(docRef);
          let langToSet = "en";
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.language && typeof data.language === "string") {
              langToSet = data.language;
            }
          }
          if (i18n.language !== langToSet) {
            await i18n.changeLanguage(langToSet);
          }
        } catch {
          if (i18n.language !== "en") {
            await i18n.changeLanguage("en");
          }
        }
      }
    }
    setLanguageFromFirebase();
  });

  // Auth check: run on every relevant change
  React.useEffect(() => {
    if (!isAuthenticated && !logoutCalledRef.current) {
      showAuthenticationErrorModal(t, isRtl, () => router.push("/")); // It used to be the "login" route
    }
  }, [isAuthenticated, t, router, isRtl]);

  function handleNavbarLogout() {
    logoutCalledRef.current = true;
    router.push("/");
  }

  // Handlers for view switching
  const handleNewForm = useCallback(() => {
    setView("form-builder-new");
    setEditFormId(null);
  }, []);
  const handleEditForm = useCallback((formId: string) => {
    setView("form-builder-edit");
    setEditFormId(formId);
  }, []);
  const handleReturnToDashboard = useCallback(() => {
    setView("dashboard");
    setEditFormId(null);
    setResponsesFormId(null);
  }, []);
  const handleShowIdentityCheck = useCallback(() => {
    setView("identity");
  }, []);
  const handleReturnFromIdentityCheck = useCallback(() => {
    setView("dashboard");
  }, []);
  const handleViewResponses = useCallback((formId: string) => {
    setResponsesFormId(formId);
    setView("responses");
  }, []);

  // Always fetch forms when returning to dashboard view
  React.useEffect(() => {
    if (view === "dashboard" && formsSectionFetch.current) {
      formsSectionFetch.current();
    }
  }, [view]);

  // Fetch forms on mount if view is dashboard and authenticated
  useEffect(() => {
    if (view === "dashboard" && isAuthenticated && formsSectionFetch.current) {
      formsSectionFetch.current();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  // Only block rendering if not authenticated
  if (!isAuthenticated) return null;

  return (
    <>
      {view === "dashboard" && (
        <DashboardWrapper>
          <div className="mb-[80px]">
            <ResizableNavbar
              maxWidth={1488}
              onLogout={handleNavbarLogout}
              onIdentityCheckClick={handleShowIdentityCheck}
            />
          </div>
          <ProfileSection email={email} />
          <FormsSection
            onCreateClick={handleNewForm}
            onEditForm={handleEditForm}
            onViewResponses={handleViewResponses}
            fetchFormsFromDashboard={fetchFn => {
              formsSectionFetch.current = fetchFn;
            }}
          />
        </DashboardWrapper>
      )}
      {view === "form-builder-new" && (
        <FormBuilderWrapper
          mode="new"
          onReturn={handleReturnToDashboard}
        />
      )}
      {view === "form-builder-edit" && editFormId && (
        <FormBuilderWrapper
          mode="edit"
          formId={editFormId}
          onReturn={handleReturnToDashboard}
        />
      )}
      {view === "identity" && (
        <IdentityCheckPage onBack={handleReturnFromIdentityCheck} />
      )}
      {view === "responses" && responsesFormId && (
        <Responses
          formId={responsesFormId}
          onReturn={handleReturnToDashboard}
        />
      )}
    </>
  );
}