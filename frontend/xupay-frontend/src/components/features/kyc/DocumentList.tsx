import { FileText } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/common/EmptyState";
import { KycStatusBadge } from "./KycStatusBadge";
import { formatDateShort } from "@/lib/format";
import type { KycDocumentResponse } from "@/lib/api/user-service/kyc";

const DOCUMENT_LABEL: Record<string, string> = {
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's license",
  NATIONAL_ID: "National ID",
  UTILITY_BILL: "Utility bill",
  SELFIE: "Selfie",
};

export function DocumentList({ documents }: { documents: KycDocumentResponse[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents uploaded"
        description="Upload an ID document to raise your verification tier and transaction limits."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div key={doc.id} className="panel flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-surface-hover">
              <FileText weight="light" className="size-4 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium">{DOCUMENT_LABEL[doc.documentType] ?? doc.documentType}</p>
              <p className="text-xs text-muted-foreground">Submitted {formatDateShort(doc.createdAt)}</p>
            </div>
          </div>
          <KycStatusBadge status={doc.verificationStatus} />
        </div>
      ))}
    </div>
  );
}
