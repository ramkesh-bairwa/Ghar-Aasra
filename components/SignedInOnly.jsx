"use client";

import { useAuth } from "@/lib/useAuth";

// Renders children only for signed-in visitors; signed-out visitors see nothing.
export default function SignedInOnly({ children }) {
  const { user } = useAuth();
  return user ? children : null;
}
