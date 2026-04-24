import React, { useState } from "react";
import { Eye, X } from "@phosphor-icons/react";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface KycFileActionsProps {
  file?: File;
  url?: string;
  onView?: () => void;
  onRemove: () => void;
  showBadge?: boolean;
}

export const KycFileActions: React.FC<KycFileActionsProps> = ({
  file,
  url,
  onView,
  onRemove,
  showBadge = true,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView();
      return;
    }
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else if (url) {
      setPreviewUrl(url);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };
  return (
    <>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Selected
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {(file || url || onView) && (
            <button
              onClick={handleView}
              className="text-gray-600 hover:text-[#8a9e60] p-1.5 bg-white border border-gray-100 rounded-lg transition-colors shadow-sm"
              title="View Document"
            >
              <Eye size={14} weight="bold" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 rounded-lg transition-colors"
              title="Remove"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>
      {previewUrl ? (
        <DocumentPreviewModal
          title={file?.name || "Document Preview"}
          url={previewUrl}
          onClose={() => {
            if (previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
          }}
        />
      ) : null}
    </>
  );
};
