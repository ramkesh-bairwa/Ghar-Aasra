import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBlogPostBySlug, listBlogPosts } from "@/lib/queries";
import { Calendar, User } from "lucide-react";

export async function generateMetadata({ params }) {
  const post = await getBlogPostBySlug(params.slug);
  return { title: post ? `${post.title}` : "Blog" };
}

export default async function BlogPostPage({ params }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const others = (await listBlogPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="relative h-72 w-full">
          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/20 to-transparent" />
          <div className="container-page absolute inset-x-0 bottom-6">
            <span className="badge-pill bg-teal-500 text-white">{post.category}</span>
            <h1 className="mt-3 max-w-2xl font-display text-3xl text-white md:text-4xl">{post.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><User size={13} /> {post.author}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {post.date}</span>
            </div>
          </div>
        </div>

        <article className="container-page mx-auto max-w-2xl py-12">
          <div className="whitespace-pre-line text-[16px] leading-[1.8] text-navy-800/80">{post.content}</div>
        </article>

        {others.length > 0 && (
          <section className="border-t border-navy-900/8 bg-sand-50 py-12">
            <div className="container-page">
              <h2 className="font-display text-2xl text-navy-900">More from the blog</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {others.map((p) => (
                  <a key={p.slug} href={`/blog/${p.slug}`} className="card-surface group block overflow-hidden">
                    <img src={p.image} alt="" className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="p-4">
                      <span className="text-xs font-semibold text-teal-600">{p.category}</span>
                      <h3 className="mt-1 font-display text-[15px] leading-snug text-navy-900">{p.title}</h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
