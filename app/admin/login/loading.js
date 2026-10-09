// The login screen has no sidebar, so don't flash the admin-panel skeleton.
export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4" role="status" aria-label="Loading">
      <div className="w-full max-w-sm">
        <div className="h-9 w-36 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-8 space-y-3 rounded-xl2 bg-white p-6 shadow-card">
          <div className="skeleton h-11" />
          <div className="skeleton h-11" />
          <div className="skeleton h-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
