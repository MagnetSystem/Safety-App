export default function QueryError({ message, retry }: { message: string; retry: () => unknown }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    <span>{message}</span>
    <button type="button" onClick={() => void retry()} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 font-medium hover:bg-red-100">Try again</button>
  </div>;
}
