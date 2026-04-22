'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Book } from "@/types";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [demoBooks, setDemoBooks] = useState<Book[]>([]);
  const [activeDemoBook, setActiveDemoBook] = useState<Book | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://gutendex.com/books?languages=en&sort=popular&mime_type=text%2Fplain"
        );

        if (!res.ok) return;

        const data = await res.json();

        const books: Book[] = (data.results || [])
          .slice(0, 18)
          .map((b: any) => ({
            id: `gutenberg:${b.id}`,
            title: b.title ?? "Untitled",
            author: b.authors?.[0]?.name ?? "Unknown",
            coverUrl: b.formats?.["image/jpeg"] || "/placeholder-book.jpg",
            readUrl: `/read/gutenberg:${b.id}`,
            source: "gutenberg",
            isFullyReadable: true,
          }));

        setDemoBooks(books);
        setActiveDemoBook(books[0] || null);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen text-white bg-dark-100 bg-pattern bg-top bg-cover">

      {/* NAV */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
            <span className="font-semibold">GwenBooks</span>
          </div>

          <nav className="hidden sm:flex gap-8 text-sm text-white/80">
            <Link href="#demo">Demo</Link>
            <Link href="#features">Features</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-white/70 hover:text-white">
              Sign in
            </Link>

            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-36 pb-20 flex flex-col lg:flex-row items-center gap-12">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl space-y-6"
        >

          <p className="inline-flex items-center gap-2 text-sm text-white/70 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            A calm digital library
          </p>

          <h1 className="text-5xl font-semibold leading-tight">
            Read. Track.{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              Finish books.
            </span>
          </h1>

          <p className="text-white/70">
            Everything flows through your own reading system — progress, AI, bookmarks.
          </p>

          <div className="flex gap-4">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/sign-up">Start Reading</Link>
            </Button>

            <Button asChild size="lg" className="rounded-full px-6 bg-white text-black">
              <Link href="/library">Explore Library</Link>
            </Button>
          </div>
        </motion.div>


      </section>

      {/* MOVING STRIP */}
      <section className="overflow-hidden py-10">
        <div className="flex w-max gap-4 px-4 animate-scroll">

          {[...demoBooks, ...demoBooks].map((book, i) => (
            <button
              key={book.id + i}
              onClick={() => setActiveDemoBook(book)}
              className="w-[140px] flex-shrink-0"
            >
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-white/5">
                <Image
                  src={book.coverUrl || "/placeholder-book.jpg"}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>

              <p className="text-xs mt-2 truncate">{book.title}</p>
            </button>
          ))}

        </div>
      </section>

      {/* DEMO SECTION (clean, no duplication) */}
      <section id="demo" className="mx-auto max-w-5xl px-4 pb-24">
        <h2 className="text-2xl text-center font-semibold mb-6">
          Read using your system
        </h2>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">

          <iframe
            key={activeDemoBook?.id + "-demo"}
            title="read-system-demo"
            src={activeDemoBook?.readUrl || "/read/gutenberg%3A1513"}
            className="w-full h-[420px]"
            scrolling="no"
          />

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 pt-16 pb-10 text-center px-4">
        <h3 className="text-2xl font-semibold">Start your reading journey today</h3>

        <div className="mt-6 flex justify-center gap-4">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href="/sign-up">Create Account</Link>
          </Button>

          <Button asChild size="lg" className="rounded-full px-6 bg-white text-black">
            <Link href="/library">Explore Library</Link>
          </Button>
        </div>

        <p className="mt-10 text-xs text-white/40">
          © {new Date().getFullYear()} GwenBooks
        </p>
      </footer>

      {/* ANIMATION */}
      <style jsx>{`
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }

        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

    </main>
  );
}