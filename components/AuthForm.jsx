"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mail, Phone, ArrowRight, CheckCircle2, XCircle, Loader2, ShieldCheck, MailCheck, User, Lock,
  Eye, EyeOff, Home, Heart, CalendarCheck, Bell, Building2, Search, Star, Sparkles,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const CHECK_MESSAGES = {
  format: { email: "Enter a valid email address.", phone: "Enter a valid phone number." },
  taken: "An account already exists with this — try signing in instead.",
  not_found: "No account found — check it or register instead.",
};

// Debounced format + existence check against /api/auth/check, shared by
// both the email and phone inputs so typing gets live feedback instead of
// waiting for a full submit round trip.
function useLiveCheck(identifier, method, mode) {
  const [status, setStatus] = useState({ checking: false, valid: null, reason: null });

  useEffect(() => {
    if (!identifier.trim()) {
      setStatus({ checking: false, valid: null, reason: null });
      return;
    }
    setStatus((s) => ({ ...s, checking: true }));
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check?identifier=${encodeURIComponent(identifier)}&mode=${mode}`);
        const data = await res.json();
        setStatus({ checking: false, valid: data.valid, reason: data.reason || null });
      } catch {
        setStatus({ checking: false, valid: null, reason: null });
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [identifier, method, mode]);

  return status;
}

function InputShell({ icon: Icon, invalid, valid, children, trailing }) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl bg-sand-50 px-4 ring-1 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500 ${
        invalid ? "ring-coral-500/60" : valid ? "ring-teal-500/50" : "ring-navy-900/10"
      }`}
    >
      <Icon size={17} className="shrink-0 text-navy-800/35 transition-colors group-focus-within:text-teal-600" />
      {children}
      {trailing}
    </div>
  );
}

const inputBase = "w-full bg-transparent py-3.5 text-[15px] text-navy-900 placeholder:text-navy-800/35 focus:outline-none";

// The sign-in / sign-up form itself — used full-page (/login, /register)
// and inside the quick-login popup. `onSuccess(destination)` decides what
// happens after a session is created.
export function AuthPanel({ mode: initialMode = "login", onSuccess, inModal = false, next = null }) {
  const [mode, setMode] = useState(initialMode);
  const isRegister = mode === "register";
  const [method, setMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [intent, setIntent] = useState("buy");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Phone/OTP flow
  const [otpStage, setOtpStage] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devCodeVisible, setDevCodeVisible] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const hideTimer = useRef(null);

  // Email/verification-link flow
  const [devLink, setDevLink] = useState("");

  const check = useLiveCheck(identifier, method, mode);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Sellers land on their dashboard after signing up, unless a page sent them here.
  const destination = next || (isRegister && intent === "sell" ? "/vendor" : "/");
  const finish = () => onSuccess(destination);

  function resetChannelState() {
    setError("");
    setOtpStage(false);
    setDevCode("");
    setDevCodeVisible(false);
    setOtpInput("");
    setDevLink("");
    clearTimeout(hideTimer.current);
  }

  function switchMethod(m) {
    setMethod(m);
    setIdentifier("");
    resetChannelState();
  }

  function revealCodeFor5Seconds(code) {
    setDevCode(code);
    setDevCodeVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setDevCodeVisible(false), 5000);
  }

  async function requestOtp(event) {
    event.preventDefault();
    setError("");
    if (check.valid === false) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", mode, identifier, name }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Please try again.");
      if (data.authenticated) return finish();
      if (data.otpRequired) {
        setOtpStage(true);
        setOtpInput("");
        revealCodeFor5Seconds(data.devCode);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", mode, identifier, code: otpInput }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Please try again.");
      finish();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEmail(event) {
    event.preventDefault();
    setError("");
    if (check.valid === false) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, name, identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Please try again.");
      if (data.verificationRequired) return setDevLink(data.devLink);
      finish();
    } finally {
      setSubmitting(false);
    }
  }

  const checkMessage =
    check.valid === false
      ? typeof CHECK_MESSAGES[check.reason] === "object"
        ? CHECK_MESSAGES[check.reason][method]
        : CHECK_MESSAGES[check.reason]
      : null;

  const switchHref = `${isRegister ? "/login" : "/register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div>
      <h1 className={`font-display text-navy-900 ${inModal ? "text-2xl" : "text-3xl md:text-4xl"}`}>
        {isRegister ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-navy-800/60">
        {isRegister ? "Free forever. Save homes, book visits and list your own property." : "Sign in to pick up where you left off."}
      </p>

      {isRegister && !devLink && !otpStage && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { key: "buy", Icon: Search, title: "Find a home", text: "Buy or rent" },
            { key: "sell", Icon: Building2, title: "List a property", text: "Sell or rent out" },
          ].map(({ key, Icon, title, text }) => (
            <button
              key={key}
              type="button"
              onClick={() => setIntent(key)}
              className={`relative flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all ${
                intent === key
                  ? "bg-navy-900 text-white shadow-card"
                  : "bg-sand-50 text-navy-900 ring-1 ring-navy-900/10 hover:ring-teal-500/50"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${intent === key ? "bg-teal-500 text-white" : "bg-white text-teal-600 ring-1 ring-navy-900/5"}`}>
                <Icon size={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className={`block text-xs ${intent === key ? "text-white/60" : "text-navy-800/50"}`}>{text}</span>
              </span>
              {intent === key && <CheckCircle2 size={17} className="absolute right-3 top-3 text-teal-400" />}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-sand-100 p-1">
        {[
          { key: "email", Icon: Mail, label: "Email" },
          { key: "phone", Icon: Phone, label: "Phone (OTP)" },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchMethod(key)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
              method === key ? "bg-white text-navy-900 shadow-soft" : "text-navy-800/55 hover:text-navy-900"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {devLink ? (
        <div className="mt-6 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-5 text-center">
          <MailCheck className="mx-auto text-teal-600" size={28} />
          <p className="mt-3 text-sm font-semibold text-navy-900">Verification required</p>
          <p className="mt-1 text-xs text-navy-800/60">
            No email provider is set up yet, so here&apos;s the link that would have been emailed to you — testing mode only.
          </p>
          <a href={devLink} className="btn-primary mt-4 inline-flex w-full justify-center">
            Open verification link
            <ArrowRight size={16} />
          </a>
        </div>
      ) : method === "phone" && otpStage ? (
        <div className="mt-6">
          {devCodeVisible && (
            <div className="mb-4 rounded-2xl border-2 border-dashed border-teal-500 bg-teal-500/10 px-4 py-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-teal-700">
                <ShieldCheck size={13} /> Testing mode — this is what the SMS would contain
              </p>
              <p className="mt-1 font-display text-3xl tracking-[0.35em] text-navy-900">{devCode}</p>
              <p className="mt-1 text-[11px] text-navy-800/45">Disappears in 5 seconds — type it below</p>
            </div>
          )}
          <form onSubmit={verifyOtp} className="space-y-4">
            <label className="block text-sm font-semibold text-navy-900">
              Enter the 6-digit code sent to {identifier}
              <input
                autoFocus
                inputMode="numeric"
                maxLength={6}
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                className="mt-2 w-full rounded-2xl bg-sand-50 px-4 py-4 text-center font-display text-3xl tracking-[0.5em] text-navy-900 ring-1 ring-navy-900/10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="······"
              />
            </label>
            <button disabled={submitting || otpInput.length !== 6} className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? "Verifying…" : "Verify & continue"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
          <div className="mt-4 flex items-center justify-between text-xs">
            <button onClick={requestOtp} className="font-semibold text-teal-600 hover:text-teal-700">Resend code</button>
            <button
              onClick={() => { setOtpStage(false); setOtpInput(""); setError(""); }}
              className="text-navy-800/50 hover:text-navy-800"
            >
              Use a different number
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={method === "phone" ? requestOtp : submitEmail} className="mt-5 space-y-3.5">
          {isRegister && (
            <InputShell icon={User}>
              <input
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
                placeholder="Full name"
                aria-label="Full name"
              />
            </InputShell>
          )}

          <div>
            <InputShell
              icon={method === "email" ? Mail : Phone}
              invalid={check.valid === false}
              valid={check.valid === true}
              trailing={
                <span className="shrink-0">
                  {check.checking && <Loader2 size={16} className="animate-spin text-navy-800/30" />}
                  {!check.checking && check.valid === true && <CheckCircle2 size={16} className="text-teal-600" />}
                  {!check.checking && check.valid === false && <XCircle size={16} className="text-coral-600" />}
                </span>
              }
            >
              <input
                name="identifier"
                required
                autoComplete={method === "email" ? "email" : "tel"}
                type={method === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputBase}
                placeholder={method === "email" ? "Email address" : "Phone number, e.g. +1 555 000 0000"}
                aria-label={method === "email" ? "Email address" : "Phone number"}
              />
            </InputShell>
            {checkMessage && <span className="mt-1.5 block px-1 text-xs text-coral-600">{checkMessage}</span>}
          </div>

          {method === "email" && (
            <InputShell
              icon={Lock}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-navy-800/40 hover:text-navy-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            >
              <input
                name="password"
                required
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputBase}
                placeholder={isRegister ? "Create a password (6+ characters)" : "Password"}
                aria-label="Password"
              />
            </InputShell>
          )}

          {method === "phone" && (
            <p className="flex items-center gap-1.5 px-1 text-xs text-navy-800/55">
              <ShieldCheck size={13} className="text-teal-600" /> We&apos;ll text you a one-time code. No password needed.
            </p>
          )}

          <button
            disabled={submitting || check.valid === false}
            className="btn-primary w-full py-3.5 text-[15px] shadow-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Please wait…" : method === "phone" ? "Send code" : isRegister ? "Create free account" : "Sign in"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>
      )}

      {error && <p className="mt-4 rounded-xl bg-coral-500/10 px-3 py-2.5 text-sm text-coral-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-navy-800/60">
        {isRegister ? "Already have an account?" : "New here?"}{" "}
        {inModal ? (
          <button
            type="button"
            onClick={() => { setMode(isRegister ? "login" : "register"); resetChannelState(); }}
            className="font-semibold text-teal-600 hover:text-teal-700"
          >
            {isRegister ? "Sign in" : "Create a free account"}
          </button>
        ) : (
          <Link href={switchHref} className="font-semibold text-teal-600 hover:text-teal-700">
            {isRegister ? "Sign in" : "Create a free account"}
          </Link>
        )}
      </p>
      {isRegister && (
        <p className="mt-3 text-center text-[11px] text-navy-800/45">
          By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
      )}
    </div>
  );
}

const BENEFITS = [
  { Icon: Heart, title: "Save homes you love", text: "Build a shortlist and compare side by side." },
  { Icon: CalendarCheck, title: "Book free visits", text: "In person or on a video call, in two taps." },
  { Icon: Bell, title: "Never miss a deal", text: "Get alerted when prices drop." },
  { Icon: Building2, title: "List your property free", text: "Track views and leads from your dashboard." },
];

// Full-page /login and /register: brand panel on the left, form on the right.
export default function AuthForm({ mode = "login" }) {
  const { site_title, logo_dark_url, icon_url } = useSiteSettings();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : null;

  return (
    <main className="grid min-h-[calc(100vh-76px)] bg-sand-50 lg:grid-cols-[1.05fr,1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/80 to-navy-900/40" />
        <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-teal-500/25 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-2 text-white">
            {logo_dark_url ? (
              <img src={logo_dark_url} alt={site_title} className="h-16 w-auto max-w-[300px] object-contain" />
            ) : (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Home size={19} />
                </span>
                <span className="font-display text-xl">{site_title}</span>
              </>
            )}
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 ring-1 ring-white/15 backdrop-blur">
              <Sparkles size={12} /> One account, everything property
            </span>
            <h2 className="mt-5 max-w-md font-display text-4xl leading-tight text-white xl:text-5xl">
              Your next home is a few taps away.
            </h2>
            <div className="mt-8 grid max-w-lg gap-3">
              {BENEFITS.map(({ Icon, title, text }) => (
                <div key={title} className="flex items-center gap-4 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/10 backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{title}</span>
                    <span className="block text-xs text-white/60">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <figure className="max-w-md rounded-2xl bg-white/95 p-5 shadow-card">
            <div className="flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <blockquote className="mt-2 text-sm text-navy-800/80">
              &ldquo;Booked three visits in one evening and moved in a month later. The easiest home search we&apos;ve had.&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs font-semibold text-navy-900">{`A happy ${site_title} buyer`}</figcaption>
          </figure>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-navy-900 p-4 text-white lg:hidden">
            {icon_url ? (
              <img src={icon_url} alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500">
                <Home size={18} />
              </span>
            )}
            <span className="text-sm">Save homes, book free visits and list your property, all with one account.</span>
          </div>
          <div className="rounded-[1.6rem] bg-white p-7 shadow-card ring-1 ring-navy-900/5 sm:p-9">
            <AuthPanel mode={mode} next={next} onSuccess={(dest) => window.location.assign(dest)} />
          </div>
        </div>
      </section>
    </main>
  );
}
