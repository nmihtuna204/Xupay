import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentList } from "./DocumentList";
import { kycUploadSchema } from "./KycUploader.schema";
import type { KycDocumentResponse } from "@/lib/api/user-service/kyc";

function doc(overrides: Partial<KycDocumentResponse>): KycDocumentResponse {
  return {
    id: crypto.randomUUID(),
    userId: "11111111-1111-1111-1111-111111111111",
    documentType: "NATIONAL_ID",
    fileUrl: "data:image/png;base64,AAAA",
    verificationStatus: "PENDING",
    createdAt: "2026-09-30T08:00:00Z",
    ...overrides,
  };
}

describe("DocumentList", () => {
  it("shows a rejected document's reason", () => {
    render(
      <DocumentList
        documents={[doc({ verificationStatus: "REJECTED", verificationNotes: "Photo is blurry" })]}
      />
    );
    expect(screen.getByText("Photo is blurry")).toBeInTheDocument();
  });

  it("does not show notes on other documents", () => {
    render(
      <DocumentList
        documents={[doc({ verificationStatus: "APPROVED", verificationNotes: "Approved by reviewer" })]}
      />
    );
    expect(screen.queryByText("Approved by reviewer")).not.toBeInTheDocument();
  });

  it("renders an expired document", () => {
    render(<DocumentList documents={[doc({ verificationStatus: "EXPIRED" })]} />);
    expect(screen.getByText("expired")).toBeInTheDocument();
  });
});

describe("kycUploadSchema country", () => {
  const file = new File(["x"], "id.png", { type: "image/png" });

  it.each(["", "VNM", "vnm"])("accepts %j", (documentCountry) => {
    expect(kycUploadSchema.safeParse({ documentType: "PASSPORT", documentCountry, file }).success).toBe(true);
  });

  it.each(["VN", "V", "VN1"])("refuses %j, which the API would reject", (documentCountry) => {
    expect(kycUploadSchema.safeParse({ documentType: "PASSPORT", documentCountry, file }).success).toBe(false);
  });
});
