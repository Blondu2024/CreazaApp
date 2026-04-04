import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";

export const metadata = {
  title: "Blog",
  description: "Articole despre cum să creezi aplicații web cu AI, ghiduri pas cu pas, și sfaturi pentru antreprenori. În limba română.",
  alternates: { canonical: "https://creazaapp.com/blog" },
  openGraph: {
    title: "Blog — CreazaApp",
    description: "Ghiduri, tutoriale și noutăți despre crearea de aplicații web cu AI",
    url: "https://creazaapp.com/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Blog CreazaApp
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Ghiduri și <span className="gradient-text">sfaturi</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cum să creezi aplicații web cu AI, comparații de prețuri, și inspirație pentru proiectele tale.
          </p>
        </div>

        {/* Blog grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-[#6366f1]/50 transition-all duration-200 hover:-translate-y-1"
            >
              {/* Category badge + date */}
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${post.categoryColor}20`, color: post.categoryColor }}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                </div>
              </div>

              {/* Title + description */}
              <div className="p-6 pt-0">
                <h2 className="text-lg font-bold mb-2 group-hover:text-[#6366f1] transition-colors leading-tight">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {post.description}
                </p>

                {/* Read time + arrow */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime} citire
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#6366f1] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border border-[#6366f1]/20 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Gata de citit? Hai să construiești.</h2>
          <p className="text-muted-foreground mb-6">Creează prima ta aplicație web cu AI — gratuit, în română.</p>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity btn-primary-glow"
          >
            Începe gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
