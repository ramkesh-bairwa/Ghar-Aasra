"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calculator, CalendarCheck, Wallet, Percent, CalendarClock, Receipt, PiggyBank, TrendingDown,
  HandCoins, ChevronDown, Home, Info,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const TENURE_PRESETS = [10, 15, 20, 25, 30];
const DOWN_PRESETS = [10, 20, 30, 50];

function money(symbol, n) {
  return `${symbol}${Math.round(n).toLocaleString("en-US")}`;
}

function Slider({ icon: Icon, label, value, display, min, max, step, onChange, children }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 text-navy-800/65">
          <Icon size={15} className="text-teal-600" /> {label}
        </span>
        <span className="rounded-lg bg-sand-100 px-2.5 py-1 font-semibold text-navy-900">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: `linear-gradient(to right, var(--color-teal-500) ${pct}%, color-mix(in srgb, var(--color-navy-900) 10%, transparent) ${pct}%)` }}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-teal-500"
      />
      {children}
    </div>
  );
}

function Chips({ options, value, format, onChange }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === o ? "bg-navy-900 text-white" : "bg-sand-50 text-navy-800/65 ring-1 ring-navy-900/8 hover:text-navy-900"
          }`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-navy-900/5">
      <div className="flex items-center gap-1.5 text-xs text-navy-800/55">
        <Icon size={14} className={accent || "text-teal-600"} /> {label}
      </div>
      <div className="mt-1 font-display text-lg text-navy-900">{value}</div>
    </div>
  );
}

// Loan planner for a for-sale listing: editable price, down payment, rate,
// tenure, processing fee and optional monthly prepayment, feeding a standard
// reducing-balance EMI with a year-by-year schedule. Illustrative only.
export default function PropertyEmiCalculator({ price: listPrice, slug, upfrontCharges = 0 }) {
  const { currency_symbol: symbol = "$" } = useSiteSettings();
  const [price, setPrice] = useState(listPrice);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [feePct, setFeePct] = useState(0.5);
  const [extra, setExtra] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);

  const m = useMemo(() => {
    const loan = Math.max(price * (1 - downPct / 100), 0);
    const r = rate / 12 / 100;
    const n = years * 12;
    const emi = loan <= 0 ? 0 : r === 0 ? loan / n : (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    const baseInterest = Math.max(emi * n - loan, 0);

    // Amortize with the optional prepayment, rolled up per year.
    let balance = loan;
    let month = 0;
    let interestPaid = 0;
    const yearly = [];
    while (balance > 0.5 && month < n) {
      const interest = balance * r;
      const principal = Math.min(balance, emi - interest + extra);
      balance -= principal;
      interestPaid += interest;
      const y = Math.floor(month / 12);
      yearly[y] ||= { year: y + 1, principal: 0, interest: 0, balance: 0 };
      yearly[y].principal += principal;
      yearly[y].interest += interest;
      yearly[y].balance = Math.max(balance, 0);
      month++;
    }

    const fee = loan * (feePct / 100);
    const down = price - loan;
    return {
      loan, emi, n, fee, down, yearly,
      totalInterest: interestPaid,
      totalPayable: loan + interestPaid,
      upfront: down + fee + upfrontCharges,
      payoffMonths: month,
      interestSaved: extra > 0 ? Math.max(baseInterest - interestPaid, 0) : 0,
      monthsSaved: extra > 0 ? Math.max(n - month, 0) : 0,
      income: emi / 0.4,
    };
  }, [price, downPct, rate, years, feePct, extra, upfrontCharges]);

  const interestShare = m.totalPayable > 0 ? m.totalInterest / m.totalPayable : 0;
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const maxYear = Math.max(...m.yearly.map((y) => y.principal + y.interest), 1);
  const extraMax = Math.max(Math.round(m.emi / 100) * 100, 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
      {/* Inputs */}
      <div className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-navy-900/5 md:p-6">
        <div>
          <label className="flex items-center gap-2 text-sm text-navy-800/65">
            <Home size={15} className="text-teal-600" /> Property price
          </label>
          <div className="mt-2 flex items-center rounded-xl bg-sand-50 px-4 ring-1 ring-navy-900/10 focus-within:ring-teal-500">
            <span className="text-navy-800/50">{symbol}</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(Math.max(Number(e.target.value) || 0, 0))}
              className="w-full bg-transparent px-2 py-3 font-display text-lg text-navy-900 focus:outline-none"
            />
            {price !== listPrice && (
              <button type="button" onClick={() => setPrice(listPrice)} className="shrink-0 text-xs font-semibold text-teal-600 hover:text-teal-700">
                Reset
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-navy-800/45">Negotiating? Try your offer price.</p>
        </div>

        <Slider icon={Wallet} label="Down payment" value={downPct} display={`${downPct}% · ${money(symbol, price * (downPct / 100))}`} min={0} max={90} step={5} onChange={setDownPct}>
          <Chips options={DOWN_PRESETS} value={downPct} format={(o) => `${o}%`} onChange={setDownPct} />
        </Slider>

        <Slider icon={Percent} label="Interest rate (p.a.)" value={rate} display={`${rate.toFixed(1)}%`} min={5} max={15} step={0.1} onChange={(v) => setRate(Math.round(v * 10) / 10)} />

        <Slider icon={CalendarClock} label="Loan tenure" value={years} display={`${years} years`} min={5} max={30} step={1} onChange={setYears}>
          <Chips options={TENURE_PRESETS} value={years} format={(o) => `${o} yrs`} onChange={setYears} />
        </Slider>

        <Slider icon={Receipt} label="Processing fee" value={feePct} display={`${feePct.toFixed(1)}% · ${money(symbol, m.fee)}`} min={0} max={2} step={0.1} onChange={(v) => setFeePct(Math.round(v * 10) / 10)} />

        <Slider icon={PiggyBank} label="Extra payment every month" value={Math.min(extra, extraMax)} display={extra ? money(symbol, extra) : "None"} min={0} max={extraMax} step={Math.max(Math.round(extraMax / 50), 1)} onChange={setExtra} />
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-white">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal-500/20 blur-2xl" />
          <div className="relative flex items-center gap-6">
            <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0 -rotate-90" aria-hidden>
              <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="16" className="stroke-teal-400" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${circ * interestShare} ${circ}`}
                className="stroke-coral-500 transition-all duration-500"
              />
            </svg>
            <div className="min-w-0">
              <div className="text-sm text-white/60">Your monthly EMI</div>
              <div className="font-display text-4xl text-white">{money(symbol, m.emi)}</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Principal {money(symbol, m.loan)}</div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-coral-500" /> Interest {money(symbol, m.totalInterest)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat icon={HandCoins} label="Loan amount" value={money(symbol, m.loan)} />
          <Stat icon={Receipt} label="Total payable" value={money(symbol, m.totalPayable)} />
          <Stat icon={Wallet} label="Cash needed upfront" value={money(symbol, m.upfront)} />
          <Stat icon={CalendarClock} label="Loan closes in" value={`${Math.floor(m.payoffMonths / 12)}y ${m.payoffMonths % 12}m`} />
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-teal-500/10 p-4 ring-1 ring-teal-500/20">
          <Info size={17} className="mt-0.5 shrink-0 text-teal-600" />
          <p className="text-sm text-navy-800/80">
            To keep this EMI comfortable (under 40% of income), aim for a monthly income of{" "}
            <strong className="text-navy-900">{money(symbol, m.income)}</strong> or more.
          </p>
        </div>

        {extra > 0 && (
          <div className="flex items-start gap-3 rounded-2xl bg-coral-500/10 p-4 ring-1 ring-coral-500/20">
            <TrendingDown size={17} className="mt-0.5 shrink-0 text-coral-600" />
            <p className="text-sm text-navy-800/80">
              Paying <strong className="text-navy-900">{money(symbol, extra)}</strong> extra a month saves{" "}
              <strong className="text-navy-900">{money(symbol, m.interestSaved)}</strong> in interest and closes the loan{" "}
              <strong className="text-navy-900">{Math.floor(m.monthsSaved / 12)}y {m.monthsSaved % 12}m</strong> earlier.
            </p>
          </div>
        )}
      </div>

      {/* Year-by-year */}
      {m.yearly.length > 0 && (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-navy-900/5 md:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-navy-900">How your payments split, year by year</h3>
            <div className="flex items-center gap-4 text-xs text-navy-800/60">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-teal-500" /> Principal</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-coral-500" /> Interest</span>
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1">
            {m.yearly.map((y) => (
              <div key={y.year} className="group relative flex h-full flex-1 flex-col justify-end" title={`Year ${y.year}: principal ${money(symbol, y.principal)}, interest ${money(symbol, y.interest)}`}>
                <div className="rounded-t-sm bg-coral-500/90 transition-opacity group-hover:opacity-80" style={{ height: `${(y.interest / maxYear) * 100}%` }} />
                <div className="bg-teal-500 transition-opacity group-hover:opacity-80" style={{ height: `${(y.principal / maxYear) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-navy-800/45">
            <span>Year 1</span>
            <span>Year {m.yearly.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSchedule((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            {showSchedule ? "Hide" : "View"} full schedule
            <ChevronDown size={15} className={`transition-transform ${showSchedule ? "rotate-180" : ""}`} />
          </button>
          {showSchedule && (
            <div className="mt-3 max-h-72 overflow-auto rounded-xl ring-1 ring-navy-900/8">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-sand-100 text-left text-xs text-navy-800/60">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Year</th>
                    <th className="px-4 py-2 font-semibold">Principal</th>
                    <th className="px-4 py-2 font-semibold">Interest</th>
                    <th className="px-4 py-2 font-semibold">Balance left</th>
                  </tr>
                </thead>
                <tbody>
                  {m.yearly.map((y) => (
                    <tr key={y.year} className="border-t border-navy-900/5">
                      <td className="px-4 py-2 text-navy-800/70">{y.year}</td>
                      <td className="px-4 py-2 font-medium text-navy-900">{money(symbol, y.principal)}</td>
                      <td className="px-4 py-2 text-navy-800/70">{money(symbol, y.interest)}</td>
                      <td className="px-4 py-2 text-navy-800/70">{money(symbol, y.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand-100 px-5 py-4 lg:col-span-2">
        <p className="text-sm text-navy-800/70">
          <Calculator size={14} className="mr-1 inline text-teal-600" />
          Estimate only. Ask our team about current bank offers when you visit.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/loan-calculator" className="btn-outline px-4 py-2.5">
            <Calculator size={15} /> Advanced calculator
          </Link>
          <Link href={`/properties/${slug}/visit`} className="btn-primary px-4 py-2.5">
            <CalendarCheck size={15} /> Book a visit
          </Link>
        </div>
      </div>
    </div>
  );
}
