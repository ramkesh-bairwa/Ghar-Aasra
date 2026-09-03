export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <section className="border-b border-navy-900/8 bg-navy-900 py-14">
      <div className="container-page">
        {eyebrow && <div className="text-sm font-medium text-teal-400">{eyebrow}</div>}
        <h1 className="mt-2 font-display text-3xl text-white md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xl text-[15px] text-white/60">{subtitle}</p>}
      </div>
    </section>
  );
}
