"use client";

import { ArrowSquareOut, DownloadSimple, FileText, Image, X } from "@phosphor-icons/react";
import { isPreviewableImageUrl } from "../document-url";

interface DocumentPreviewModalProps {
  title: string;
  url: string;
  onClose: () => void;
}

export function DocumentPreviewModal({
  title,
  url,
  onClose,
}: DocumentPreviewModalProps) {
  const isImage = isPreviewableImageUrl(url);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(17,24,39,0.72)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="w-full max-w-5xl h-[88vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a9e60]">
              Document Preview
            </p>
            <h3 className="text-sm font-bold text-gray-900 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <ArrowSquareOut size={14} />
              Open Tab
            </a>
            <a
              href={url}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <DownloadSimple size={14} />
              Download
            </a>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#f7f8f4]">
          {isImage ? (
            <div className="h-full overflow-auto p-6">
              <div className="min-h-full rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-center">
                <img
                  src={url}
                  alt={title}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
            </div>
          ) : (
            <iframe
              title={title}
              src={url}
              className="h-full w-full"
            />
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-white text-[11px] text-gray-500 flex items-center gap-2 shrink-0">
          {isImage ? <Image size={14} /> : <FileText size={14} />}
          <span className="truncate">
            {isImage
              ? "Image preview loaded inside the review flow."
              : "PDF or document preview loaded inside the review flow."}
          </span>
        </div>
      </div>
    </div>
  );
}
