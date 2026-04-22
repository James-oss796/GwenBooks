'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Book } from "@/types";
import {
  motion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoadStatus = "idle" | "loading" | "ready";

// ─── Status dot config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  idle:    { color: "bg-red-500",     glow: "shadow-red-500/80",     label: "Not loaded" },
  loading: { color: "bg-amber-400",   glow: "shadow-amber-400/80",   label: "Loading…"   },
  ready:   { color: "bg-emerald-400", glow: "shadow-emerald-400/80", label: "Live"       },
};

// ─── Cycling words ────────────────────────────────────────────────────────────
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

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: 70000, suffix: "+",     label: "Books available"       },
  { value: 100,   suffix: "% free", label: "Forever, no paywalls" },
  { value: 1,     suffix: " tap",   label: "AI summary, any page" },
];

// ─── Stack layout ─────────────────────────────────────────────────────────────
const STACK_CONFIG = [
  { x: 44,  y: 14,  rotate: 9,   z: 10, scale: 0.86, depth: 0.7 },
  { x: 16,  y: 34,  rotate: -6,  z: 20, scale: 0.92, depth: 1.0 },
  { x: -8,  y: 4,   rotate: 3,   z: 30, scale: 0.96, depth: 1.3 },
  { x: 22,  y: -18, rotate: -10, z: 40, scale: 1.0,  depth: 1.6 },
];

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const step = 16;
    const increment = target / (1400 / step);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Word-by-word headline ────────────────────────────────────────────────────
function AnimatedWords({
  text, className, delay = 0, stagger = 0.08,
}: { text: string; className?: string; delay?: number; stagger?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * stagger, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block mr-[0.22em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Skeleton strip card ──────────────────────────────────────────────────────
function BookSkeleton() {
  return (
    <div className="w-[140px] flex-shrink-0 animate-pulse">
      <div className="aspect-[2/3] rounded-lg bg-white/10" />
      <div className="mt-2 h-3 rounded bg-white/10 w-3/4" />
    </div>
  );
}

// ─── Single floating book card ────────────────────────────────────────────────
// Extracted into its own component so hooks are never called inside a .map()
function FloatingCard({
  book,
  index,
  smoothX,
  smoothY,
}: {
  book: Book | null;
  index: number;
  smoothX: ReturnType<typeof useSpring>;
  smoothY: ReturnType<typeof useSpring>;
}) {
  const cfg = STACK_CONFIG[index];

  const cardX      = useTransform(smoothX, (v) => v * 18 * cfg.depth);
  const cardY      = useTransform(smoothY, (v) => v * 12 * cfg.depth);
  const cardRotate = useTransform(
    smoothX,
    (v) => cfg.rotate + v * 4 * (index % 2 === 0 ? 1 : -1)
  );

  return (
    <motion.div
      className="absolute"
      style={{
        x: cardX,
        y: cardY,
        rotate: cardRotate,
        zIndex: cfg.z,
        scale: cfg.scale,
        left: `calc(50% + ${cfg.x}px - 80px)`,
        top:  `calc(50% + ${cfg.y}px - 110px)`,
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Bobbing wrapper */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3.5 + index * 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.4,
        }}
        className="relative w-[160px] h-[220px] rounded-xl overflow-hidden ring-1 ring-white/20"
        style={{
          boxShadow: `0 ${20 + index * 4}px ${40 + index * 8}px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)`,
        }}
      >
        {book?.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title || "Book cover"}
            fill
            className="object-cover"
            sizes="160px"
            priority={index === 3}
          />
        ) : (
          // Shown only while books haven't loaded yet
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
        )}
        {/* Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      </motion.div>

      {/* Drop shadow disc */}
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full blur-md"
        style={{ background: "rgba(0,0,0,0.45)" }}
      />
    </motion.div>
  );
}

// ─── Floating book stack ──────────────────────────────────────────────────────
function FloatingBookStack({ books }: { books: Book[] }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const smoothX = useSpring(rawX, { stiffness: 55, damping: 18 });
  const smoothY = useSpring(rawY, { stiffness: 55, damping: 18 });

  // ── Desktop: mouse parallax ───────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth  - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY]);

  // ── Mobile: gyroscope tilt ────────────────────────────────────────────────
  useEffect(() => {
    const onOrientation = (e: DeviceOrientationEvent) => {
      // gamma = left/right tilt (-90 → 90), beta = front/back tilt (-180 → 180)
      const gx = Math.max(-30, Math.min(30, e.gamma ?? 0)) / 30; // normalise to -1 → 1
      const gy = Math.max(-30, Math.min(30, (e.beta ?? 0) - 30)) / 30;
      rawX.set(gx);
      rawY.set(gy);
    };

    // iOS 13+ requires a permission request triggered by a user gesture.
    // We try to add the listener directly first (works on Android + older iOS).
    // If DeviceOrientationEvent.requestPermission exists we request on first touch.
    const tryListen = () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        // @ts-ignore — requestPermission is iOS-only and not in standard TS types
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        // @ts-ignore
        DeviceOrientationEvent.requestPermission()
          .then((state: string) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", onOrientation);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
      window.removeEventListener("touchstart", tryListen);
    };

    window.addEventListener("touchstart", tryListen, { once: true });

    return () => {
      window.removeEventListener("touchstart", tryListen);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [rawX, rawY]);

  // Pad to exactly 4 slots; null = not yet loaded
  const slots: (Book | null)[] = Array.from({ length: 4 }, (_, i) => books[i] ?? null);

  return (
    <div className="relative w-[320px] h-[400px] hidden lg:flex items-center justify-center flex-shrink-0">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-[80px] scale-75 pointer-events-none" />
      <div className="absolute inset-0 rounded-full bg-sky-500/8  blur-[100px] scale-50 translate-x-8 pointer-events-none" />

      {slots.map((book, i) => (
        <FloatingCard
          key={i}
          book={book}
          index={i}
          smoothX={smoothX}
          smoothY={smoothY}
        />
      ))}

      {/* "Now reading" badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-6 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/70"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Now reading
      </motion.div>

      {/* Library size badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute bottom-10 left-4 z-50 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/60"
      >
        📖 70,000+ titles
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [demoBooks, setDemoBooks]           = useState<Book[]>([]);
  const [activeDemoBook, setActiveDemoBook] = useState<Book | null>(null);
  const [booksStatus, setBooksStatus]       = useState<LoadStatus>("idle");
  const [iframeStatus, setIframeStatus]     = useState<LoadStatus>("idle");
  const [cycleIndex, setCycleIndex]         = useState(0);

  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const featuresRef    = useRef<HTMLElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });

  const globalStatus: LoadStatus =
    booksStatus === "idle"    || iframeStatus === "idle"    ? "idle"
    : booksStatus === "loading" || iframeStatus === "loading" ? "loading"
    : "ready";

  const { color, glow, label } = STATUS_CONFIG[globalStatus];

  // Cycle word
  useEffect(() => {
    const id = setInterval(() => setCycleIndex(i => (i + 1) % CYCLING_WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);

  // Fetch books
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

        {/* LEFT — copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 max-w-2xl space-y-7"
        >
          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 text-sm text-white/70 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
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

          {/* CTAs — original styles */}
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-8 pt-2 border-t border-white/[0.07]"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col pt-4">
                <span className="text-2xl font-semibold text-white tracking-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-xs text-white/40 mt-0.5">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — floating book stack */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0"
        >
          <FloatingBookStack books={demoBooks} />
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
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-amber-400/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
            <span className="ml-3 text-xs text-white/30 font-mono truncate">
              {activeDemoBook ? activeDemoBook.title : "Loading…"}
            </span>
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
      <section id="features" ref={featuresRef} className="mx-auto max-w-5xl px-4 py-24">
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
            { icon: "📖", title: "Progress tracking",     desc: "Your reading position is saved automatically across every device." },
            { icon: "✦",  title: "AI page summaries",     desc: "One tap to get a clear summary of any page without leaving the reader." },
            { icon: "🔖", title: "Favorites & bookmarks", desc: "Save any book to your library and return right where you left off." },
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