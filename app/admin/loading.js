import AdminSkeleton from "@/components/admin/AdminSkeleton";

// Admin routes have their own chrome (AdminShell renders inside each page),
// so they get a sidebar + table skeleton instead of the public site header.
export default function AdminLoading() {
  return <AdminSkeleton />;
}
