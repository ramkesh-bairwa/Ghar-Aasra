export default function Loading() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center bg-sand-50" role="status" aria-label="Loading">
      <div className="flex items-center gap-3 text-sm font-semibold text-navy-800/65">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        Loading Flex Home
      </div>
    </div>
  );
}