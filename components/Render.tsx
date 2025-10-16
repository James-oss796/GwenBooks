// components/Reader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSun,
  FiMoon,
  FiShare2,
  FiHeart,
  FiPlus,
  FiMinus,
  FiX,
  FiBookOpen,
} from "react-icons/fi";

type BookMeta = {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string | null;
};

type Chapter = { title: string; page: number };

type Props = {
  book: BookMeta;
  pages: string[];
  chapters?: Chapter[]; // optional table of contents
};

export default function Reader({ book, pages, chapters = [] }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [currentChapter, setCurrentChapter] = useState<number>(0);

  const contentRef = useRef<HTMLDivElement | null>(null);

  const localKeyProgress = `read:${book.id}:progress`;
  const localKeyFont = `read:${book.id}:font`;
  const localKeyTheme = `read:${book.id}:theme`;
  const localKeyFav = `read:${book.id}:fav`;

  // restore state
  useEffect(() => {
    const p = localStorage.getItem(localKeyProgress);
    const f = localStorage.getItem(localKeyFont);
    const t = localStorage.getItem(localKeyTheme);
    const fav = localStorage.getItem(localKeyFav);

    if (p) setPageIndex(Number(p));
    if (f) setFontSize(Number(f));
    if (t === "dark") setTheme("dark");
    if (fav === "true") setIsFavorite(true);
  }, [book.id]);

  // persist state
  useEffect(() => {
    localStorage.setItem(localKeyProgress, String(pageIndex));
    fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, pageIndex }),
    }).catch(() => {});
  }, [pageIndex, book.id]);

  useEffect(() => localStorage.setItem(localKeyFont, String(fontSize)), [fontSize]);

  useEffect(() => {
    localStorage.setItem(localKeyTheme, theme);
    document.documentElement.classList.toggle("light-theme", theme === "light");
  }, [theme]);

  useEffect(() => localStorage.setItem(localKeyFav, String(isFavorite)), [isFavorite]);

  const progressPct = useMemo(
    () => Math.round(((pageIndex + 1) / pages.length) * 100),
    [pageIndex, pages.length]
  );

  const handleNext = () => {
    setPageIndex((p) => Math.min(p + 1, pages.length - 1));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setPageIndex((p) => Math.max(p - 1, 0));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const increaseFont = () => setFontSize((s) => Math.min(28, s + 1));
  const decreaseFont = () => setFontSize((s) => Math.max(12, s - 1));

  const toggleFavorite = async () => {
    setIsFavorite((v) => !v);
    try {
      await fetch(`/api/favorites/${!isFavorite ? "add" : "remove"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
        }),
      });
    } catch (e) {
      console.warn("favorite toggle failed", e);
    }
  };

  const handleShare = async () => {
    const shareLink = `${window.location.origin}/read/${book.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `Reading ${book.title}`,
          url: shareLink,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard");
    }
  };

  const openSummary = async () => {
    setShowSummaryModal(true);
    setLoadingSummary(true);
    setSummary(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pages[pageIndex] }),
      });
      const data = await res.json();
      setSummary(data.summary ?? "No summary available.");
    } catch {
      setSummary("Failed to summarize. Try again later.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // auto-hide navigation on scroll
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      setShowNav(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowNav(false), 2000);
    };
    const ref = contentRef.current;
    ref?.addEventListener("scroll", handleScroll);
    return () => ref?.removeEventListener("scroll", handleScroll);
  }, []);

  // highlight current chapter based on pageIndex
  useEffect(() => {
    if (!chapters.length) return;
    let current = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (pageIndex >= chapters[i].page) current = i;
      else break;
    }
    setCurrentChapter(current);
  }, [pageIndex, chapters]);

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-[#0a0a0a] text-gray-100" : "bg-[#fff7e8] text-gray-900"}`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <div className="h-1 bg-black/20">
          <div className="h-1 bg-amber-400 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-6 flex flex-wrap justify-between gap-3 items-start">
        <div>
          <button onClick={() => history.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
            ← Back
          </button>
          <div className="mt-2">
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            <p className="text-sm text-gray-500">{book.author}</p>
          </div>
        </div>

        {/* Toolbar - Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button title="Decrease font" onClick={decreaseFont} className="p-2 rounded bg-black/10 hover:bg-black/20">
            <FiMinus />
          </button>
          <button title="Increase font" onClick={increaseFont} className="p-2 rounded bg-black/10 hover:bg-black/20">
            <FiPlus />
          </button>
          <button title="Toggle theme" onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))} className="p-2 rounded bg-black/10 hover:bg-black/20">
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          <button title="Share" onClick={handleShare} className="p-2 rounded bg-black/10 hover:bg-black/20">
            <FiShare2 />
          </button>
          <button title="Favorite" onClick={toggleFavorite} className={`p-2 rounded ${isFavorite ? "bg-amber-400 text-black" : "bg-black/10 hover:bg-black/20"}`}>
            <FiHeart />
          </button>
          <button title="Summarize current page" onClick={openSummary} className="p-2 rounded bg-black/10 hover:bg-black/20">
            AI
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      {chapters.length > 0 && (
        <div className="max-w-4xl mx-auto my-6 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-3">Table of Contents</h2>
          <ul className="list-disc pl-5 space-y-2">
            {chapters.map((ch, i) => (
              <li key={i}>
                <button
                  className={`hover:underline ${i === currentChapter ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                  onClick={() => {
                    setPageIndex(ch.page);
                    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {ch.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reader */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div ref={contentRef} className="rounded-2xl p-6 sm:p-8 shadow-xl transition-all overflow-y-auto max-h-[80vh]">
          <div className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
            {pages[pageIndex]}
          </div>
        </div>
      </div>

      {/* Floating Next/Prev Buttons */}
      <AnimatePresence>
        {showNav && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
            <button onClick={handlePrev} className="px-4 py-2 bg-black/40 rounded hover:bg-black/60" disabled={pageIndex === 0}>
              <FiChevronLeft size={18} /> Prev
            </button>
            <button onClick={handleNext} className="px-4 py-2 bg-black/40 rounded hover:bg-black/60" disabled={pageIndex === pages.length - 1}>
              Next <FiChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Toolbar */}
      <div className="sm:hidden fixed bottom-5 right-5 flex flex-col gap-3 z-50">
        <button onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))} className="p-3 rounded-full bg-black/70 text-white" title="Toggle theme">
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>
        <button onClick={increaseFont} className="p-3 rounded-full bg-black/70 text-white" title="Increase font">
          <FiPlus />
        </button>
        <button onClick={decreaseFont} className="p-3 rounded-full bg-black/70 text-white" title="Decrease font">
          <FiMinus />
        </button>
        <button onClick={toggleFavorite} className={`p-3 rounded-full ${isFavorite ? "bg-amber-400 text-black" : "bg-black/70 text-white"}`} title="Favorite">
          <FiHeart />
        </button>
        <button onClick={openSummary} className="p-3 rounded-full bg-black/70 text-white" title="Summarize current page">
          <FiBookOpen />
        </button>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-xl p-6 relative">
              <button type="button" onClick={() => setShowSummaryModal(false)} className="absolute top-4 right-4 p-2 rounded bg-black/10" aria-label="Close summary modal" title="Close">
                <FiX aria-hidden="true" />
              </button>
              <h3 className="text-xl font-semibold mb-3">Summary — current page</h3>
              {loadingSummary ? <div>Summarizing…</div> : <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{summary}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
