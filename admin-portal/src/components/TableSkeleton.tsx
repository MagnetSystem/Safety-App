export default function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
