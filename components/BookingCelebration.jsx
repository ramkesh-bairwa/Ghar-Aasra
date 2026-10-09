"use client";

import { useMemo, useState } from "react";
import { Check, Copy, PartyPopper, Hourglass, PhoneCall, CalendarCheck } from "lucide-react";

const CONFETTI_COLORS = ["var(--color-teal-400)", "var(--color-teal-500)", "var(--color-coral-500)", "#f5b942", "#ffffff", "#7dd3fc", "#f9a8d4"];

// Deterministic "random" so every piece keeps its place across re-renders.
function rand(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: rand(i, 1) * 100,
        size: 6 + rand(i, 2) * 6,
        round: rand(i, 3) > 0.7,
        color: CONFETTI_COLORS[Math.floor(rand(i, 4) * CONFETTI_COLORS.length)],
        delay: rand(i, 5) * 0.9,
        duration: 2.4 + rand(i, 6) * 1.8,
        drift: (rand(i, 7) - 0.5) * 160,
        spin: 360 + rand(i, 8) * 720,
      })),
    []
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block opacity-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? "9999px" : "2px",
            background: p.color,
            "--drift": `${p.drift}px`,
            "--spin": `${p.spin}deg`,
            animation: `confetti-fall ${p.duration}s cubic-bezier(.2,.6,.4,1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// Curly streamers hanging from the hero's top corners.
function Streamers() {
  const paths = [
    { d: "M-10 10 C 40 30, 20 70, 70 80 S 110 140, 150 130", color: "var(--color-teal-400)", delay: 0.1 },
    { d: "M-10 40 C 30 60, 10 100, 55 115 S 80 170, 120 175", color: "var(--color-coral-500)", delay: 0.3 },
    { d: "M20 -10 C 50 30, 90 20, 100 60 S 150 90, 190 70", color: "#f5b942", delay: 0.5 },
  ];
  const side = (flip) => (
    <svg aria-hidden viewBox="0 0 200 200" className={`pointer-events-none absolute top-0 h-40 w-40 md:h-48 md:w-48 ${flip ? "right-0 -scale-x-100" : "left-0"}`} fill="none">
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="420"
          strokeDashoffset="420"
          style={{ animation: `ribbon-draw 1.1s ease-out ${p.delay}s forwards` }}
          opacity="0.9"
        />
      ))}
    </svg>
  );
  return (
    <>
      {side(false)}
      {side(true)}
    </>
  );
}

// Folded-end ribbon banner across the hero ("Booking confirmed").
function RibbonBanner({ children }) {
  return (
    <div className="relative mx-auto mt-5 w-fit" style={{ animation: "ribbon-unfurl .6s cubic-bezier(.2,.9,.3,1.2) .35s both" }}>
      <span aria-hidden className="absolute -left-5 top-2 h-full w-8 bg-teal-600" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 35% 50%)" }} />
      <span aria-hidden className="absolute -right-5 top-2 h-full w-8 bg-teal-600" style={{ clipPath: "polygon(0 0, 100% 0, 65% 50%, 100% 100%, 0 100%)" }} />
      <span aria-hidden className="absolute -left-1.5 top-full h-2 w-2 bg-navy-950" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }} />
      <span aria-hidden className="absolute -right-1.5 top-full h-2 w-2 bg-navy-950" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <span className="relative flex items-center gap-2 bg-teal-500 px-6 py-2 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-card">
        {children}
      </span>
    </div>
  );
}

function BookingIdTicket({ code, hint }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code is on screen to copy by hand */
    }
  }
  return (
    <div className="relative mx-6 -mt-7 rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-900/8">
      {/* ticket notches */}
      <span aria-hidden className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-sand-100 ring-1 ring-navy-900/8" />
      <span aria-hidden className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-sand-100 ring-1 ring-navy-900/8" />
      <div className="flex items-center gap-3 border-b border-dashed border-navy-900/15 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-navy-800/45">Your booking ID</div>
          <div className="mt-0.5 font-mono text-2xl font-bold tracking-[0.12em] text-navy-900">{code}</div>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
            copied ? "bg-teal-500 text-white" : "bg-sand-100 text-navy-900 hover:bg-teal-500/10"
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="pt-3 text-xs leading-relaxed text-navy-800/55">{hint}</p>
    </div>
  );
}

// "Please wait for confirmation" card: the booking is saved but the team
// still has to confirm the slot, so say so plainly and show what's next.
function PendingConfirmation({ when, eta, signedIn }) {
  const steps = [
    { Icon: Check, title: "Booking received", text: "Your slot is reserved for you.", state: "done" },
    { Icon: PhoneCall, title: "Waiting for confirmation", text: `Our team will call or WhatsApp you ${eta} to confirm.`, state: "current" },
    { Icon: CalendarCheck, title: "Visit day", text: when || "We'll see you at the property.", state: "next" },
  ];
  return (
    <div className="mx-6 mt-5 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-500/25">
      <div className="flex items-start gap-3">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/50" />
          <Hourglass size={18} className="relative" />
        </span>
        <div>
          <div className="text-sm font-bold text-navy-900">Please wait for confirmation</div>
          <p className="mt-0.5 text-xs leading-relaxed text-navy-800/65">
            Your visit is booked but not confirmed yet. Please don&apos;t travel to the property until we confirm your slot.
          </p>
        </div>
      </div>
      <ol className="mt-4 space-y-3 border-t border-amber-500/20 pt-4">
        {steps.map(({ Icon, title, text, state }, i) => (
          <li key={title} className="relative flex gap-3">
            {i < steps.length - 1 && <span aria-hidden className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-amber-500/30" />}
            <span
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                state === "done" ? "bg-teal-500 text-white" : state === "current" ? "bg-amber-500 text-white" : "bg-white text-navy-800/40 ring-1 ring-navy-900/10"
              }`}
            >
              <Icon size={15} />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className={`text-sm font-semibold ${state === "next" ? "text-navy-800/50" : "text-navy-900"}`}>
                {title}
                {state === "current" && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending</span>}
              </div>
              <div className="text-xs text-navy-800/55">{text}</div>
            </div>
          </li>
        ))}
      </ol>
      {signedIn && (
        <p className="mt-4 text-xs text-navy-800/55">
          You can check the status anytime under <strong className="text-navy-900">My Visits</strong>.
        </p>
      )}
    </div>
  );
}

// The celebratory success screen after booking a visit / sending a visit
// request: confetti, streamers, a ribbon banner and the booking ID as a ticket.
// `pending` adds the "please wait for confirmation" card.
export default function BookingCelebration({ name, ribbon, title, subtitle, bookingCode, pending, children }) {
  const firstName = String(name || "").trim().split(/\s+/)[0];
  return (
    <div className="mx-auto max-w-lg">
      <div className="relative overflow-hidden rounded-[1.8rem] bg-sand-100 shadow-card ring-1 ring-navy-900/5">
        <Confetti />
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 px-8 pb-14 pt-10 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,172,0.35),transparent_60%)]" />
          <Streamers />
          <span
            className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 text-white shadow-[0_0_0_10px_rgba(20,184,172,0.18)]"
            style={{ animation: "celebrate-pop .7s cubic-bezier(.2,.9,.3,1.3) both" }}
          >
            <PartyPopper size={36} />
          </span>
          <RibbonBanner>{ribbon}</RibbonBanner>
          <h2 className="relative mt-6 font-display text-3xl">{firstName ? `Thank you, ${firstName}!` : "Thank you!"}</h2>
          <p className="relative mx-auto mt-1 font-display text-lg text-teal-300">{title}</p>
          {subtitle && <p className="relative mx-auto mt-2 max-w-sm text-sm text-white/65">{subtitle}</p>}
        </div>

        {bookingCode && (
          <BookingIdTicket
            code={bookingCode}
            hint="Keep this handy. Quote it when you call or message us, and our team and the seller can pull up your booking instantly."
          />
        )}

        {pending && <PendingConfirmation {...pending} />}

        <div className="relative space-y-3 p-6">{children}</div>
      </div>
    </div>
  );
}
