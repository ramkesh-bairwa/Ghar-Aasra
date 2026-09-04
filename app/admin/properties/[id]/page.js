"use client";

import AdminGate from "@/components/admin/AdminGate";
import PropertyForm from "@/components/admin/PropertyForm";

export default function EditPropertyPage({ params }) {
  return (
    <AdminGate>
      <PropertyForm propertyId={params.id} />
    </AdminGate>
  );
}
