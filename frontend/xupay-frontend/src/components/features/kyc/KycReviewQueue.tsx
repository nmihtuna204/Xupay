"use client";

import { useState } from "react";
import { ArrowSquareOut, Check, SealCheck, X } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOCUMENT_LABEL } from "./DocumentList";
import { useApproveKycDocument, useRejectKycDocument } from "@/hooks/mutations/use-kyc-mutations";
import { formatDate } from "@/lib/format";
import type { KycTier } from "@/lib/api/user-service/auth";
import type { KycDocumentResponse } from "@/lib/api/user-service/kyc";

const TIER_OPTIONS: { value: KycTier; label: string }[] = [
  { value: "TIER_1", label: "Basic (Tier 1)" },
  { value: "TIER_2", label: "Verified (Tier 2)" },
  { value: "TIER_3", label: "Premium (Tier 3)" },
];

/**
 * The admin's KYC review queue: every pending document with approve (choosing
 * the tier to grant) and reject (with a reason the user will see).
 */
export function KycReviewQueue({ documents }: { documents: KycDocumentResponse[] }) {
  const [tiers, setTiers] = useState<Record<string, KycTier>>({});
  const [rejecting, setRejecting] = useState<KycDocumentResponse | null>(null);
  const [reason, setReason] = useState("");
  const approve = useApproveKycDocument();
  const reject = useRejectKycDocument();

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={SealCheck}
        title="Nothing to review"
        description="New identity documents appear here as soon as a user submits them."
      />
    );
  }

  function onApprove(doc: KycDocumentResponse) {
    const tier = tiers[doc.id] ?? "TIER_1";
    approve.mutate(
      { documentId: doc.id, upgradeTier: tier, verificationNotes: "Approved by reviewer" },
      {
        onSuccess: () => toast.success(`Approved. The user is now at least ${TIER_OPTIONS.find((t) => t.value === tier)?.label}.`),
        onError: (error) => toast.error(error.message || "Couldn't approve the document"),
      }
    );
  }

  function onReject() {
    if (!rejecting) return;
    reject.mutate(
      { documentId: rejecting.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Document rejected");
          setRejecting(null);
          setReason("");
        },
        onError: (error) => toast.error(error.message || "Couldn't reject the document"),
      }
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Grant tier</TableHead>
              <TableHead className="text-right">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <p className="font-medium">{DOCUMENT_LABEL[doc.documentType] ?? doc.documentType}</p>
                  <p className="text-xs text-muted-foreground">
                    {[doc.documentNumber, doc.documentCountry].filter(Boolean).join(" · ") || "No number"}
                  </p>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary-accent hover:underline"
                  >
                    Open file <ArrowSquareOut weight="light" className="size-3" />
                  </a>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{doc.userId.slice(0, 8)}…</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                <TableCell>
                  <Select
                    value={tiers[doc.id] ?? "TIER_1"}
                    onValueChange={(value) => setTiers((t) => ({ ...t, [doc.id]: value as KycTier }))}
                  >
                    <SelectTrigger className="w-44" aria-label="Tier to grant">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setRejecting(doc)} disabled={reject.isPending}>
                      <X weight="light" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => onApprove(doc)} disabled={approve.isPending}>
                      <Check weight="light" /> Approve
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>
              The user sees this reason and can submit a new document. An account that is already verified keeps its
              current tier.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Photo is blurry, the number isn't readable"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={onReject} disabled={reject.isPending || reason.trim() === ""}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
