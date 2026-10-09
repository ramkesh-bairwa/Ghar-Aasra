import { Send } from "lucide-react";

export default function NewsletterBanner({ title, subtitle }) {
  return (
    <section className="bg-white pb-16">
      <div className="container-page">
        <div className="flex flex-col items-start gap-6 rounded-xl2 bg-navy-900 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="font-display text-2xl text-white">{title}</h2>
            {subtitle && <p className="mt-1 max-w-md text-[15px] text-white/60">{subtitle}</p>}
          </div>
          <form className="flex w-full max-w-sm gap-2 md:w-auto">
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
            <button type="submit" className="btn-primary shrink-0 px-5">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
