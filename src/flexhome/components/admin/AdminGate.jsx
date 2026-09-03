"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "./AdminShell";

export default function AdminGate({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // checking | ok | denied
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setName(data.name || "Admin");
        setStatus("ok");
      })
      .catch(() => {
        setStatus("denied");
        router.push("/admin/login");
      });
  }, [router]);

  if (status !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-100 text-sm text-navy-800/50">
        Checking session...
      </div>
    );
  }

  return <AdminShell adminName={name}>{children}</AdminShell>;
}
