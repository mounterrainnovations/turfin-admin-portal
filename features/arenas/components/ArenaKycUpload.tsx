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
import { Arena, KycStatus } from "../types";
import { uploadArenaDocuments, reviewArenaDocuments } from "../api";
import { getSignedViewUrl } from "@/features/vendors/api";
import { resolveStorageDocumentUrl } from "@/features/vendors/document-url";
import { useToast } from "@/features/toast/toast-context";
import { uploadToStorage } from "@/features/vendors/utils";
import { DocumentPreviewModal } from "@/features/vendors/components/DocumentPreviewModal";

const ARENA_KYC_DOCS = [
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
    key: "arenaPhotos",
    label: "Arena Photos",
    hint: "High-resolution facility images (Max 5)",
  },
] as const;

interface ArenaKycUploadProps {
  arena: Arena;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

type DocStatus = "verified" | "rejected" | "pending";

function resolveArenaDocuments(arena: Arena) {
  return {
    ...(arena.documents || {}),
    ...(arena.kyc?.documents || {}),
  };
}

function applyVerificationToStatuses(
  current: Record<string, DocStatus>,
  verification?: Record<string, boolean>,
) {
  const next: Record<string, DocStatus> = { ...current };

  ARENA_KYC_DOCS.forEach((d) => {
    if (!next[d.key]) next[d.key] = "pending";
  });

  Object.entries(verification || {}).forEach(([key, ok]) => {
    next[key] = ok ? "verified" : "rejected";
  });

  return next;
}

export const ArenaKycUpload: React.FC<ArenaKycUploadProps> = ({
  arena,
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
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const verification = arena.kyc?.verification || arena.verification || {};
    const docs = resolveArenaDocuments(arena);

    setKycDocs((prev) => {
      const initial: Record<string, DocStatus> =
        prev && Object.keys(prev).length > 0 ? { ...prev } : {};

      ARENA_KYC_DOCS.forEach((d) => {
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
  }, [arena]);

  const setDocStatus = (key: string, status: DocStatus) => {
    setKycDocs((prev) => ({ ...prev, [key]: status }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingDoc) return;

    const docKey = uploadingDoc;
    const isPhoto = docKey === "arenaPhotos";

    if (isPhoto) {
      setLocalFiles((prev) => {
        const existing = Array.isArray(prev.arenaPhotos) ? prev.arenaPhotos : [];
        return { ...prev, arenaPhotos: [...existing, file].slice(-5) };
      });
    } else {
      setLocalFiles((prev) => ({ ...prev, [docKey]: file }));
    }

    try {
      const path = await uploadToStorage(arena.id, docKey, file, "arena");

      let updatedDocuments: any = { [docKey]: path };

      if (isPhoto) {
        const existingPhotos = Array.isArray(documentPaths.arenaPhotos)
          ? (documentPaths.arenaPhotos as string[])
          : [];
        const newPhotos = [...existingPhotos, path].slice(-5);
        updatedDocuments = { arenaPhotos: newPhotos };
      }

      const updatedArena = await uploadArenaDocuments(arena.id, {
        documents: updatedDocuments,
      });

      const nextDocuments = resolveArenaDocuments(updatedArena);
      const nextDocValue =
        nextDocuments[docKey as keyof typeof nextDocuments] || path;
      setDocumentPaths((prev) => ({
        ...prev,
        ...(isPhoto
          ? { arenaPhotos: nextDocuments.arenaPhotos || updatedDocuments.arenaPhotos }
          : { [docKey]: nextDocValue }),
      }));

      setKycDocs((prev) => {
        const next = applyVerificationToStatuses(
          prev,
          updatedArena.kyc?.verification || updatedArena.verification,
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
      setPreviewDoc({
        title: "Document Preview",
        url: URL.createObjectURL(path),
      });
      return;
    }

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
      const resolvedUrl = await resolveStorageDocumentUrl(
        actualPath,
        getSignedViewUrl,
      );
      setPreviewDoc({
        title: "Document Preview",
        url: resolvedUrl,
      });
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to get view URL",
        tone: "error",
      });
    }
  };

  const handleRemovePhoto = async (photoPath: string) => {
    try {
      const existingPhotos = Array.isArray(documentPaths.arenaPhotos)
        ? documentPaths.arenaPhotos
        : [];
      const newPhotos = (existingPhotos as any[])
        .map((p: any) => (typeof p === "string" ? p : p.path))
        .filter((p: string) => p !== photoPath && !p.includes(photoPath));

      const updatedArena = await uploadArenaDocuments(arena.id, {
        documents: { arenaPhotos: newPhotos },
      });

      showToast({
        title: "Photo Removed",
        description: "Arena photo has been removed successfully.",
        tone: "success",
      });
      setDocumentPaths((prev) => ({
        ...prev,
        arenaPhotos:
          resolveArenaDocuments(updatedArena).arenaPhotos || newPhotos,
      }));
      onSuccess();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to remove photo",
        tone: "error",
      });
    }
  };

  const submitReview = async (
    status: KycStatus,
    reviewerNotes: string,
    verification: Record<string, boolean>,
    successTitle: string,
    successDescription: string,
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await reviewArenaDocuments(arena.id, {
        status,
        reviewerNotes,
        verification,
      });

      showToast({
        title: successTitle,
        description: successDescription,
        tone: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to save review",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveKycReview = async () => {
    const verification: Record<string, boolean> = {};
    Object.entries(kycDocs).forEach(([key, status]) => {
      if (status === "verified") verification[key] = true;
      if (status === "rejected") verification[key] = false;
    });

    await submitReview(
      "in_review",
      "Review progress saved by admin.",
      verification,
      "Progress Saved",
      "Document verification states updated.",
    );
  };

  const applyKycVerify = async () => {
    const verification: Record<string, boolean> = {};
    ARENA_KYC_DOCS.forEach((d) => {
      verification[d.key] = true;
    });

    await submitReview(
      "verified",
      "All documents verified by admin.",
      verification,
      "KYC Verified",
      "Arena has been successfully verified.",
    );
  };

  const applyKycReject = async () => {
    const verification: Record<string, boolean> = {};
    Object.entries(kycDocs).forEach(([key, status]) => {
      if (status === "verified") verification[key] = true;
      if (status === "rejected") verification[key] = false;
    });

    await submitReview(
      "rejected",
      "KYC rejected due to invalid or missing documents.",
      verification,
      "KYC Rejected",
      "Arena KYC status set to rejected.",
    );
  };

  const applyKycResubmit = async () => {
    const verification: Record<string, boolean> = {};
    Object.entries(kycDocs).forEach(([key, status]) => {
      if (status === "verified") verification[key] = true;
      if (status === "rejected") verification[key] = false;
    });

    await submitReview(
      "pending",
      "Some documents need correction. Please re-upload.",
      verification,
      "Resubmission Requested",
      "Vendor notified to re-upload documents.",
    );
  };

  const avatar = (name?: string | null) => {
    if (!name) return "AR";
    return name.slice(0, 2).toUpperCase();
  };

  const getDocPath = (key: string) => documentPaths[key];

  return (
    <>
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
                  {avatar(arena.name)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Arena KYC Review</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {arena.name || "Unnamed Arena"} · {arena.id}
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
              arena&apos;s KYC.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept={uploadingDoc === "arenaPhotos" ? "image/*" : ".pdf,image/*"}
            />

            {ARENA_KYC_DOCS.map(({ key, label, hint }) => {
              const s = kycDocs[key] ?? "pending";
              const docData = getDocPath(key);
              const isPhotoField = key === "arenaPhotos";
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

                  {isPhotoField ? (
                    <div className="space-y-2">
                      {photoList.length > 0 ? (
                        photoList.map((photoPath: string, index: number) => (
                          <div
                            key={`${photoPath}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Image
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <p className="text-xs text-gray-600 truncate">
                                Arena Photo {index + 1}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleViewDocument(photoPath)}
                                className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleRemovePhoto(photoPath)}
                                className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-gray-400 rounded-lg border border-dashed border-gray-200 px-3 py-2">
                          No photos uploaded yet.
                        </div>
                      )}
                    </div>
                  ) : docData ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          size={14}
                          className="text-gray-400 shrink-0"
                        />
                        <p className="text-xs text-gray-600 truncate">
                          Uploaded document
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewDocument(docData)}
                        className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center shrink-0"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      <WarningCircle size={14} className="shrink-0" />
                      Document not uploaded yet.
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setUploadingDoc(key);
                      fileInputRef.current?.click();
                    }}
                    className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <UploadSimple size={14} />
                    {isPhotoField ? "Add Photo" : "Upload Replacement"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={applyKycResubmit}
                disabled={isSaving}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-60"
              >
                Request Resubmission
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveKycReview}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-60"
                >
                  Save Review
                </button>
                <button
                  onClick={applyKycReject}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  onClick={applyKycVerify}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-xl bg-[#8a9e60] text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc.url}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  );
};
