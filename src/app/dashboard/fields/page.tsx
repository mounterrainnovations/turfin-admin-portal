"use client";

import {
  MapPin,
  MagnifyingGlass,
  CheckCircle,
  Prohibit,
  ShieldCheck,
  WarningCircle,
  DotsThree,
  X,
  Eye,
  Buildings,
  Plus,
  CaretRight,
  CaretLeft,
  FileText,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useTurfsList, turfsApi } from "@/domains/turfs/api";
import { TurfResponse, TurfStatus } from "@/domains/turfs/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ErrorCodes } from "@/lib/error-codes";
import { ApiError } from "@/lib/api-client";
import Link from "next/link";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  suspended: {
    label: "Suspended",
    color: "bg-red-100 text-red-600",
    dot: "bg-red-500",
  },
};

const PAGE_SIZE = 10;

// ─── Actions Menu ─────────────────────────────────────────────────────────────
function ActionsMenu({
  turf,
}: {
  turf: TurfResponse;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TurfStatus }) =>
      turfsApi.updateTurfStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "turfs"] });
      toast.success("Status updated successfully");
      setOpen(false);
    },
    onError: (error: ApiError) => {
      if (error?.code === ErrorCodes.KYC_NOT_VERIFIED) {
        toast.error("Vendor KYC must be verified first");
      } else {
        toast.error("Failed to update status");
      }
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <DotsThree size={18} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
          {turf.status === "pending" && (
            <button
              onClick={() =>
                statusMutation.mutate({ id: turf.id, status: "active" })
              }
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors font-medium"
            >
              <CheckCircle size={13} /> Approve Field
            </button>
          )}
          {turf.status === "active" && (
            <button
              onClick={() =>
                statusMutation.mutate({ id: turf.id, status: "suspended" })
              }
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
            >
              <Prohibit size={13} /> Suspend Field
            </button>
          )}
          {turf.status === "suspended" && (
            <button
              onClick={() =>
                statusMutation.mutate({ id: turf.id, status: "active" })
              }
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors font-medium"
            >
              <CheckCircle size={13} /> Reinstate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function FieldDetailPanel({
  turf,
  onClose,
  onReviewDocs,
}: {
  turf: TurfResponse;
  onClose: () => void;
  onReviewDocs: () => void;
}) {
  const sc = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-100 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div
        className="shrink-0 p-6 flex items-start justify-between border-b border-gray-100"
        style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold border border-white/30 shadow-lg shrink-0 overflow-hidden">
            {turf.documents?.documents.fieldPhotos?.[0] ? (
              <img
                src={turf.documents.documents.fieldPhotos[0]}
                alt={turf.name}
                className="w-full h-full object-cover"
              />
            ) : (
              "T"
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">
              {turf.name}
            </h2>
            <p className="text-white/70 text-[11px] font-mono mt-1 truncate">
              {turf.id}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-white/20 text-white border border-white/10`}
              >
                <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                {sc.label.toUpperCase()}
              </span>
              <span className="text-[9px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full capitalize border border-white/5">
                {turf.surfaceType?.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white shrink-0"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Photos */}
        {turf.documents?.documents.fieldPhotos &&
        turf.documents.documents.fieldPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {turf.documents.documents.fieldPhotos.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Field ${idx}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-100"
              />
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
            <div className="text-gray-300 flex flex-col items-center gap-2">
              <Buildings size={32} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                No Photos Uploaded
              </span>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Price</p>
            <p className="text-base font-bold text-gray-800">
              ₹{turf.standardPricePaise / 100}/hr
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Surface</p>
            <p className="text-base font-bold text-gray-800 capitalize">
              {turf.surfaceType?.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Weekday</p>
            <p className="text-[11px] font-bold text-gray-800">
              {turf.weekdayOpen.slice(0, 5)} - {turf.weekdayClose.slice(0, 5)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase">Weekend</p>
            <p className="text-[11px] font-bold text-gray-800">
              {turf.weekendOpen.slice(0, 5)} - {turf.weekendClose.slice(0, 5)}
            </p>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Amenities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {turf.amenities?.map((a) => (
              <span
                key={a}
                className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium capitalize"
              >
                {a.replace(/_/g, " ")}
              </span>
            ))}
            {(!turf.amenities || turf.amenities.length === 0) && (
              <span className="text-[11px] text-gray-400 italic">
                No amenities listed
              </span>
            )}
          </div>
        </div>

        {/* KYC Documents */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            KYC Documents
          </p>
          {turf.documents?.documents ? (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">
                  Verification Status
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${turf.documents.status === "verified" ? "bg-green-100 text-green-700" : turf.documents.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {(turf.documents.status || "PENDING").replace(/_/g, " ")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(turf.documents.documents).map(
                  ([key, value]) => {
                    if (!value || key === "fieldPhotos") return null;
                    if (Array.isArray(value) && value.length === 0) return null;
                    const label = key.replace(/([A-Z])/g, " $1").trim();
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100"
                      >
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          {label}
                        </span>
                        <a
                          href={value as string}
                          target="_blank"
                          className="text-[10px] text-[#8a9e60] font-bold hover:underline flex items-center gap-1"
                        >
                          <Eye size={12} /> VIEW
                        </a>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              No documents uploaded
            </p>
          )}
        </div>
      </div>

      {/* Quick Review Button */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={() => {
            onClose();
            onReviewDocs();
          }}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
          style={{ backgroundColor: "#8a9e60" }}
        >
          <ShieldCheck size={14} /> Review Documents
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FieldsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<TurfStatus | "all">("all");
  const [selected, setSelected] = useState<TurfResponse | null>(null);
  const [docsReviewTurf, setDocsReviewTurf] = useState<TurfResponse | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState("");
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const { data, isLoading } = useTurfsList({
    page,
    limit: PAGE_SIZE,
    status: statusTab === "all" ? undefined : statusTab,
    search: search || undefined,
  });

  const turfs = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1;
  const queryClient = useQueryClient();

  const docsReviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "verified" | "rejected" | "in_review";
      notes?: string;
    }) => turfsApi.reviewTurfDocuments(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "turfs"] });
      toast.success("Document review submitted");
      setDocsReviewTurf(null);
      setReviewNote("");
    },
    onError: (error: ApiError) => {
      if (error?.code === ErrorCodes.KYC_NOT_VERIFIED) {
        setKycError(error.message || "Vendor KYC must be verified first");
      } else {
        toast.error("Failed to submit review");
      }
    },
  });

  function closeDocsModal() {
    setDocsReviewTurf(null);
    setReviewNote("");
    setKycError(null);
  }

  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "suspended", label: "Suspended" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Field Management</h1>
          <button
            onClick={() => setOnboardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#8a9e60" }}
          >
            <Plus size={16} weight="bold" /> Onboard Field
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Search hidden for now */}
            {/* <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-80">
              <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search turf name, location, ID..."
                className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
              />
            </div> */}

            {/* Tabs */}
            <div className="flex gap-1.5 ml-auto">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setStatusTab(t.key as TurfStatus | "all");
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusTab === t.key
                      ? "text-white"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                  style={
                    statusTab === t.key ? { backgroundColor: "#8a9e60" } : {}
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-50/80 sticky top-0 z-10">
                <tr>
                  {[
                    "Turf Detail",
                    "Category",
                    "Status",
                    "Price",
                    "KYC Status",
                    "Created",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      </td>
                    </tr>
                  ))
                ) : turfs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Buildings
                        size={32}
                        className="text-gray-200 mx-auto mb-3"
                      />
                      <p className="text-sm text-gray-400">No fields found</p>
                    </td>
                  </tr>
                ) : (
                  turfs.map((turf) => {
                    const sc =
                      STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;
                    const kycStatus = turf.documents?.status || "missing";

                    return (
                      <tr
                        key={turf.id}
                        onClick={() => setSelected(turf)}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                              {turf.documents?.documents?.fieldPhotos?.[0] ? (
                                <img
                                  src={turf.documents.documents.fieldPhotos[0]}
                                  alt={turf.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-700">
                                  TURF
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 text-sm truncate">
                                {turf.name}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                <MapPin size={9} /> {turf.address.city},{" "}
                                {turf.address.state}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {turf.surfaceType?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${sc.dot}`}
                            />
                            {sc.label.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-gray-800">
                            ₹{turf.standardPricePaise / 100}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kycStatus === "verified" ? "bg-green-50 text-green-600" : kycStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}
                          >
                            {kycStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[10px] text-gray-500 font-mono">
                            {new Date(turf.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td
                          className="px-4 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionsMenu turf={turf} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/30">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="text-gray-700">{turfs.length}</span> of{" "}
              {meta?.total || 0} fields
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <span className="text-[11px] font-bold text-gray-600 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel Overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[2px]"
            onClick={() => setSelected(null)}
          />
          <FieldDetailPanel
            turf={selected}
            onClose={() => setSelected(null)}
            onReviewDocs={() => setDocsReviewTurf(selected)}
          />
        </>
      )}

      {/* ── Turf Document Review Modal ── */}
      {docsReviewTurf && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeDocsModal}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Review Turf Documents
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {docsReviewTurf.name} · {docsReviewTurf.id}
                </p>
              </div>
              <button
                onClick={closeDocsModal}
                className="p-2 rounded-full hover:bg-gray-50 text-gray-400"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Current doc status */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Current Document Status:
                </span>
                {(() => {
                  const s = docsReviewTurf.documents?.status || "missing";
                  const cls =
                    s === "verified"
                      ? "bg-green-50 text-green-700"
                      : s === "rejected"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700";
                  return (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls}`}
                    >
                      {s.toUpperCase()}
                    </span>
                  );
                })()}
              </div>

              {/* Guideline */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
                <WarningCircle size={20} weight="fill" className="shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Review Guidelines</p>
                  <p className="mt-0.5 opacity-80 leading-relaxed">
                    <strong>Approve</strong> → Turf becomes Active and can
                    accept bookings.
                    <br />
                    <strong>Request Changes</strong> → Documents stay In Review,
                    vendor is notified with your notes.
                    <br />
                    <strong>Reject</strong> → Turf returns to Pending. Always
                    include a specific reason.
                  </p>
                </div>
              </div>

              {/* KYC Error Alert */}
              {kycError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-3 text-red-700">
                    <Prohibit size={20} weight="fill" className="shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold">Blocking Requirement</p>
                      <p className="mt-0.5 opacity-80 leading-relaxed">
                        {kycError}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/dashboard/vendors"
                      className="text-[10px] font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck size={12} weight="bold" /> GO TO VENDOR VERIFICATION
                    </Link>
                  </div>
                </div>
              )}

              {/* Document list */}
              <div className="space-y-3">
                {docsReviewTurf.documents?.documents &&
                Object.keys(docsReviewTurf.documents.documents).length > 0 ? (
                  Object.entries(docsReviewTurf.documents.documents).map(
                    ([key, value]) => {
                      const urls: string[] = Array.isArray(value)
                        ? value
                        : value
                          ? [value as string]
                          : [];
                      return (
                        <div
                          key={key}
                          className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                {urls.length > 0
                                  ? `${urls.length} file(s) — READY FOR REVIEW`
                                  : "MISSING"}
                              </p>
                            </div>
                          </div>
                          {urls.length > 0 && (
                            <div className="flex gap-2">
                              {urls.slice(0, 2).map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800"
                                >
                                  <Eye size={13} />{" "}
                                  {urls.length > 1 ? `#${i + 1}` : "VIEW"}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                    <FileText
                      size={40}
                      className="text-gray-200 mx-auto mb-2"
                    />
                    <p className="text-sm font-bold text-gray-300">
                      No documents uploaded yet
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Reviewer Notes{" "}
                  <span className="text-red-400 normal-case">
                    (required for Reject / Request Changes)
                  </span>
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder='e.g. "Property ownership and safety certificates verified. Turf is now live." or "Missing fire safety certificate. Please upload the valid document for the current year."'
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button
                onClick={() =>
                  docsReviewMutation.mutate({
                    id: docsReviewTurf.id,
                    status: "rejected",
                    notes: reviewNote,
                  })
                }
                disabled={!reviewNote.trim() || docsReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-red-600 border border-red-100 bg-white hover:bg-red-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✕ REJECT
              </button>
              <button
                onClick={() =>
                  docsReviewMutation.mutate({
                    id: docsReviewTurf.id,
                    status: "in_review",
                    notes: reviewNote,
                  })
                }
                disabled={!reviewNote.trim() || docsReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-amber-700 border border-amber-100 bg-white hover:bg-amber-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↩ REQUEST CHANGES
              </button>
              <button
                onClick={() =>
                  docsReviewMutation.mutate({
                    id: docsReviewTurf.id,
                    status: "verified",
                    notes: reviewNote,
                  })
                }
                disabled={docsReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-60"
                style={{ backgroundColor: "#8a9e60" }}
              >
                ✓ APPROVE DOCS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onboard Field Modal ── */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setOnboardModalOpen(false)}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col">
            <OnboardFieldForm
              onClose={() => setOnboardModalOpen(false)}
              onSuccess={() => {
                setOnboardModalOpen(false);
                queryClient.invalidateQueries({ queryKey: ["admin", "turfs"] });
                toast.success("Field onboarded successfully");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardFieldForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    sports: [] as string[],
    surfaceType: "artificial_turf",
    standardPricePaise: 150000,
    addressLineOne: "",
    city: "",
    state: "",
    pinCode: "",
    weekdayOpen: "06:00:00",
    weekdayClose: "23:00:00",
    weekendOpen: "06:00:00",
    weekendClose: "23:00:00",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => turfsApi.onboardTurf(selectedVendorId, data),
    onSuccess,
    onError: (err: ApiError) => {
      if (err?.code === ErrorCodes.KYC_NOT_VERIFIED) {
        toast.error("Vendor KYC must be verified before onboarding fields");
      } else {
        toast.error(err?.message || "Failed to onboard field");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return toast.error("Please select a vendor first");
    mutation.mutate({
      ...formData,
      address: {
        addressLineOne: formData.addressLineOne,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
      <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Onboard New Field</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Step {step} of 2: {step === 1 ? "Select Vendor" : "Field Details"}</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-50 text-gray-400">
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assign to Vendor (ID)</label>
              <input
                required
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                placeholder="Enter Vendor ID (e.g. vend_...)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-[#8a9e60] transition-colors"
              />
              <p className="text-[10px] text-gray-400 italic mt-2">
                Currently, please provide the unique Vendor ID. You can find this in the Vendors dashboard.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Field Name</label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Center Court - Smash Arena"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Surface Type</label>
              <select
                value={formData.surfaceType}
                onChange={e => setFormData({ ...formData, surfaceType: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#8a9e60] appearance-none"
              >
                <option value="natural_grass">Natural Grass</option>
                <option value="artificial_turf">Artificial Turf</option>
                <option value="clay">Clay</option>
                <option value="hard_court">Hard Court</option>
              </select>
            </div>
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pr-1">Price (paise/hr)</label>
              <input
                type="number"
                required
                value={formData.standardPricePaise}
                onChange={e => setFormData({ ...formData, standardPricePaise: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 text-right outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="space-y-1.5 col-span-2 mt-2">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} weight="fill" className="text-[#8a9e60]" /> Location Details
              </p>
            </div>
            <div className="space-y-1.5 col-span-2">
              <input
                required
                value={formData.addressLineOne}
                onChange={e => setFormData({ ...formData, addressLineOne: e.target.value })}
                placeholder="Address line 1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="space-y-1.5">
              <input
                required
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="space-y-1.5">
              <input
                required
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#8a9e60]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/30 flex gap-3">
        {step === 1 ? (
          <>
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl">CANCEL</button>
            <button 
              type="button" 
              onClick={() => selectedVendorId.trim() ? setStep(2) : toast.error("Enter Vendor ID")}
              className="flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg shadow-[#8a9e60]/20"
              style={{ backgroundColor: "#8a9e60" }}
            >
              NEXT: FIELD INFO
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl">BACK</button>
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg shadow-[#8a9e60]/20 disabled:opacity-50"
              style={{ backgroundColor: "#8a9e60" }}
            >
              {mutation.isPending ? "CREATING..." : "ONBOARD FIELD"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
