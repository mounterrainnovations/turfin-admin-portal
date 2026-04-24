"use client";

/**
 * LoadingSkeleton — reusable skeleton loader for the TurfIn admin panel.
 *
 * Variants:
 *   - "table"  : shimmer rows that match the table layout (thead + n rows)
 *   - "card"   : grid of shimmer stat cards
 *   - "list"   : vertical stack of shimmer list items
 *   - "detail" : sidebar / detail-panel shimmer
 *
 * Sizes:
 *   - "sm"  : compact (tighter spacing, fewer lines)
 *   - "md"  : standard (default)
 *   - "lg"  : spacious
 */

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

interface CardSkeletonProps {
  cards?: number;
}

interface ListSkeletonProps {
  rows?: number;
}

type SkeletonVariant = "table" | "card" | "list" | "detail";
type SkeletonSize = "sm" | "md" | "lg";

export interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  /** Number of shimmer rows/cards to render */
  count?: number;
  /** Number of columns (table variant only) */
  cols?: number;
  className?: string;
}

// ─── Shimmer base ─────────────────────────────────────────────────────────────

function ShimmerBar({ w = "full", h = "3", rounded = "md" }: { w?: string; h?: string; rounded?: string }) {
  return (
    <div
      className={`w-${w} h-${h} rounded-${rounded} bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]`}
    />
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6, cols = 6 }: TableSkeletonProps) {
  const colWidths = [
    "w-36", "w-24", "w-20", "w-16", "w-16", "w-14", "w-10",
  ];

  return (
    <div className="w-full overflow-hidden">
      {/* thead ghost */}
      <div className="border-b border-gray-100 bg-gray-50/60 flex items-center gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className={`${colWidths[i] ?? "w-16"} h-2 rounded-md bg-gray-200 flex-shrink-0`}
          />
        ))}
      </div>

      {/* tbody ghost rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4 py-3 border-b border-gray-50"
          style={{ animationDelay: `${rowIdx * 60}ms` }}
        >
          {/* Avatar + text cell */}
          <div className="flex items-center gap-3 w-36 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2.5 w-20 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
              <div className="h-2 w-14 rounded-md bg-gray-100" />
            </div>
          </div>

          {Array.from({ length: cols - 1 }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={`${colWidths[colIdx + 1] ?? "w-16"} flex-shrink-0 space-y-1.5`}
            >
              <div className="h-2.5 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
              {colIdx < 2 && (
                <div className="h-2 w-3/4 rounded-md bg-gray-100" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton({ cards = 4 }: CardSkeletonProps) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cards}, minmax(0, 1fr))` }}>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-2.5 w-24 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
            <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
          </div>
          <div className="h-7 w-16 rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] mb-2" />
          <div className="h-2 w-20 rounded-md bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ─── List skeleton ────────────────────────────────────────────────────────────

function ListSkeleton({ rows = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-0 divide-y divide-gray-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
            <div className="h-2 w-48 rounded-md bg-gray-100" />
          </div>
          <div className="h-5 w-14 rounded-full bg-gray-100 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Detail skeleton (sidebar panel) ─────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Header area */}
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-md bg-gray-200 animate-pulse" />
        <div className="h-5 w-40 rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
        <div className="h-2.5 w-28 rounded-md bg-gray-100" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 text-center space-y-1.5">
            <div className="h-5 w-10 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] mx-auto" />
            <div className="h-2 w-12 rounded-md bg-gray-100 mx-auto" />
          </div>
        ))}
      </div>

      {/* Section */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-2">
          <div className="h-2 w-20 rounded-md bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            {[1, 2].map((row) => (
              <div key={row} className="flex justify-between items-center">
                <div className="h-2.5 w-24 rounded-md bg-gray-100" />
                <div className="h-2.5 w-20 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inline spinner (small footprint for buttons / tabs) ─────────────────────

export function InlineSpinner({ size = 16, color = "#8a9e60" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ color }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Table row skeleton — for inline use inside <tbody> ───────────────────────

export function TableRowsSkeleton({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          className="border-b border-gray-50"
          style={{ animationDelay: `${rowIdx * 60}ms` }}
        >
          {/* Avatar cell */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-24 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
                <div className="h-2 w-16 rounded-md bg-gray-100" />
              </div>
            </div>
          </td>

          {/* Remaining cells */}
          {Array.from({ length: cols - 1 }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div className="space-y-1.5">
                <div
                  className="h-2.5 rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]"
                  style={{ width: colIdx % 2 === 0 ? "70%" : "50%" }}
                />
                {colIdx < 2 && (
                  <div className="h-2 w-1/2 rounded-md bg-gray-100" />
                )}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LoadingSkeleton({
  variant = "table",
  count,
  cols,
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {variant === "table" && (
        <TableSkeleton rows={count ?? 6} cols={cols ?? 6} />
      )}
      {variant === "card" && <CardSkeleton cards={count ?? 4} />}
      {variant === "list" && <ListSkeleton rows={count ?? 5} />}
      {variant === "detail" && <DetailSkeleton />}
    </div>
  );
}
