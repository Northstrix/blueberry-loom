"use client";
import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";

interface ResponseCardProps {
  id: string;
  metadataStatus: { ok: boolean; messages: string[] };
  submittedAt?: Date | null;
  decrypted: React.ReactNode;
  metrics?: any;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

const ResponseCard: React.FC<ResponseCardProps> = ({
  id,
  metadataStatus,
  submittedAt,
  decrypted,
  metrics,
  onDelete,
  isDeleting,
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Section>
        <Label>{t("responses_data")}:</Label>
        <Value>{decrypted}</Value>
      </Section>
      <Section>
        <Label>{t("responses_submitted_at")}:</Label>
        <Value>
          {submittedAt
            ? submittedAt.toLocaleString()
            : <span style={{ color: "var(--theme-red)" }}>{t("responses_absent")}</span>}
        </Value>
      </Section>
      <Section>
        <Label>{t("responses_metrics")}:</Label>
        <Value>
          {metrics
            ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{JSON.stringify(metrics, null, 2)}</pre>
            : <span style={{ color: "var(--theme-red)" }}>{t("responses_absent")}</span>}
        </Value>
      </Section>
      <Section>
        <Label>{t("responses_metadata_status")}:</Label>
        <MetaStatusContainer>
          {metadataStatus.messages.map((msg, i) => (
            <MetaStatus key={i} $ok={metadataStatus.ok} style={{ marginBottom: 2 }}>
              {msg}
            </MetaStatus>
          ))}
        </MetaStatusContainer>
      </Section>
      <IdSection>
        <Label>{t("responses_id")}:</Label>
        <Value style={{ flex: 1 }}>{id}</Value>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          {onDelete && (
            <TrashButton
              title={t("delete_response")}
              onClick={() => onDelete(id)}
              disabled={isDeleting}
              aria-label={t("delete_response")}
            >
              <Trash2 size={19} />
            </TrashButton>
          )}
        </div>
      </IdSection>
    </Card>
  );
};

export default ResponseCard;

// --- Styled Components ---
const Card = styled.div`
  background: var(--card-background);
  border: 1.5px solid var(--background-adjacent-color);
  border-radius: var(--general-rounding);
  padding: 1.5rem 1.2rem 1.2rem 1.2rem;
  transition: border-color 0.3s;
  &:hover { border-color: var(--lightened-background-adjacent-color); }
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const Section = styled.div`
  margin-bottom: 2px;
`;

const IdSection = styled(Section)`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Label = styled.div`
  color: var(--subtle-color, #aaa);
  font-size: 0.97rem;
  font-weight: 600;
  margin-bottom: 1px;
  display: inline;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const Value = styled.div`
  color: var(--foreground, #fff);
  font-size: 1.01rem;
  white-space: pre-line;
  overflow-wrap: break-word;
  word-break: break-all;
  display: inline;
  margin-left: 0.4em;
  min-width: 0;
`;

const MetaStatusContainer = styled.div`
  margin-left: 0.75em;
`;

const MetaStatus = styled.div<{ $ok: boolean }>`
  font-size: 1.01rem;
  font-weight: 600;
  line-height: 1.7;
  color: ${({ $ok }) => ($ok ? "var(--theme-green)" : "var(--theme-red)")};
`;

const TrashButton = styled.button`
  background: var(--card-background);
  border: 1.5px solid var(--background-adjacent-color);
  border-radius: var(--general-rounding);
  color: var(--theme-red);
  cursor: pointer;
  padding: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s, background 0.15s;
  min-width: 36px;
  min-height: 36px;
  box-sizing: border-box;
  &:hover {
    border-color: var(--lightened-background-adjacent-color);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;