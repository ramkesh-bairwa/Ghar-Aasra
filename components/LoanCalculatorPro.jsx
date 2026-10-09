"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Calculator, Landmark, Percent, CalendarClock, TrendingDown, PiggyBank,
  ChevronDown, Info, Home, Receipt, ShieldCheck, Wallet,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const TERMS = [10, 15, 20, 25, 30];

function amortize({ loanAmount, monthlyRate, basePayment, n, extra }) {
  const rows = [];
  let balance = loanAmount;
  let month = 0;
  while (balance > 0.5 && month < n) {
    month++;
    const interest = balance * monthlyRate;
    let principal = basePayment - interest + extra;
    if (principal < 0) principal = 0;
    if (principal > balance) principal = balance;
    balance = Math.max(0, balance - principal);
    rows.push({ month, interest, principal, balance });
  }
  return rows;
}

function useLoanMath({ price, downPct, years, rate, propertyTaxPct, insuranceAnnual, includePMI, pmiPct, hoaMonthly, extraMonthly }) {
  return useMemo(() => {
    const loanAmount = Math.max(price - price * (downPct / 100), 0);
    const downAmount = price - loanAmount;
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    const basePayment =
      loanAmount <= 0
        ? 0
        : monthlyRate === 0
        ? loanAmount / n
        : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));

    const monthlyTax = (price * (propertyTaxPct / 100)) / 12;
    const monthlyInsurance = insuranceAnnual / 12;
    const ltv = price > 0 ? (loanAmount / price) * 100 : 0;
    const pmiActive = includePMI && ltv > 80;
    const monthlyPMI = pmiActive ? (loanAmount * (pmiPct / 100)) / 12 : 0;
    const totalMonthly = basePayment + monthlyTax + monthlyInsurance + monthlyPMI + hoaMonthly;

    const rows = amortize({ loanAmount, monthlyRate, basePayment, n, extra: extraMonthly });
    const payoffMonths = rows.length;
    const totalInterestPaid = rows.reduce((s, r) => s + r.interest, 0);
    const totalPaid = loanAmount + totalInterestPaid;
    const baselineInterest = monthlyRate === 0 ? 0 : basePayment * n - loanAmount;
    const interestSaved = extraMonthly > 0 ? Math.max(0, baselineInterest - totalInterestPaid) : 0;
    const monthsSaved = extraMonthly > 0 ? Math.max(0, n - payoffMonths) : 0;

    const yearly = [{ year: 0, balance: loanAmount, principal: 0, interest: 0, cumInterest: 0, cumPrincipal: 0 }];
    let cumInterest = 0;
    let cumPrincipal = 0;
    for (let i = 0; i < rows.length; i += 12) {
      const slice = rows.slice(i, i + 12);
      const principal = slice.reduce((s, r) => s + r.principal, 0);
      const interest = slice.reduce((s, r) => s + r.interest, 0);
      cumInterest += interest;
      cumPrincipal += principal;
      yearly.push({
        year: yearly.length,
        balance: slice[slice.length - 1].balance,
        principal,
        interest,
        cumInterest,
        cumPrincipal,
      });
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + payoffMonths);

    return {
      loanAmount, downAmount, basePayment, monthlyTax, monthlyInsurance, monthlyPMI, monthlyHOA: hoaMonthly,
      totalMonthly, ltv, pmiActive, payoffMonths, totalInterestPaid, totalPaid, interestSaved, monthsSaved,
      yearly, payoffDate, n,
    };
  }, [price, downPct, years, rate, propertyTaxPct, insuranceAnnual, includePMI, pmiPct, hoaMonthly, extraMonthly]);
}

function Donut({ principal, interest, size = 128, strokeWidth = 18 }) {
  const total = principal + interest || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const principalDash = (principal / total) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" style={{ stroke: "rgba(255,255,255,0.12)" }} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        style={{ stroke: "var(--color-teal-500)" }}
        strokeWidth={strokeWidth}
        strokeDasharray={`${principalDash} ${circumference - principalDash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        style={{ stroke: "var(--color-coral-500)" }}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference - principalDash} ${principalDash}`}
        strokeDashoffset={-principalDash}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="46%" textAnchor="middle" className="fill-white" style={{ fontSize: 11, opacity: 0.55 }}>
        Interest is
      </text>
      <text x="50%" y="62%" textAnchor="middle" className="fill-white font-semibold" style={{ fontSize: 17 }}>
        {Math.round((interest / total) * 100)}%
      </text>
    </svg>
  );
}

function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-navy-900/10 bg-white px-3.5 py-2.5 text-xs shadow-card">
      <div className="font-semibold text-navy-900">Year {label}</div>
      <div className="mt-1.5 space-y-1 text-navy-800/70">
        <div className="flex items-center justify-between gap-4">
          <span>Remaining balance</span>
          <span className="font-medium text-navy-900">{fmt(d.balance)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-500" /> Principal paid this year</span>
          <span className="font-medium text-navy-900">{fmt(d.principal)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-coral-500" /> Interest paid this year</span>
          <span className="font-medium text-navy-900">{fmt(d.interest)}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-navy-800/70">
        {label}
        {help && (
          <span className="group/tip relative inline-flex">
            <Info size={13} className="text-navy-800/35" />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover/tip:opacity-100">
              {help}
            </span>
          </span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30";

function Row({ icon: Icon, label, value, bold, muted }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={`flex items-center gap-2 ${muted ? "text-white/45" : "text-white/60"}`}>
        {Icon && <Icon size={14} />}
        {label}
      </dt>
      <dd className={bold ? "font-display text-base text-teal-300" : "font-medium text-white"}>{value}</dd>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-xs text-navy-800/50">{label}</div>
        <div className="truncate font-display text-base text-navy-900">{value}</div>
      </div>
    </div>
  );
}

export default function LoanCalculatorPro() {
  const { currency_symbol } = useSiteSettings();
  const [price, setPrice] = useState(450000);
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(6.75);
  const [propertyTaxPct, setPropertyTaxPct] = useState(1.1);
  const [insuranceAnnual, setInsuranceAnnual] = useState(1400);
  const [includePMI, setIncludePMI] = useState(true);
  const [pmiPct, setPmiPct] = useState(0.55);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [showExtra, setShowExtra] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const calc = useLoanMath({ price, downPct, years, rate, propertyTaxPct, insuranceAnnual, includePMI, pmiPct, hoaMonthly, extraMonthly });

  const fmt = (n) => `${currency_symbol}${Math.round(n).toLocaleString("en-US")}`;
  const fmt2 = (n) => `${currency_symbol}${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;

  const payoffLabel = calc.payoffDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const termSavedLabel = calc.monthsSaved > 0
    ? `${Math.floor(calc.monthsSaved / 12) ? `${Math.floor(calc.monthsSaved / 12)} yr ` : ""}${calc.monthsSaved % 12 ? `${calc.monthsSaved % 12} mo` : ""}`.trim() || "0 mo"
    : null;

  return (
    <section className="bg-sand-50 py-10 md:py-14">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,1fr] lg:items-start">
          {/* LEFT: inputs */}
          <div className="space-y-5">
            <div className="card-surface p-6 md:p-7">
              <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
                <Home size={18} className="text-teal-600" /> Loan details
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Home price">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                    className={inputClass}
                  />
                </Field>

                <Field label={`Down payment — ${downPct}% (${fmt(calc.downAmount)})`}>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={downPct}
                    onChange={(e) => setDownPct(Number(e.target.value))}
                    className="mt-3.5 w-full accent-teal-500"
                  />
                </Field>

                <Field label="Loan term">
                  <select value={years} onChange={(e) => setYears(Number(e.target.value))} className={inputClass}>
                    {TERMS.map((y) => (
                      <option key={y} value={y}>{y} years</option>
                    ))}
                  </select>
                </Field>

                <Field label="Interest rate (APR)">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={rate}
                      onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))}
                      className={`${inputClass} pr-9`}
                    />
                    <Percent size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy-800/30" />
                  </div>
                </Field>
              </div>
            </div>

            <div className="card-surface p-6 md:p-7">
              <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
                <Receipt size={18} className="text-teal-600" /> Taxes, insurance & fees
              </h2>
              <p className="mt-1 text-xs text-navy-800/50">Your real monthly cost usually includes more than principal and interest.</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Property tax (per year)" help="Estimated as a percentage of the home price, then split monthly.">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={propertyTaxPct}
                      onChange={(e) => setPropertyTaxPct(Math.max(0, Number(e.target.value) || 0))}
                      className={`${inputClass} pr-9`}
                    />
                    <Percent size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy-800/30" />
                  </div>
                </Field>

                <Field label="Home insurance (per year)">
                  <input
                    type="number"
                    value={insuranceAnnual}
                    onChange={(e) => setInsuranceAnnual(Math.max(0, Number(e.target.value) || 0))}
                    className={inputClass}
                  />
                </Field>

                <Field label="HOA dues (per month)">
                  <input
                    type="number"
                    value={hoaMonthly}
                    onChange={(e) => setHoaMonthly(Math.max(0, Number(e.target.value) || 0))}
                    className={inputClass}
                  />
                </Field>

                <Field label="PMI rate (per year)" help="Private mortgage insurance. Only applied below when your down payment is under 20% (loan-to-value over 80%).">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      disabled={!includePMI}
                      value={pmiPct}
                      onChange={(e) => setPmiPct(Math.max(0, Number(e.target.value) || 0))}
                      className={`${inputClass} pr-9 disabled:cursor-not-allowed disabled:opacity-40`}
                    />
                    <Percent size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy-800/30" />
                  </div>
                </Field>
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-navy-800/60">
                <input type="checkbox" checked={includePMI} onChange={(e) => setIncludePMI(e.target.checked)} className="accent-teal-500" />
                Include PMI when my down payment is under 20%
                {calc.pmiActive && <span className="badge-pill bg-coral-500/10 text-coral-600">Active — {calc.ltv.toFixed(0)}% LTV</span>}
              </label>
            </div>

            <div className="card-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExtra((v) => !v)}
                className="flex w-full items-center justify-between p-6 text-left md:p-7"
              >
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
                    <PiggyBank size={18} className="text-teal-600" /> Extra payments
                  </h2>
                  <p className="mt-1 text-xs text-navy-800/50">See how paying a bit more each month shortens your loan.</p>
                </div>
                <ChevronDown size={18} className={`shrink-0 text-navy-800/40 transition-transform ${showExtra ? "rotate-180" : ""}`} />
              </button>
              {showExtra && (
                <div className="border-t border-navy-900/8 p-6 md:p-7">
                  <Field label="Extra amount toward principal (per month)">
                    <input
                      type="number"
                      value={extraMonthly}
                      onChange={(e) => setExtraMonthly(Math.max(0, Number(e.target.value) || 0))}
                      className={inputClass}
                    />
                  </Field>
                  {extraMonthly > 0 && (
                    <div className="mt-4 rounded-xl border border-teal-500/25 bg-teal-500/10 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                        <TrendingDown size={15} /> You'd pay off {termSavedLabel} sooner
                      </p>
                      <p className="mt-1 text-sm text-navy-800/70">
                        And save <span className="font-semibold text-navy-900">{fmt(calc.interestSaved)}</span> in interest over the life of the loan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: sticky summary */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-xl2 bg-navy-900 p-6 text-white md:p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
                  <Calculator size={20} />
                </span>
                <span className="badge-pill bg-white/10 text-white/70">{years}-yr fixed</span>
              </div>

              <div className="mt-6">
                <div className="text-sm text-white/55">Estimated total monthly payment</div>
                <div className="mt-1 font-display text-4xl text-teal-300">{fmt(calc.totalMonthly)}</div>
                <div className="mt-1 text-xs text-white/40">Includes principal, interest, tax, insurance{calc.pmiActive ? ", PMI" : ""}{hoaMonthly > 0 ? " & HOA" : ""}</div>
              </div>

              <div className="mt-6 flex items-center gap-5 border-t border-white/10 pt-6">
                <Donut principal={calc.loanAmount} interest={calc.totalInterestPaid} />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                    <span className="text-white/60">Principal</span>
                    <span className="ml-auto font-medium text-white">{fmt(calc.loanAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-coral-500" />
                    <span className="text-white/60">Total interest</span>
                    <span className="ml-auto font-medium text-white">{fmt(calc.totalInterestPaid)}</span>
                  </div>
                </div>
              </div>

              <dl className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm">
                <Row icon={Landmark} label="Principal & interest" value={fmt(calc.basePayment)} />
                <Row icon={Receipt} label="Property tax" value={fmt(calc.monthlyTax)} />
                <Row icon={ShieldCheck} label="Home insurance" value={fmt(calc.monthlyInsurance)} />
                {calc.pmiActive && <Row icon={ShieldCheck} label="PMI" value={fmt(calc.monthlyPMI)} />}
                {hoaMonthly > 0 && <Row icon={Wallet} label="HOA dues" value={fmt(hoaMonthly)} />}
                <div className="!mt-4 border-t border-white/10 pt-3">
                  <Row label="Total monthly payment" value={fmt(calc.totalMonthly)} bold />
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatChip icon={Landmark} label="Loan amount" value={fmt(calc.loanAmount)} />
              <StatChip icon={Percent} label="Loan-to-value" value={`${calc.ltv.toFixed(0)}%`} />
              <StatChip icon={CalendarClock} label="Payoff date" value={payoffLabel} />
              <StatChip icon={TrendingDown} label="Total cost of loan" value={fmt(calc.totalPaid)} />
            </div>
          </div>
        </div>

        {/* Amortization chart + schedule */}
        <div className="mt-6 card-surface p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-navy-900">Amortization over time</h2>
              <p className="mt-1 text-xs text-navy-800/50">Hover the chart to see exactly how much goes to principal vs. interest each year.</p>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calc.yearly} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-teal-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-teal-500)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,27,45,0.08)" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "rgba(15,27,45,0.45)" }}
                  tickFormatter={(y) => `Yr ${y}`}
                  interval={calc.yearly.length > 20 ? 4 : calc.yearly.length > 10 ? 1 : 0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fontSize: 11, fill: "rgba(15,27,45,0.45)" }}
                  tickFormatter={(v) => `${currency_symbol}${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip fmt={fmt} />} />
                <Area type="monotone" dataKey="balance" stroke="var(--color-teal-500)" strokeWidth={2.5} fill="url(#balanceFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <button
            type="button"
            onClick={() => setShowSchedule((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            {showSchedule ? "Hide" : "Show"} full yearly schedule
            <ChevronDown size={15} className={`transition-transform ${showSchedule ? "rotate-180" : ""}`} />
          </button>

          {showSchedule && (
            <div className="mt-4 max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-navy-900/8">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="sticky top-0 bg-sand-100 text-xs font-semibold uppercase tracking-wide text-navy-800/50">
                  <tr>
                    <th className="px-4 py-2.5">Year</th>
                    <th className="px-4 py-2.5">Principal paid</th>
                    <th className="px-4 py-2.5">Interest paid</th>
                    <th className="px-4 py-2.5">Remaining balance</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.yearly.slice(1).map((row) => (
                    <tr key={row.year} className="border-t border-navy-900/6">
                      <td className="px-4 py-2.5 font-medium text-navy-900">{row.year}</td>
                      <td className="px-4 py-2.5 text-navy-800/70">{fmt2(row.principal)}</td>
                      <td className="px-4 py-2.5 text-navy-800/70">{fmt2(row.interest)}</td>
                      <td className="px-4 py-2.5 text-navy-800/70">{fmt2(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
