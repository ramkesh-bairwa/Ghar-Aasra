"use client";

// Search-as-you-type location field backed by the free OpenStreetMap
// Nominatim geocoder (via the /api/geocode proxy — see that route for why
// this isn't called directly from the browser). Debounce pattern mirrors
// AuthForm.jsx's useLiveCheck.

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (!value.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(suggestion) {
    skipNextFetch.current = true;
    setSuggestions([]);
    setOpen(false);
    onSelect(suggestion);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="flex items-center gap-2 rounded-xl border border-navy-900/10 px-4 py-3">
        <MapPin size={17} className="shrink-0 text-teal-600" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="w-full bg-transparent text-sm text-navy-900 placeholder:text-navy-800/40 focus:outline-none"
          autoComplete="off"
        />
        {loading && <Loader2 size={15} className="shrink-0 animate-spin text-navy-800/30" />}
      </label>

      {open && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-white p-1.5 shadow-card ring-1 ring-navy-900/5">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-navy-800 hover:bg-sand-100"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-navy-800/40" />
                <span>{s.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
