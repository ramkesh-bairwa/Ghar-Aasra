"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import AdminShell from "./AdminShell";
import AdminSkeleton from "./AdminSkeleton";
import { getCachedAdmin, setCachedAdmin } from "./adminSessionCache";

function sectionForPathname(pathname) {
  if (pathname === "/admin") return "dashboard";
  const seg = pathname.split("/")[2]; // "/admin/<section>/..."
  return seg || "dashboard";
}

export default function AdminGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState(getCachedAdmin);

  // Shows the last known session instantly, then re-checks it on every page.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setCachedAdmin(data);
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        setCachedAdmin(null);
        if (!cancelled) router.push("/admin/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!me) return <AdminSkeleton />;

  const sections = me.sections; // null = every section
  const allowed = sections === null || sections.includes(sectionForPathname(pathname));

  return (
    <AdminShell adminName={me.name} adminEmail={me.email} adminRole={me.adminRole} sections={sections}>
      {allowed ? children : (
        <div className="flex flex-col items-center justify-center rounded-xl2 border border-navy-900/10 bg-white px-6 py-16 text-center">
          <ShieldAlert size={28} className="mb-3 text-navy-800/30" />
          <p className="font-medium text-navy-900">You don&apos;t have access to this section.</p>
          <p className="mt-1 text-sm text-navy-800/50">Ask an admin if you need this unlocked.</p>
        </div>
      )}
    </AdminShell>
  );
}
