import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { listBlogPosts } from "@/lib/queries";

export const metadata = { title: "Blog & News" };

export default async function BlogPage() {
  const posts = await listBlogPosts();

  return (
    <>
      <Header />
      <main>
        <PageHeader eyebrow="Blog" title="Blog & news" subtitle="Market insight, design ideas, and practical guides." />
        <section className="bg-sand-50 py-12">
          <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <a key={p.slug} href={`/blog/${p.slug}`} className="card-surface group block overflow-hidden">
                <img src={p.image} alt="" className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="p-5">
                  <span className="text-xs font-semibold text-teal-600">{p.category}</span>
                  <h3 className="mt-2 font-display text-[17px] leading-snug text-navy-900">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-navy-800/60">{p.excerpt}</p>
                  <span className="mt-4 block text-xs text-navy-800/45">{p.date}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
