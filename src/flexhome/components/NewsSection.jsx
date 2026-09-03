export default function NewsSection({ posts = [] }) {
  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <h2 className="font-display text-2xl text-navy-900 md:text-3xl">From the blog</h2>
        <p className="mt-1 text-[15px] text-navy-800/60">Market insight and practical guides, updated weekly.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((n) => (
            <a key={n.slug} href={`/blog/${n.slug}`} className="card-surface group block overflow-hidden">
              <img src={n.image} alt="" className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="p-4">
                <span className="text-xs font-semibold text-teal-600">{n.category}</span>
                <h3 className="mt-2 font-display text-[15px] leading-snug text-navy-900">{n.title}</h3>
                <span className="mt-3 block text-xs text-navy-800/45">{n.date}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
