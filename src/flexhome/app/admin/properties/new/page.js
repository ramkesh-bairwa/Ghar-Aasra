"use client";

import AdminGate from "@/components/admin/AdminGate";
import PropertyForm from "@/components/admin/PropertyForm";

export default function NewPropertyPage() {
  return (
    <AdminGate>
      <PropertyForm propertyId={null} />
    </AdminGate>
  );
}
