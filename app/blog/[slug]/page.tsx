import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getPostBySlug } from "@/lib/blog-posts";
import type { Metadata } from "next";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Articol negăsit" };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://creazaapp.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://creazaapp.com/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      locale: "ro_RO",
    },
  };
}

// Simple markdown-like renderer for blog content
function renderContent(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let key = 0;

  const flushTable = () => {
    if (tableRows.length === 0) return;
    elements.push(
      <div key={key++} className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {tableHeader.map((h, i) => (
                <th key={i} className="text-left p-3 border-b-2 border-border font-semibold text-foreground bg-muted/30">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-3 text-muted-foreground">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    tableHeader = [];
    inTable = false;
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="my-4 space-y-2 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-muted-foreground leading-relaxed">
            <span className="text-[#6366f1] mt-1.5 flex-shrink-0">&#8226;</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
    inList = false;
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inList) flushList();
      const cells = trimmed.split("|").filter(c => c.trim()).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue; // separator row
      if (!inTable) {
        tableHeader = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // List item
    if (trimmed.startsWith("- ")) {
      if (!inList) inList = true;
      listItems.push(trimmed.slice(2));
      continue;
    } else if (inList) {
      flushList();
    }

    // Empty line
    if (!trimmed) continue;

    // Headings
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-2xl font-bold mt-10 mb-4 text-foreground">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-xl font-semibold mt-8 mb-3 text-foreground">
          {trimmed.slice(4)}
        </h3>
      );
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="my-4 pl-4 border-l-2 border-[#6366f1] text-muted-foreground italic">
          {trimmed.slice(2)}
        </blockquote>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p
          key={key++}
          className="text-muted-foreground leading-relaxed my-3"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    }
  }

  if (inTable) flushTable();
  if (inList) flushList();

  return elements;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Schema.org Article markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "CreazaApp" },
    publisher: {
      "@type": "Organization",
      name: "CreazaApp",
      url: "https://creazaapp.com",
    },
    mainEntityOfPage: `https://creazaapp.com/blog/${post.slug}`,
    inLanguage: "ro",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-3xl mx-auto px-6 py-20">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#6366f1] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi la blog
        </Link>

        {/* Article header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${post.categoryColor}20`, color: post.categoryColor }}
            >
              {post.category}
            </span>
            <span className="text-sm text-muted-foreground">{post.date}</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground">{post.description}</p>
        </header>

        {/* Article content */}
        <article className="prose-custom">
          {renderContent(post.content)}
        </article>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border border-[#6366f1]/20 rounded-2xl p-8 text-center">
          <BookOpen className="w-8 h-8 text-[#6366f1] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Gata de acțiune?</h2>
          <p className="text-muted-foreground mb-4">Creează prima ta aplicație web cu AI — gratuit, în română.</p>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity btn-primary-glow"
          >
            Începe gratuit
          </Link>
        </div>

        {/* Related posts */}
        <div className="mt-16">
          <h3 className="text-lg font-bold mb-6">Citește și:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block p-4 border border-border rounded-xl hover:border-[#6366f1]/50 transition-colors"
                >
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${p.categoryColor}20`, color: p.categoryColor }}
                  >
                    {p.category}
                  </span>
                  <h4 className="font-semibold mt-2 text-sm leading-tight">{p.title}</h4>
                </Link>
              ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
