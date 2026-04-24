"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  UploadSimple,
  X,
  WarningCircle,
} from "@phosphor-icons/react";
import { Vendor, KycDocuments } from "../types";
import { KYC_DOCS } from "../constants";
import {
  uploadVendorKycByAdmin,
  reviewVendorKyc,
  getSignedViewUrl,
} from "../api";
import { useToast } from "@/features/toast/toast-context";
import { uploadToStorage } from "../utils";

interface VendorKycUploadProps {
  vendor: Vendor;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

type DocStatus = "verified" | "rejected" | "pending";

function resolveVendorDocuments(vendor: Vendor): Partial<KycDocuments> {
  return {
    ...(vendor as any).documents,
    ...(vendor.kyc?.documents || {}),
  };
}

function applyVerificationToStatuses(
  current: Record<string, DocStatus>,
  verification?: Record<string, boolean>,
) {
  const next: Record<string, DocStatus> = { ...current };

  KYC_DOCS.forEach((d) => {
    if (!next[d.key]) next[d.key] = "pending";
  });

  Object.entries(verification || {}).forEach(([key, ok]) => {
    next[key] = ok ? "verified" : "rejected";
  });

  return next;
}

export const VendorKycUpload: React.FC<VendorKycUploadProps> = ({
  vendor,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [kycDocs, setKycDocs] = useState<Record<string, DocStatus>>({});
  const [documentPaths, setDocumentPaths] = useState<
    Partial<Record<string, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const [localFiles, setLocalFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const verification = vendor.kyc?.verification || vendor.verification || {};
    const docs = resolveVendorDocuments(vendor);

    setKycDocs((prev) => {
      const initial: Record<string, DocStatus> =
        prev && Object.keys(prev).length > 0 ? { ...prev } : {};

      KYC_DOCS.forEach((d) => {
        if (!initial[d.key]) initial[d.key] = "pending";
      });

      Object.entries(verification).forEach(([key, ok]) => {
        initial[key] = ok ? "verified" : "rejected";
      });

      return initial;
    });

    setDocumentPaths((prev) => {
      const next = { ...prev };
      Object.entries(docs).forEach(([key, val]) => {
        const path =
          typeof val === "string"
            ? val
            : (val as any)?.path || (val as any)?.url;
        if (path && typeof path === "string" && path.trim()) {
          next[key] = path;
        }
      });
      return next;
    });
  }, [vendor]);

  const setDocStatus = (key: string, status: DocStatus) => {
    setKycDocs((prev) => ({ ...prev, [key]: status }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingDoc) return;

    const docKey = uploadingDoc;
    // Store locally for immediate preview
    setLocalFiles((prev) => ({ ...prev, [docKey]: file }));

    try {
      // 1. & 2. Get signed URL & Upload to Storage
      const path = await uploadToStorage(vendor.id, docKey, file, "vendor");

      // 3. Finalize KYC with backend (Partial Update)
      const kycResponse = await uploadVendorKycByAdmin(vendor.id, {
        documents: { [docKey]: path } as any,
      });

      // Update state with the string path
      setDocumentPaths((prev) => ({
        ...prev,
        [docKey]: path,
      }));

      setKycDocs((prev) => {
        const next = applyVerificationToStatuses(
          prev,
          (kycResponse as any)?.verification,
        );
        next[docKey] = "pending";
        return next;
      });

      showToast({
        title: "Upload Successful",
        description: `${docKey.replace(/([A-Z])/g, " $1")} has been uploaded.`,
        tone: "success",
      });

      onSuccess();
    } catch (err: any) {
      showToast({
        title: "Upload Failed",
        description: err.message || "Failed to upload document",
        tone: "error",
      });
    } finally {
      setUploadingDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleViewDocument = async (docKey: string) => {
    const localFile = localFiles[docKey];
    if (localFile) {
      const previewUrl = URL.createObjectURL(localFile);
      window.open(previewUrl, "_blank");
      return;
    }

    const docPath = documentPaths[docKey];

    if (!docPath) {
      showToast({
        title: "No Document",
        description: "This document has not been uploaded yet.",
        tone: "warning",
      });
      return;
    }

    try {
      // If docPath is already a full URL, open it directly
      if (docPath.startsWith("http")) {
        window.open(docPath, "_blank");
        return;
      }

      const { signedUrl } = await getSignedViewUrl(docPath);
      if (signedUrl) {
        window.open(signedUrl, "_blank");
      } else {
        throw new Error("Received an empty view URL");
      }
    } catch (err: any) {
      showToast({
        title: "Error",
        description: "Failed to get view URL",
        tone: "error",
      });
    }
  };

  const saveKycReview = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });

      await reviewVendorKyc(vendor.id, {
        status: "in_review",
        reviewerNotes: "Review progress saved by admin.",
        verification,
      });

      showToast({
        title: "Progress Saved",
        description: "Document verification states updated.",
        tone: "success",
      });
      // We don't await onSuccess here because it might trigger a state update in the parent
      // that conflicts with onClose. Since we are closing, we just want to refresh the background data.
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to save progress",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyKycVerify = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const verification: Record<string, boolean> = {};
      KYC_DOCS.forEach((d) => {
        verification[d.key] = true;
      });

      await reviewVendorKyc(vendor.id, {
        status: "verified",
        reviewerNotes: "All documents verified by admin.",
        verification,
      });

      showToast({
        title: "KYC Verified",
        description: "Vendor has been successfully verified.",
        tone: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to verify KYC",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyKycReject = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });

      await reviewVendorKyc(vendor.id, {
        status: "rejected",
        reviewerNotes: "KYC rejected due to invalid or missing documents.",
        verification,
      });

      showToast({
        title: "KYC Rejected",
        description: "Vendor KYC status set to rejected.",
        tone: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to reject KYC",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyKycResubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });

      await reviewVendorKyc(vendor.id, {
        status: "pending",
        reviewerNotes: "Some documents need correction. Please re-upload.",
        verification,
      });

      showToast({
        title: "Resubmission Requested",
        description: "Vendor notified to re-upload documents.",
        tone: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to request resubmission",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const avatar = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {avatar(vendor.businessName)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Vendor KYC Review</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {vendor.businessName} · {vendor.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <p className="text-xs text-gray-500">
            Review each document individually, then approve or reject the
            vendor's KYC.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          {KYC_DOCS.map(({ key, label, hint }) => {
            const s = kycDocs[key] ?? "pending";
            const docPath = documentPaths[key];
            return (
              <div
                key={key}
                className={`rounded-xl border p-4 transition-colors ${s === "verified" ? "border-green-200 bg-green-50/40" : s === "rejected" ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <FileText
                      size={16}
                      className={`mt-0.5 shrink-0 ${s === "verified" ? "text-green-500" : s === "rejected" ? "text-red-400" : "text-gray-400"}`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        {label}
                      </p>
                      <p className="text-[10px] text-gray-400">{hint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s === "verified" ? "bg-green-100 text-green-700" : s === "rejected" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      {s === "verified"
                        ? "Verified"
                        : s === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                    <button
                      onClick={() => setDocStatus(key, "verified")}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-medium transition-colors ${s === "verified" ? "border-green-400 bg-green-500 text-white" : "border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500"}`}
                      title="Approve"
                    >
                      <CheckCircle size={13} weight="fill" />
                    </button>
                    <button
                      onClick={() => setDocStatus(key, "rejected")}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-medium transition-colors ${s === "rejected" ? "border-red-400 bg-red-500 text-white" : "border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500"}`}
                      title="Reject"
                    >
                      <XCircle size={13} weight="fill" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDocument(key)}
                    disabled={!docPath && !localFiles[key]}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${docPath || localFiles[key] ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "border-gray-100 text-gray-300 pointer-events-none"}`}
                  >
                    <Eye size={12} /> View Document
                  </button>
                  <button
                    onClick={() => {
                      setUploadingDoc(key);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingDoc === key}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${uploadingDoc === key ? "border-gray-100 text-gray-300 bg-gray-50" : "border-[#8a9e60] text-[#8a9e60] hover:bg-[#8a9e60]/5"}`}
                  >
                    {uploadingDoc === key ? (
                      <div className="w-3 h-3 border-2 border-[#8a9e60] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UploadSimple size={12} />
                    )}
                    Replace
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 shrink-0 bg-gray-50/50">
          <button
            onClick={saveKycReview}
            disabled={isSaving}
            className="flex-1 min-w-[120px] py-2 text-[10px] font-bold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            Save Review
          </button>
          <button
            onClick={applyKycReject}
            disabled={isSaving}
            className="flex-1 min-w-[120px] py-2 text-[10px] font-bold border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <XCircle size={13} />
            Reject KYC
          </button>
          <button
            onClick={applyKycResubmit}
            disabled={isSaving}
            className="flex-1 min-w-[120px] py-2 text-[10px] font-bold border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <WarningCircle size={13} />
            Request Resubmit
          </button>
          <button
            onClick={applyKycVerify}
            disabled={
              isSaving || !KYC_DOCS.every((d) => kycDocs[d.key] === "verified")
            }
            className={`flex-1 min-w-[120px] py-2 text-[10px] font-bold rounded-lg text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50`}
            style={{ backgroundColor: "#8a9e60" }}
          >
            <CheckCircle size={13} />
            Verify KYC
          </button>
        </div>
      </div>
    </div>
  );
};
