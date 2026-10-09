"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Lock } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { site_title, icon_url } = useSiteSettings();
  const [email, setEmail] = useState("admin@flexhome.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      setError(data.error || "Login failed.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2">
          {icon_url ? (
            <img src={icon_url} alt="" className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-navy-950">
              <Home size={18} strokeWidth={2.4} />
            </span>
          )}
          <span className="font-display text-xl text-white">{site_title}</span>
        </div>
        <p className="mt-1 text-center text-xs text-white/40">Admin panel</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3 rounded-xl2 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 text-navy-900">
            <Lock size={16} className="text-teal-600" />
            <h1 className="font-display text-lg">Sign in</h1>
          </div>

          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />

          {error && <p className="text-xs text-coral-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="pt-2 text-center text-xs text-navy-800/45">
            Demo credentials: admin@flexhome.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
