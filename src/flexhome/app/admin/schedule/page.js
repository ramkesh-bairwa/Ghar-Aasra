"use client";

import AdminGate from "@/components/admin/AdminGate";
import ResourceManager from "@/components/admin/ResourceManager";
import { resources } from "@/lib/adminResources";

export default function Page() {
  return (
    <AdminGate>
      <ResourceManager resource="visit_requests" config={resources.visit_requests} />
    </AdminGate>
  );
}
