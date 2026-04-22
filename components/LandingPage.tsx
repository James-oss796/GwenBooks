'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Book } from "@/types";
import { motion, useInView, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoadStatus = "idle" | "loading" | "ready";

// ─── Status dot config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  idle:    { color: "bg-red-500",     glow: "shadow-red-500/80",     label: "Not loaded" },
  loading: { color: "bg-amber-400",   glow: "shadow-amber-400/80",   label: "Loading…"   },
  ready:   { color: "bg-emerald-400", glow: "shadow-emerald-400/80", label: "Live"       },
};

// ─── Cycling words for the dynamic hero slot ──────────────────────────────────
const CYCLING_WORDS = [
  "chapters",
  "plot twists",
  "first editions",
  "dog-eared pages",
  "midnight reads",
  "lost classics",
  "new worlds",
  "your next obsession",
  "the last page",
  "every story",
];

// ─── Word-by-word animated headline ──────────────────────────────────────────
function AnimatedWords({
  text,
  className,
  delay = 0,
  stagger = 0.08,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: delay + i * stagger,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.22em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Skeleton book card ───────────────────────────────────────────────────────
function BookSkeleton() {
  return (
    <div className="w-[140px] flex-shrink-0 animate-pulse">
      <div className="aspect-[2/3] rounded-lg bg-white/10" />
      <div className="mt-2 h-3 rounded bg-white/10 w-3/4" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [demoBooks, setDemoBooks]           = useState<Book[]>([]);
  const [activeDemoBook, setActiveDemoBook] = useState<Book | null>(null);
  const [booksStatus, setBooksStatus]       = useState<LoadStatus>("idle");
  const [iframeStatus, setIframeStatus]     = useState<LoadStatus>("idle");
  const [cycleIndex, setCycleIndex]         = useState(0);

  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const featuresRef    = useRef<HTMLElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });

  // ── Combined load status ──────────────────────────────────────────────────
  const globalStatus: LoadStatus =
    booksStatus === "idle" || iframeStatus === "idle"
      ? "idle"
      : booksStatus === "loading" || iframeStatus === "loading"
      ? "loading"
      : "ready";

  const { color, glow, label } = STATUS_CONFIG[globalStatus];

  // ── Cycle the dynamic word every 2.4 s ───────────────────────────────────
  useEffect(() => {
    const id = setInterval(
      () => setCycleIndex(i => (i + 1) % CYCLING_WORDS.length),
      2400
    );
    return () => clearInterval(id);
  }, []);

  // ── Fetch books ───────────────────────────────────────────────────────────
  const loadBooks = useCallback(async () => {
    setBooksStatus("loading");
    try {
      const res = await fetch(
        "https://gutendex.com/books?languages=en&sort=popular&mime_type=text%2Fplain&page=1",
        { next: { revalidate: 3600 } } as RequestInit
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      const books: Book[] = (data.results || []).slice(0, 18).map((b: any) => ({
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
      setBooksStatus("ready");
    } catch {
      setBooksStatus("idle");
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  // Mark iframe as loading whenever active book changes
  useEffect(() => {
    if (!activeDemoBook) return;
    setIframeStatus("loading");
  }, [activeDemoBook]);

  return (
    <main className="min-h-screen text-white bg-dark-100 bg-pattern bg-top bg-cover overflow-x-hidden">

      {/* ── NAV ── */}
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
            <Link href="/sign-in" className="text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>

        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-4 pt-36 pb-20 flex flex-col lg:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl space-y-7"
        >

          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 text-sm text-white/70 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            {/* Layered glow dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inset-0 rounded-full ${color} blur-[3px] opacity-90 transition-colors duration-700`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color} shadow-lg ${glow} transition-colors duration-700`} />
              {globalStatus !== "ready" && (
                <span className={`absolute inset-0 rounded-full ${color} opacity-60 animate-ping transition-colors duration-700`} />
              )}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                A calm digital library —{" "}
                <span className="text-white/40">{label}</span>
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.06] tracking-tight">
            <AnimatedWords text="Where every" delay={0.1} stagger={0.09} />
            <br />
            {/* Dynamic cycling word + rest of line */}
            <span className="inline-flex items-baseline gap-3 flex-wrap">
              <AnimatePresence mode="wait">
                <motion.span
                  key={cycleIndex}
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-400 bg-clip-text text-transparent"
                >
                  {CYCLING_WORDS[cycleIndex]}
                </motion.span>
              </AnimatePresence>
              <AnimatedWords text="live forever." delay={0.3} stagger={0.09} />
            </span>
          </h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-white/60 max-w-lg leading-relaxed"
          >
            A reading sanctuary for those who get lost in pages. Track your journey,
            discover forgotten classics, and let AI illuminate every chapter —
            whether you read for pleasure or write for legacy.
          </motion.p>

          {/* CTAs — original styling retained exactly */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-4 flex-wrap"
          >
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/sign-up">Start Reading</Link>
            </Button>
            <Button asChild size="lg" className="rounded-full px-6 bg-white text-black">
              <Link href="/library">Explore Library</Link>
            </Button>
          </motion.div>

        </motion.div>
      </section>

      {/* ── SCROLLING BOOK STRIP ── */}
      <section className="overflow-hidden py-10 relative">
        <div className="flex w-max gap-4 px-4 animate-scroll">
          {(demoBooks.length > 0
            ? [...demoBooks, ...demoBooks]
            : Array.from({ length: 24 })
          ).map((book, i) =>
            book ? (
              <button
                key={(book as Book).id + i}
                onClick={() => setActiveDemoBook(book as Book)}
                className={`w-[140px] flex-shrink-0 group transition-opacity ${
                  activeDemoBook?.id === (book as Book).id
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                  <Image
                    src={(book as Book).coverUrl || "/placeholder-book.jpg"}
                    alt={(book as Book).title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="140px"
                  />
                </div>
                <p className="text-xs mt-2 truncate text-white/50 group-hover:text-white/80 transition-colors">
                  {(book as Book).title}
                </p>
              </button>
            ) : (
              <BookSkeleton key={i} />
            )
          )}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/50" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/50" />
      </section>

      {/* ── DEMO SECTION ── */}
      <section id="demo" className="mx-auto max-w-5xl px-4 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl text-center font-semibold mb-3"
        >
          Read using your system
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center text-white/40 text-sm mb-8"
        >
          Click any book above to preview it here
        </motion.p>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
          {/* Browser-chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-amber-400/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
            <span className="ml-3 text-xs text-white/30 font-mono truncate">
              {activeDemoBook ? activeDemoBook.title : "Loading…"}
            </span>
            {/* Mini status dot */}
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-white/30">
              <span className={`h-1.5 w-1.5 rounded-full ${color} transition-colors duration-700`} />
              {label}
            </span>
          </div>

          <div className="relative">
            {iframeStatus === "loading" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <svg className="h-8 w-8 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-xs text-white/30">Opening book…</span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={activeDemoBook?.id}
              title="read-system-demo"
              src={activeDemoBook?.readUrl || "/read/gutenberg%3A1513"}
              className="w-full h-[420px]"
              scrolling="no"
              onLoad={() => setIframeStatus("ready")}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        ref={featuresRef}
        className="mx-auto max-w-5xl px-4 py-24"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl font-semibold text-center mb-16 tracking-tight"
        >
          Built for readers who finish
        </motion.h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "📖",
              title: "Progress tracking",
              desc: "Your reading position is saved automatically across every device.",
            },
            {
              icon: "✦",
              title: "AI page summaries",
              desc: "One tap to get a clear summary of any page without leaving the reader.",
            },
            {
              icon: "🔖",
              title: "Favorites & bookmarks",
              desc: "Save any book to your library and return right where you left off.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors"
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="font-semibold text-white/90 mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 pt-16 pb-10 text-center px-4">
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl font-semibold"
        >
          Start your reading journey today
        </motion.h3>

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

      {/* ── ANIMATIONS ── */}
      <style jsx>{`
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

    </main>
  );
}