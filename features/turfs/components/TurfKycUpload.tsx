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
  Image,
} from "@phosphor-icons/react";
import { Turf, SubmitTurfDocumentsDto, TurfReviewDto } from "../types";
import { uploadTurfDocuments, reviewTurfDocuments } from "../api";
import { getSignedViewUrl } from "@/features/vendors/api";
import { useToast } from "@/features/toast/toast-context";
import { uploadToStorage } from "@/features/vendors/utils";

const KYC_DOCS_FIELD = [
  {
    key: "propertyDocument",
    label: "Property Document",
    hint: "Ownership or Lease Agreement",
  },
  {
    key: "municipalNoc",
    label: "Municipal NOC",
    hint: "No Objection Certificate",
  },
  {
    key: "liabilityInsurance",
    label: "Liability Insurance",
    hint: "Active public liability insurance",
  },
  {
    key: "fieldPhotos",
    label: "Field Photos",
    hint: "High-resolution facility images (Max 5)",
  },
] as const;

interface TurfKycUploadProps {
  turf: Turf;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

type DocStatus = "verified" | "rejected" | "pending";

function resolveTurfDocuments(
  turf: Turf,
): Partial<SubmitTurfDocumentsDto["documents"]> {
  const legacyDocuments =
    turf.documents &&
    "documents" in turf.documents &&
    turf.documents.documents &&
    typeof turf.documents.documents === "object"
      ? turf.documents.documents
      : (turf.documents as any);

  return {
    ...(legacyDocuments || {}),
    ...(turf.kyc?.documents || {}),
  };
}

function applyVerificationToStatuses(
  current: Record<string, DocStatus>,
  verification?: Record<string, boolean>,
) {
  const next: Record<string, DocStatus> = { ...current };

  KYC_DOCS_FIELD.forEach((d) => {
    if (!next[d.key]) next[d.key] = "pending";
  });

  Object.entries(verification || {}).forEach(([key, ok]) => {
    next[key] = ok ? "verified" : "rejected";
  });

  return next;
}

export const TurfKycUpload: React.FC<TurfKycUploadProps> = ({
  turf,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [kycDocs, setKycDocs] = useState<Record<string, DocStatus>>({});
  const [documentPaths, setDocumentPaths] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localFiles, setLocalFiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const verification = turf.kyc?.verification || turf.verification;
    const docs = resolveTurfDocuments(turf);

    setKycDocs((prev) => {
      const initial: Record<string, DocStatus> =
        prev && Object.keys(prev).length > 0 ? { ...prev } : {};

      KYC_DOCS_FIELD.forEach((d) => {
        if (!initial[d.key]) initial[d.key] = "pending";
      });

      Object.entries(verification || {}).forEach(([key, ok]) => {
        initial[key] = ok ? "verified" : "rejected";
      });

      return initial;
    });

    setDocumentPaths((prev) => {
      const next = { ...prev };
      Object.entries(docs).forEach(([key, val]) => {
        if (!val) return;

        if (Array.isArray(val)) {
          next[key] = val
            .map((v) =>
              typeof v === "string" ? v : (v as any)?.path || (v as any)?.url,
            )
            .filter(Boolean);
        } else {
          const path =
            typeof val === "string"
              ? val
              : (val as any)?.path || (val as any)?.url;
          if (path && typeof path === "string" && path.trim()) {
            next[key] = path;
          }
        }
      });
      return next;
    });
  }, [turf]);

  const setDocStatus = (key: string, status: DocStatus) => {
    setKycDocs((prev) => ({ ...prev, [key]: status }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingDoc) return;

    const docKey = uploadingDoc;
    const isPhoto = docKey === "fieldPhotos";

    // Store locally for immediate preview
    if (isPhoto) {
      setLocalFiles((prev) => {
        const existing = Array.isArray(prev.fieldPhotos)
          ? prev.fieldPhotos
          : [];
        return { ...prev, fieldPhotos: [...existing, file].slice(-5) };
      });
    } else {
      setLocalFiles((prev) => ({ ...prev, [docKey]: file }));
    }

    try {
      // 1. & 2. Get signed URL & Upload to Storage
      const path = await uploadToStorage(turf.id, docKey, file, "turf");

      // 3. Finalize KYC with backend (Partial Update)
      let updatedDocuments: any = { [docKey]: path };

      if (isPhoto) {
        const existingPhotos = Array.isArray(documentPaths.fieldPhotos)
          ? (documentPaths.fieldPhotos as string[])
          : [];
        // Append new photo (up to 5)
        const newPhotos = [...existingPhotos, path].slice(-5);
        updatedDocuments = { fieldPhotos: newPhotos };
        setDocumentPaths((prev) => ({ ...prev, fieldPhotos: newPhotos }));
      } else {
        setDocumentPaths((prev) => ({ ...prev, [docKey]: path }));
      }

      const documentsResponse = await uploadTurfDocuments(turf.id, {
        documents: updatedDocuments,
      });

      setDocumentPaths((prev) => ({
        ...prev,
        ...(isPhoto
          ? { fieldPhotos: updatedDocuments.fieldPhotos }
          : { [docKey]: path }),
      }));

      setKycDocs((prev) => {
        const next = applyVerificationToStatuses(
          prev,
          (documentsResponse as any)?.verification,
        );
        next[docKey] = "pending";
        return next;
      });

      showToast({
        title: "Upload Successful",
        description: `${docKey.replace(/([A-Z])/g, " $1")} has been updated.`,
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

  const handleViewDocument = async (path: any) => {
    if (!path) return;

    if (path instanceof File) {
      const previewUrl = URL.createObjectURL(path);
      window.open(previewUrl, "_blank");
      return;
    }

    // path could be an object if passed directly from some source, though documentPaths now has strings
    const actualPath =
      typeof path === "string"
        ? path
        : (path as any)?.path || (path as any)?.url;

    if (!actualPath || typeof actualPath !== "string") {
      showToast({
        title: "Error",
        description: "Invalid document path",
        tone: "error",
      });
      return;
    }

    try {
      if (actualPath.startsWith("http")) {
        window.open(actualPath, "_blank");
        return;
      }
      const { signedUrl } = await getSignedViewUrl(actualPath);
      if (signedUrl) window.open(signedUrl, "_blank");
    } catch (err) {
      showToast({
        title: "Error",
        description: "Failed to get view URL",
        tone: "error",
      });
    }
  };

  const handleRemovePhoto = async (photoPath: string) => {
    try {
      const existingPhotos = Array.isArray(documentPaths.fieldPhotos)
        ? documentPaths.fieldPhotos
        : [];
      const newPhotos = (existingPhotos as any[])
        .map((p: any) => (typeof p === "string" ? p : p.path))
        .filter((p: string) => p !== photoPath && !p.includes(photoPath));

      await uploadTurfDocuments(turf.id, {
        documents: { fieldPhotos: newPhotos } as any,
      });

      showToast({
        title: "Photo Removed",
        description: "Field photo has been removed successfully.",
        tone: "success",
      });
      setDocumentPaths((prev) => ({ ...prev, fieldPhotos: newPhotos }));
      onSuccess();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: "Failed to remove photo",
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

      await reviewTurfDocuments(turf.id, {
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
      KYC_DOCS_FIELD.forEach((d) => {
        verification[d.key] = true;
      });

      await reviewTurfDocuments(turf.id, {
        status: "verified",
        reviewerNotes: "All documents verified by admin.",
        verification,
      });

      showToast({
        title: "KYC Verified",
        description: "Field has been successfully verified.",
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

      await reviewTurfDocuments(turf.id, {
        status: "rejected",
        reviewerNotes: "KYC rejected due to invalid or missing documents.",
        verification,
      });

      showToast({
        title: "KYC Rejected",
        description: "Field KYC status set to rejected.",
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

  const avatar = (name: string) => {
    if (!name) return "FT";
    return name.slice(0, 2).toUpperCase();
  };

  const getDocPath = (key: string) => {
    return documentPaths[key];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {avatar(turf.name)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Turf KYC Review</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {turf.name} · {turf.id}
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
            field's KYC.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept={uploadingDoc === "fieldPhotos" ? "image/*" : ".pdf,image/*"}
          />

          {KYC_DOCS_FIELD.map(({ key, label, hint }) => {
            const s = kycDocs[key] ?? "pending";
            const docData = getDocPath(key);
            const isPhotoField = key === "fieldPhotos";
            const photoList =
              isPhotoField && Array.isArray(docData) ? docData : [];

            return (
              <div
                key={key}
                className={`rounded-xl border p-4 transition-colors ${s === "verified" ? "border-green-200 bg-green-50/40" : s === "rejected" ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    {isPhotoField ? (
                      <Image
                        size={16}
                        className={`mt-0.5 shrink-0 ${s === "verified" ? "text-green-500" : s === "rejected" ? "text-red-400" : "text-gray-400"}`}
                      />
                    ) : (
                      <FileText
                        size={16}
                        className={`mt-0.5 shrink-0 ${s === "verified" ? "text-green-500" : s === "rejected" ? "text-red-400" : "text-gray-400"}`}
                      />
                    )}
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
                    >
                      <CheckCircle size={13} weight="fill" />
                    </button>
                    <button
                      onClick={() => setDocStatus(key, "rejected")}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-medium transition-colors ${s === "rejected" ? "border-red-400 bg-red-500 text-white" : "border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500"}`}
                    >
                      <XCircle size={13} weight="fill" />
                    </button>
                  </div>
                </div>

                {/* Document Display / Actions */}
                <div className="flex flex-col gap-2">
                  {isPhotoField ? (
                    <div className="grid grid-cols-2 gap-2">
                      {photoList.map((photo: any, index: number) => {
                        const path =
                          typeof photo === "string" ? photo : photo.path;
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group"
                          >
                            <span className="text-[10px] text-gray-600 truncate max-w-[100px]">
                              Photo {index + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleViewDocument(
                                    localFiles.fieldPhotos?.[index] || path,
                                  )
                                }
                                className="text-gray-500 hover:text-[#8a9e60] transition-colors"
                              >
                                <Eye size={12} weight="bold" />
                              </button>
                              <button
                                onClick={() => handleRemovePhoto(path)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <X size={12} weight="bold" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {photoList.length < 5 && (
                        <button
                          onClick={() => {
                            setUploadingDoc(key);
                            fileInputRef.current?.click();
                          }}
                          className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#8a9e60] hover:text-[#8a9e60] transition-all text-[10px] font-medium h-[33px]"
                        >
                          <UploadSimple size={12} />
                          Add Photo ({photoList.length}/5)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleViewDocument(localFiles[key] || docData)
                        }
                        disabled={!docData && !localFiles[key]}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${docData || localFiles[key] ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "border-gray-100 text-gray-300 pointer-events-none"}`}
                      >
                        <Eye size={12} /> View Document
                      </button>
                      <button
                        onClick={() => {
                          setUploadingDoc(key);
                          fileInputRef.current?.click();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#8a9e60] text-[#8a9e60] text-[10px] font-medium hover:bg-[#8a9e60]/5 transition-colors"
                      >
                        <UploadSimple size={12} /> Replace
                      </button>
                    </div>
                  )}
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
            onClick={applyKycVerify}
            disabled={
              isSaving ||
              !KYC_DOCS_FIELD.every((d) => kycDocs[d.key] === "verified")
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
