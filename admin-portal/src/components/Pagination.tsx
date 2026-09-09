import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border border-border bg-card/60 rounded-xl px-4 py-3 backdrop-blur-xl">
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
