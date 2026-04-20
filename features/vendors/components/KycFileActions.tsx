import React from "react";
import { Eye, X } from "@phosphor-icons/react";

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
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView();
      return;
    }
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      window.open(previewUrl, "_blank");
    } else if (url) {
      // In a real app, this might fetch a signed URL or open the image directly
      window.open(url, "_blank");
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };
  return (
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
  );
};
