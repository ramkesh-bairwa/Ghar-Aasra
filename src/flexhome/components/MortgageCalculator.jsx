"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

export default function MortgageCalculator() {
  const { currency_symbol } = useSiteSettings();
  const [price, setPrice] = useState(450000);
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(6.5);

  const { monthly, totalInterest, loanAmount } = useMemo(() => {
    const loan = price * (1 - downPct / 100);
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    const m =
      monthlyRate === 0
        ? loan / n
        : (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
    return {
      monthly: m,
      totalInterest: m * n - loan,
      loanAmount: loan,
    };
  }, [price, downPct, years, rate]);

  const fmt = (n) => `${currency_symbol}${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">
          <div className="card-surface p-6 md:p-8">
            <h2 className="font-display text-2xl text-navy-900">Mortgage calculator</h2>
            <p className="mt-1 text-[15px] text-navy-800/60">Estimate your monthly payment before you tour a place.</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-navy-800/70">Property price</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-navy-800/70">Down payment: {downPct}%</span>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={downPct}
                  onChange={(e) => setDownPct(Number(e.target.value))}
                  className="mt-4 w-full accent-teal-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-navy-800/70">Loan term</span>
                <select
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none"
                >
                  {[10, 15, 20, 25, 30].map((y) => (
                    <option key={y} value={y}>
                      {y} years
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-navy-800/70">Interest rate</span>
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl2 bg-navy-900 p-6 text-white md:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
              <Calculator size={20} />
            </span>
            <div className="mt-6">
              <div className="text-sm text-white/55">Estimated monthly payment</div>
              <div className="mt-1 font-display text-4xl text-teal-300">{fmt(monthly)}</div>
            </div>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/55">Loan amount</dt>
                <dd className="font-medium">{fmt(loanAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Total interest paid</dt>
                <dd className="font-medium">{fmt(totalInterest)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Total repaid</dt>
                <dd className="font-medium">{fmt(loanAmount + totalInterest)}</dd>
              </div>
            </dl>
            <Link
              href="/loan-calculator"
              className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              Open the full calculator
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
