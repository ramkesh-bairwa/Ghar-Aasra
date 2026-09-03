"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Phone, ArrowRight, CheckCircle2, XCircle, Loader2, ShieldCheck, MailCheck } from "lucide-react";

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

export default function AuthForm({ mode = "login" }) {
  const isRegister = mode === "register";
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") ? next : "/";
  const [method, setMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
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

  function resetChannelState() {
    setError("");
    setOtpStage(false);
    setDevCode("");
    setDevCodeVisible(false);
    setOtpInput("");
    setDevLink("");
    clearTimeout(hideTimer.current);
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
      if (data.authenticated) return window.location.assign(destination);
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
      window.location.assign(destination);
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
      window.location.assign(destination);
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

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-sand-100 px-5 py-12">
      <section className="w-full max-w-md rounded-xl2 bg-white p-7 shadow-card ring-1 ring-navy-900/5 sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">Flex Home account</p>
        <h1 className="mt-3 font-display text-3xl text-navy-900">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-navy-800/60">
          {method === "phone"
            ? "We'll text you a one-time code — no password needed."
            : `Use one contact method to ${isRegister ? "get started" : "sign in"}.`}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-sand-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMethod("email");
              setIdentifier("");
              resetChannelState();
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${method === "email" ? "bg-white text-navy-900 shadow-soft" : "text-navy-800/55"}`}
          >
            <Mail size={15} /> Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("phone");
              setIdentifier("");
              resetChannelState();
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${method === "phone" ? "bg-white text-navy-900 shadow-soft" : "text-navy-800/55"}`}
          >
            <Phone size={15} /> Phone
          </button>
        </div>

        {devLink ? (
          <div className="mt-6 rounded-xl border border-teal-500/30 bg-teal-500/10 p-5 text-center">
            <MailCheck className="mx-auto text-teal-600" size={28} />
            <p className="mt-3 text-sm font-semibold text-navy-900">Verification required</p>
            <p className="mt-1 text-xs text-navy-800/60">
              No email provider is set up yet, so here's the link that would have been emailed to you — testing mode only.
            </p>
            <a href={devLink} className="btn-primary mt-4 inline-flex w-full justify-center">
              Open verification link
              <ArrowRight size={16} />
            </a>
          </div>
        ) : method === "phone" && otpStage ? (
          <div className="mt-6">
            {devCodeVisible && (
              <div className="mb-4 rounded-xl border-2 border-dashed border-teal-500 bg-teal-500/10 px-4 py-3 text-center">
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
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-center font-display text-2xl tracking-[0.4em] outline-none focus:border-teal-500"
                  placeholder="------"
                />
              </label>
              <button disabled={submitting || otpInput.length !== 6} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? "Verifying…" : "Verify & continue"}
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between text-xs">
              <button onClick={requestOtp} className="font-semibold text-teal-600 hover:text-teal-700">
                Resend code
              </button>
              <button
                onClick={() => {
                  setOtpStage(false);
                  setOtpInput("");
                  setError("");
                }}
                className="text-navy-800/50 hover:text-navy-800"
              >
                Use a different number
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={method === "phone" ? requestOtp : submitEmail} className="mt-6 space-y-4">
            {isRegister && (
              <label className="block text-sm font-semibold text-navy-900">
                Full name
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 font-normal outline-none focus:border-teal-500"
                  placeholder="Your name"
                />
              </label>
            )}

            <label className="block text-sm font-semibold text-navy-900">
              {method === "email" ? "Email address" : "Phone number"}
              <div className="relative mt-1.5">
                <input
                  name="identifier"
                  required
                  type={method === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 pr-10 font-normal outline-none focus:border-teal-500 ${
                    check.valid === false ? "border-coral-500/50" : check.valid === true ? "border-teal-500/50" : "border-navy-900/10"
                  }`}
                  placeholder={method === "email" ? "you@example.com" : "+1 555 000 0000"}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {check.checking && <Loader2 size={16} className="animate-spin text-navy-800/30" />}
                  {!check.checking && check.valid === true && <CheckCircle2 size={16} className="text-teal-600" />}
                  {!check.checking && check.valid === false && <XCircle size={16} className="text-coral-600" />}
                </span>
              </div>
              {checkMessage && <span className="mt-1.5 block text-xs font-normal text-coral-600">{checkMessage}</span>}
            </label>

            {method === "email" && (
              <label className="block text-sm font-semibold text-navy-900">
                Password
                <input
                  name="password"
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 font-normal outline-none focus:border-teal-500"
                  placeholder="At least 6 characters"
                />
              </label>
            )}

            <button
              disabled={submitting || check.valid === false}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Please wait…" : method === "phone" ? "Send code" : isRegister ? "Create account" : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {error && <p className="mt-4 rounded-lg bg-coral-500/10 px-3 py-2 text-sm text-coral-600">{error}</p>}

        <p className="mt-6 text-center text-sm text-navy-800/60">
          {isRegister ? "Already have an account?" : "New to Flex Home?"}{" "}
          <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-teal-600 hover:text-teal-700">
            {isRegister ? "Sign in" : "Register"}
          </Link>
        </p>
      </section>
    </main>
  );
}
