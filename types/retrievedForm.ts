import { Timestamp } from "firebase/firestore";

export type RetrievalStatus = "absent" | "corrupt" | "valid";

export interface DecryptedFormResult {
  decryptedTemplate: string | null;
  decryptedFormKey: Uint8Array | null;
  encryptedFormTemplateStatus: RetrievalStatus;
  encryptedEncryptionKeyStatus: RetrievalStatus;
  decryptedFormKeyIntegrity: boolean | null;
  decryptedFormTemplateIntegrity: boolean | null;
  decryptedFormTemplatePaddingValid: boolean | null;
}

export interface RetrievedForm {
  id: string;
  encryptedFormTemplate: string | null;
  createdAt: Timestamp | null;
  isPublic: boolean | null;
  publicationDate: Timestamp | null;
  visits: number | null;
  responses: number | null;
  encryptedEncryptionKey: string | null;
  decryptedTemplate: string | null;
  decryptedFormKey?: Uint8Array | null;
  encryptedFormTemplateStatus?: RetrievalStatus;
  encryptedEncryptionKeyStatus?: RetrievalStatus;
  decryptedFormKeyIntegrity?: boolean | null;
  decryptedFormTemplateIntegrity?: boolean | null;
  decryptedFormTemplatePaddingValid?: boolean | null;
}