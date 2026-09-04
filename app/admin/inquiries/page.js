"use client";

import AdminGate from "@/components/admin/AdminGate";
import ResourceManager from "@/components/admin/ResourceManager";
import { resources } from "@/lib/adminResources";

export default function Page() {
  return (
    <AdminGate>
      <ResourceManager resource="inquiries" config={resources.inquiries} />
    </AdminGate>
  );
}
