"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface Props {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  label?: string;
}

export function DashboardPagination({ page, total, limit, onPageChange, label = "items" }: Props) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 0) return null;

  // If no items, totalPages is 0, so totalPages <= 1 is true.
  // But we want to show it even if there's only 1 page to show "Showing 1-X of Y" if user wants?
  // User said "I can see page number one but I can't see page number two".
  // Let's always show the count part, and only show navigation if totalPages > 1.

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (page >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const pages = getVisiblePages();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-[11px] text-gray-400">
        Showing <span className="font-medium text-gray-600">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to{" "}
        <span className="font-medium text-gray-600">{Math.min(page * limit, total)}</span> of{" "}
        <span className="font-medium text-gray-600">{total}</span> {label}
      </p>
      
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <CaretLeft size={14} />
          </button>

          {pages.map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === "number" && onPageChange(p)}
              disabled={typeof p !== "number"}
              className={`w-8 h-8 text-xs rounded-lg font-medium transition-all ${
                p === page
                  ? "bg-[#8a9e60] text-white shadow-sm"
                  : typeof p === "number"
                  ? "text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                  : "text-gray-300 cursor-default"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <CaretRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
