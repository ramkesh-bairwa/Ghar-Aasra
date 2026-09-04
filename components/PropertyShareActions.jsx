"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart, GitCompare, Facebook, Twitter, Linkedin, MessageCircle, Link2, Check } from "lucide-react";
import { useUserLists } from "@/lib/userLists";
import { useAuth } from "@/lib/useAuth";

const iconBtn = "flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-navy-800 transition-colors hover:bg-sand-200";

export default function PropertyShareActions({ slug, title }) {
  const { isFavorite, toggleFavorite, isComparing, toggleCompare, compare, compareLimit } = useUserLists();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const favorited = isFavorite(slug);
  const comparing = isComparing(slug);
  const compareDisabled = !comparing && compare.length >= compareLimit;

  // Same login-gate pattern as PropertyCard's heart/compare buttons.
  function requireLogin() {
    if (loading || user) return false;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return true;
  }

  function share(platform) {
    const url = window.location.href;
    const text = encodeURIComponent(title);
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=520");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently no-op.
    }
  }

  return (
    <div className="card-surface mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (requireLogin()) return;
            toggleFavorite(slug);
          }}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
            favorited ? "bg-coral-600 text-white" : "bg-sand-100 text-navy-800 hover:bg-sand-200"
          }`}
        >
          <Heart size={16} fill={favorited ? "currentColor" : "none"} /> {favorited ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          disabled={compareDisabled}
          title={compareDisabled ? `You can compare up to ${compareLimit} properties` : undefined}
          onClick={() => {
            if (requireLogin()) return;
            toggleCompare(slug);
            // If already in compare list, scroll down to the inline compare section
            if (!comparing) {
              setTimeout(() => {
                document.getElementById("inline-compare")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }
          }}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            comparing ? "bg-teal-500 text-white" : "bg-sand-100 text-navy-800 hover:bg-sand-200"
          }`}
        >
          <GitCompare size={16} /> {comparing ? "Comparing ↓" : "Compare"}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-0.5 hidden text-xs text-navy-800/45 sm:inline">Share:</span>
        <button type="button" onClick={() => share("facebook")} aria-label="Share on Facebook" className={iconBtn}>
          <Facebook size={16} />
        </button>
        <button type="button" onClick={() => share("twitter")} aria-label="Share on X" className={iconBtn}>
          <Twitter size={16} />
        </button>
        <button type="button" onClick={() => share("whatsapp")} aria-label="Share on WhatsApp" className={iconBtn}>
          <MessageCircle size={16} />
        </button>
        <button type="button" onClick={() => share("linkedin")} aria-label="Share on LinkedIn" className={iconBtn}>
          <Linkedin size={16} />
        </button>
        <button type="button" onClick={copyLink} aria-label="Copy link" className={iconBtn}>
          {copied ? <Check size={16} className="text-teal-600" /> : <Link2 size={16} />}
        </button>
      </div>
    </div>
  );
}
