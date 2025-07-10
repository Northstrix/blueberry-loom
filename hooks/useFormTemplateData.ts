"use client";
import { useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { whirlpool, sha512 } from "hash-wasm";
import { decryptFieldValueWithTwoCiphersCBCnoPadding } from "@/app/cryptographicPrimitives/twoCiphersSilentMode";
import { unpadMultipleAsString } from "@/hooks/usePadStringToMultiple";
import { decodeFormTemplate } from "@/utils/formTemplateCodec";
import { decodePercentEncoding, customBase64ToUtf8, customBase64ToUint8Array } from "@/utils/decodeURL";

export function useFormTemplateData({
  publisherEmail,
  formID,
  decryptionKey,
  showError,
  t,
  setLoading,
}: {
  publisherEmail: string;
  formID: string;
  decryptionKey: string;
  showError: (key: string, extra?: string, errorObj?: any, isCatch?: boolean) => void;
  t: (key: string) => string;
  setLoading: (v: boolean) => void;
}) {
  const [formSchema, setFormSchema] = useState<any | null>(null);
  const [publicKeyFingerprint, setPublicKeyFingerprint] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ [k: string]: string | undefined }>({});

  const fetchData = async () => {
    setLoading(true);
    setFormSchema(null);
    setPublicKeyFingerprint(null);
    setPublicKey(null);
    setAuthor(null);
    setMeta({});

    try {
      // Step 1: Validate formID
      if (!formID || typeof formID !== "string" || !formID.trim()) {
        console.error("form-id-missing");
        showError(t("form-id-missing"));
        setLoading(false);
        return;
      }

      // Step 2: Decode email
      let decodedEmail: string;
      try {
        const sanitizedEmail = decodePercentEncoding(publisherEmail);
        decodedEmail = customBase64ToUtf8(sanitizedEmail);
        setAuthor(decodedEmail);
      } catch (e) {
        console.error(e);
        showError(t("invalid-email"), undefined, e);
        setLoading(false);
        return;
      }

      // Step 3: Decode key
      let decodedKey: Uint8Array;
      try {
        const sanitizedKey = decodePercentEncoding(decryptionKey);
        decodedKey = customBase64ToUint8Array(sanitizedKey);
      } catch (e) {
        console.error(e);
        showError(t("invalid-key"), undefined, e);
        setLoading(false);
        return;
      }

      // Step 4: Fetch form from Firebase
      let encrypted: string | null = null;
      try {
        const formDocRef = doc(db, `data/${decodedEmail}/forms/${formID}`);
        const formSnap = await getDoc(formDocRef);
        if (!formSnap.exists()) {
          console.error("form_not_found");
          showError(t("form_not_found"));
          setLoading(false);
          return;
        }
        const formData = formSnap.data();
        encrypted = formData.encryptedFormTemplate ?? null;
        // Increment visits atomically
        await updateDoc(formDocRef, { visits: increment(1) });
      } catch (e) {
        console.error(e);
        showError(t("form_not_found"), undefined, e);
        setLoading(false);
        return;
      }

      // Step 5: Decrypt form template and parse schema/meta
      let schema: any | null = null;
      try {
        if (encrypted && decodedKey) {
          // Validate base64 for encrypted
          let decodedTemplateBytes: Uint8Array;
          try {
            decodedTemplateBytes = customBase64ToUint8Array(encrypted);
          } catch (e) {
            console.error(e);
            showError(t("invalid-encoding-of-the-encrypted-form-template-retrieved-from-firebase"), undefined, e);
            setLoading(false);
            return;
          }
          // Decrypt and check integrity
          const [decryptedFormTemplateBytes, formTemplateIntegrity] = await decryptFieldValueWithTwoCiphersCBCnoPadding(
            decodedTemplateBytes,
            decodedKey,
            125
          );
          if (!formTemplateIntegrity) {
            console.error("form_integrity_compromised");
            showError(t("form_integrity_compromised"));
            setLoading(false);
            return;
          }
          // Unpad and check padding
          const [unpadded, isPaddingValid] = unpadMultipleAsString(
            decryptedFormTemplateBytes,
            "~"
          );
          if (!isPaddingValid) {
            console.error("form_padding_invalid");
            showError(t("form_padding_invalid"));
            setLoading(false);
            return;
          }
          schema = decodeFormTemplate(unpadded);
          setFormSchema(schema);

          // Parse meta fields
          const metaMatch = unpadded.match(/^META\(([^)]*)\)/);
          let metaObj: { [k: string]: string | undefined } = {};
          if (metaMatch) {
            const metaParts = metaMatch[1].split(":");
            const decodeBase64Unicode = (str: string): string => {
              try {
                return decodeURIComponent(escape(atob(str)));
              } catch {
                return str;
              }
            };
            metaObj = {
              title: metaParts[0] ? decodeBase64Unicode(metaParts[0]) : "",
              description: metaParts[1] ? decodeBase64Unicode(metaParts[1]) : "",
              submissionTitle: metaParts[2] ? decodeBase64Unicode(metaParts[2]) : "",
              submissionInscription: metaParts[3] ? decodeBase64Unicode(metaParts[3]) : "",
              submissionSuccess: metaParts[4] ? decodeBase64Unicode(metaParts[4]) : "",
              accentColor: metaParts[5] ? decodeBase64Unicode(metaParts[5]) : undefined,
              textColor: metaParts[6] ? decodeBase64Unicode(metaParts[6]) : undefined,
            };
          }
          setMeta(metaObj);
        } else {
          console.error("form_not_found");
          showError(t("form_not_found"));
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
        showError(t("form_schema_decode_failed"), undefined, e);
        setLoading(false);
        return;
      }

      // Step 6: Fetch publisher's public key fingerprint AND public key (embedded logic)
      try {
        const keyRef = doc(db, `data/${decodedEmail}/public`, "mlkem-public-key");
        const keyDoc = await getDoc(keyRef);
        const keyData = keyDoc.data();

        // --- Show error modal directly for these two cases ---
        if (!keyData || !("publicKey" in keyData)) {
          console.error("publisher_key_not_found");
          showError(t("publisher_key_not_found"));
          setLoading(false);
          return;
        }

        const publicKeyStr = keyData.publicKey;

        // Decode base64
        let publicKeyBytes: Uint8Array;
        try {
          const binaryString = atob(publicKeyStr);
          publicKeyBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            publicKeyBytes[i] = binaryString.charCodeAt(i);
          }
        } catch (e) {
          console.error("publisher_key_invalid", e);
          showError(t("publisher_key_invalid"), undefined, e);
          setLoading(false);
          return;
        }

        if (publicKeyBytes.length !== 1568) {
          console.error("publisher_key_invalid");
          showError(t("publisher_key_invalid"));
          setLoading(false);
          return;
        }

        // Hash for fingerprint
        const sha512Hash = await sha512(publicKeyStr);
        const hexStringToArray = (hexString: string): Uint8Array => {
          const matches = hexString.match(/.{1,2}/g);
          if (!matches) throw new Error("Invalid hexadecimal string");
          return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
        };
        const sha512Bytes = hexStringToArray(sha512Hash);
        const whirlpoolHash = await whirlpool(sha512Bytes);
        const whirlpoolBytes = hexStringToArray(whirlpoolHash);

        const hex = Array.from(whirlpoolBytes)
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join("");
        const blocks = [];
        for (let i = 0; i < hex.length; i += 4) {
          blocks.push(hex.slice(i, i + 4));
        }
        const fingerprint = blocks.join("-");

        setPublicKeyFingerprint(fingerprint);
        setPublicKey(publicKeyBytes);
      } catch (e) {
        console.error(e);
        showError(t("k"), undefined, e, true);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error(e);
      showError(t("k"), undefined, e, true);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return {
    formSchema,
    publicKeyFingerprint,
    publicKey,
    author,
    meta,
    fetchData,
  };
}