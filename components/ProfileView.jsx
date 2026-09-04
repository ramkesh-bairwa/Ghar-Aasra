"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, GitCompare, CalendarClock, LogOut, Mail, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

const quickLinks = [
  { href: "/bookings", label: "My bookings", description: "Scheduled property viewings", icon: CalendarClock },
  { href: "/favorites", label: "My favorites", description: "Properties you've saved", icon: Heart },
  { href: "/compare", label: "My compares", description: "Listings you're comparing", icon: GitCompare },
];

export default function ProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (!user) return null;

  return (
    <section className="bg-sand-50 py-10">
      <div className="container-page grid gap-6 lg:grid-cols-[1fr,1.6fr]">
        <div className="card-surface p-6">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 font-display text-2xl text-teal-400">
                {user.name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
            <div>
              <h2 className="font-display text-xl text-navy-900">{user.name}</h2>
              <span className="badge-pill mt-1 inline-flex items-center gap-1 bg-teal-500/10 text-teal-700 capitalize">
                <ShieldCheck size={13} /> {user.role || "buyer"}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-navy-900/8 pt-5 text-sm">
            {user.email && (
              <p className="flex items-center gap-2 text-navy-800/70">
                <Mail size={15} /> {user.email}
              </p>
            )}
            {user.phone && (
              <p className="flex items-center gap-2 text-navy-800/70">
                <Phone size={15} /> {user.phone}
              </p>
            )}
            {user.memberSince && (
              <p className="text-navy-800/45">
                Member since {new Date(user.memberSince).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-coral-500/30 px-4 py-2.5 text-sm font-semibold text-coral-600 hover:bg-coral-500/10"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="card-surface flex flex-col gap-3 p-5 hover:ring-1 hover:ring-teal-500/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="font-display text-[17px] text-navy-900">{label}</h3>
                <p className="mt-1 text-sm text-navy-800/55">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
