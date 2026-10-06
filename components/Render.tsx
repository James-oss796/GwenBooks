// components/Reader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  FiMenu,
} from "react-icons/fi";
import { Download } from "lucide-react";
import UploadedBookReader from "@/components/UploadedBookReader";

type BookMeta = {
  id: string;
  title: string;
  source?: "gutenberg" | "internetarchive" | "wikisource" | "uploaded";
  author?: string;
  coverUrl?: string | null;
  fileType?: "pdf" | "epub";
  sourceUrl?: string;
};

type Chapter = { title: string; page: number };

type Props = {
  book: BookMeta;
  pages: string[];
  chapters?: Chapter[];
  uploadedFile?: { type: "pdf" | "epub"; url: string };
};

export default function Reader({ book, pages, chapters = [], uploadedFile }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [currentChapter, setCurrentChapter] = useState<number>(0);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileToggle, setShowMobileToggle] = useState(true);

  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileToggleInactivityRef = useRef<NodeJS.Timeout | null>(null);

  const contentRef = useRef<HTMLDivElement | null>(null);

  const localKeyProgress = `read:${book.id}:progress`;
  const localKeyFont = `read:${book.id}:font`;
  const localKeyTheme = `read:${book.id}:theme`;
  const localKeyFav = `read:${book.id}:fav`;
  const savedBookId = book.id.includes(":") ? book.id : `${book.source || "gutenberg"}:${book.id}`;

  useEffect(() => {
    let active = true;
    const p = localStorage.getItem(localKeyProgress);
    const f = localStorage.getItem(localKeyFont);
    const t = localStorage.getItem(localKeyTheme);
    const fav = localStorage.getItem(localKeyFav);

    if (uploadedFile) {
      setProgressLoaded(true);
      return () => { active = false; };
    }
    if (p) {
      const savedPage = Number(p);
      if (Number.isFinite(savedPage)) setPageIndex(Math.max(1, Math.min(savedPage + 1, pages.length)));
    }
    if (f) {
      const savedFontSize = Number(f);
      if (Number.isFinite(savedFontSize)) setFontSize(Math.max(12, Math.min(28, savedFontSize)));
    }
    if (t === "dark") setTheme("dark");
    if (fav === "true") setIsFavorite(true);
    async function restoreServerProgress() {
      try {
        const response = await fetch(`/api/progress/save?bookId=${encodeURIComponent(savedBookId)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const saved = data.progress?.pageIndex;
        if (active && Number.isSafeInteger(saved) && saved >= 0) {
          localStorage.setItem(localKeyProgress, String(saved));
          setPageIndex(Math.max(1, Math.min(saved + 1, pages.length)));
        }
      } catch {
        // Device storage remains available if account progress cannot be loaded.
      } finally { if (active) setProgressLoaded(true); }
    }
    void restoreServerProgress();
    return () => { active = false; };
  }, [book.id, pages.length, uploadedFile, savedBookId, localKeyProgress]);

  useEffect(() => {
    if (!progressLoaded || uploadedFile) return;
    const savedPage = Math.max(0, pageIndex - 1);
    localStorage.setItem(localKeyProgress, String(savedPage));
    fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: savedBookId, pageIndex: savedPage, title: book.title, author: book.author, coverUrl: book.coverUrl }),
    }).catch(() => {});
  }, [pageIndex, savedBookId, progressLoaded, uploadedFile, book.title, book.author, book.coverUrl]);

  useEffect(() => localStorage.setItem(localKeyFont, String(fontSize)), [fontSize]);

  useEffect(() => {
    localStorage.setItem(localKeyTheme, theme);
    document.documentElement.classList.toggle("light-theme", theme === "light");
  }, [theme]);

  useEffect(() => localStorage.setItem(localKeyFav, String(isFavorite)), [isFavorite]);

  useEffect(() => {
    const resetTimer = () => {
      setShowMobileToggle(true);
      if (mobileToggleInactivityRef.current) clearTimeout(mobileToggleInactivityRef.current);
      mobileToggleInactivityRef.current = setTimeout(() => {
        if (!showMobileMenu) setShowMobileToggle(false);
      }, 2000);
    };

    resetTimer();
    const ref = contentRef.current;
    ref?.addEventListener("scroll", resetTimer);
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    return () => {
      if (mobileToggleInactivityRef.current) clearTimeout(mobileToggleInactivityRef.current);
      ref?.removeEventListener("scroll", resetTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [showMobileMenu]);

  useEffect(() => {
    if (!showMobileMenu) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    const handleScroll = () => setShowMobileMenu(false);
    document.addEventListener("mousedown", handleOutsideClick);
    contentRef.current?.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      contentRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, [showMobileMenu]);

  const progressPct = useMemo(
    () => Math.round((pageIndex / Math.max(1, pages.length)) * 100),
    [pageIndex, pages.length]
  );

  const handleNext = () => {
    setPageIndex((current) => Math.min(current + 1, pages.length));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setPageIndex((current) => Math.max(current - 1, 0));
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const increaseFont = () => setFontSize((size) => Math.min(28, size + 1));
  const decreaseFont = () => setFontSize((size) => Math.max(12, size - 1));

  const toggleFavorite = async () => {
    setSavingFavorite(true);
    setIsFavorite((v) => !v);
    try {
      await fetch(`/api/favorites/${!isFavorite ? "add" : "remove"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: savedBookId,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
        }),
      });
    } catch (e) {
      console.warn("favorite toggle failed", e);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    const sourcePrefixedId = book.id.includes(":")
      ? book.id
      : `${book.source || "gutenberg"}:${book.id}`;
    const shareLink = `${window.location.origin}/read/${encodeURIComponent(sourcePrefixedId)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: `Reading ${book.title}`,
          url: shareLink,
        });
      } else {
        await navigator.clipboard.writeText(shareLink);
        alert("Link copied to clipboard");
      }
    } catch {
    } finally {
      setSharing(false);
    }
  };

  const downloadAsPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      let y = 20;
      let coverAdded = false;

      if (book.coverUrl) {
        try {
          const optimizedCover = `/_next/image?url=${encodeURIComponent(book.coverUrl)}&w=384&q=85`;
          const coverImage = new window.Image();
          coverImage.src = optimizedCover;
          await coverImage.decode();
          const canvas = document.createElement("canvas");
          canvas.width = 480;
          canvas.height = 720;
          const context = canvas.getContext("2d");
          context?.drawImage(coverImage, 0, 0, canvas.width, canvas.height);
          if (context) {
            const coverData = canvas.toDataURL("image/jpeg", 0.9);
            pdf.addImage(coverData, "JPEG", 35, 24, 140, 210);
            coverAdded = true;
          }
        } catch {
          // Some catalog records have no usable cover image.
        }
      }

      if (!coverAdded) {
        pdf.setFillColor(37, 56, 140);
        pdf.rect(0, 0, 210, 297, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.text(pdf.splitTextToSize(book.title, 150), 105, 125, { align: "center" });
        if (book.author) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(14);
          pdf.text(pdf.splitTextToSize(book.author, 150), 105, 160, { align: "center" });
        }
      }

      pdf.addPage();
      y = 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(pdf.splitTextToSize(book.title, 180), 15, y);
      y += 12;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      if (book.author) {
        pdf.text(pdf.splitTextToSize(`by ${book.author}`, 180), 15, y);
        y += 10;
      }

      for (const page of pages) {
        const lines = pdf.splitTextToSize(page, 180);
        for (const line of lines) {
          if (y > 280) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(line, 15, y);
          y += 5;
        }
        y += 5;
      }

      const safeTitle = book.title.replace(/[\\/:*?"<>|]/g, "-").trim() || "book";
      pdf.save(`${safeTitle}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Could not create the PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

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

  useEffect(() => {
    if (!chapters.length) return;
    let current = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (pageIndex - 1 >= chapters[i].page) current = i;
      else break;
    }
    setCurrentChapter(current);
  }, [pageIndex, chapters]);

  if (uploadedFile && book.source === "uploaded") {
    return <UploadedBookReader book={{ id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl || undefined, fileType: uploadedFile.type }} fileUrl={uploadedFile.url} />;
  }

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-[#0a0a0a] text-gray-100" : "bg-[#fff7e8] text-gray-900"}`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <div className="h-1 bg-black/20">
    <div
  className="h-1 bg-amber-400 transition-all"
  style={{ width: `${progressPct}%` }}
    />

        </div>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-wrap justify-between gap-3 items-start">
        <div>
          {/* <button onClick={() => history.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
            ← Back
          </button> */}
          <div className="mt-2">
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            <p className="text-sm text-gray-500">{book.author}</p>
            {book.sourceUrl && <a href={book.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-blue-700 underline underline-offset-2">Source: {book.source === "wikisource" ? "Wikisource" : book.source === "internetarchive" ? "Internet Archive" : "Book provider"}</a>}
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
          <button title="Share" onClick={handleShare} disabled={sharing} className="p-2 rounded bg-black/10 hover:bg-black/20 disabled:opacity-60">
            <FiShare2 />
          </button>
          <button title={downloadingPdf ? "Preparing PDF" : "Download book as PDF"} onClick={downloadAsPdf} disabled={downloadingPdf} className="p-2 rounded bg-black/10 hover:bg-black/20 disabled:opacity-60">
            <Download />
          </button>
          <button title="Favorite" onClick={toggleFavorite} disabled={savingFavorite} className={`p-2 rounded disabled:opacity-60 ${isFavorite ? "bg-amber-400 text-black" : "bg-black/10 hover:bg-black/20"}`}>
            <FiHeart />
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      {chapters.length > 0 && (
        <div className="max-w-4xl mx-auto my-6 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-3">Table of Contents</h2>
          <ul className="list-disc pl-5 space-y-2">
            {chapters.map((ch, i) => (
              <li key={`${ch.title}-${ch.page}`}>
                <button
                  className={`hover:underline ${i === currentChapter ? "font-bold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                  onClick={() => {
                    setPageIndex(ch.page + 1);
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
      <div className="mx-auto w-full max-w-6xl px-2 py-4 sm:px-6 sm:py-6">
        <div ref={contentRef} className="w-full rounded-2xl px-4 py-5 sm:px-8 sm:py-8 shadow-xl transition-all overflow-y-auto max-h-[80vh]">
          {pageIndex === 0 ? (
            <section className="mx-auto grid min-h-[58vh] w-full max-w-4xl grid-cols-1 items-center gap-8 py-6 sm:grid-cols-[minmax(180px,260px)_1fr] sm:gap-12">
              <div className="relative mx-auto aspect-[2/3] w-[min(58vw,240px)] max-h-[48vh] overflow-hidden rounded-md bg-black/10 shadow-xl ring-1 ring-black/10">
                {book.coverUrl && !coverFailed ? (
                  <Image
                    src={book.coverUrl}
                    alt={`${book.title} book cover`}
                    fill
                    sizes="(max-width: 640px) 58vw, 260px"
                    priority
                    className="object-contain"
                    onError={() => setCoverFailed(true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#25388C] to-[#17244f] p-5 text-center text-white">
                    <span className="line-clamp-5 text-lg font-semibold">{book.title}</span>
                  </div>
                )}
              </div>
              <div className="mx-auto max-w-xl text-center sm:text-left">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-700">Book cover</p>
                <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{book.title}</h2>
                {book.author && <p className="mt-3 text-base text-gray-500">{book.author}</p>}
                <p className="mt-6 text-sm text-gray-500">{pages.length} reading pages</p>
              </div>
            </section>
          ) : (
            <div
              className="mx-auto w-full max-w-5xl whitespace-pre-wrap break-words text-left leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              {pages[pageIndex - 1]}
            </div>
          )}

        </div>
      </div>

      {/* Floating Next/Prev Buttons */}
      <AnimatePresence>
        {showNav && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
            <button onClick={handlePrev} className="px-4 py-2 bg-black/40 rounded hover:bg-black/60" disabled={pageIndex === 0}>
              <FiChevronLeft size={18} /> Prev
            </button>
            <button onClick={handleNext} className="px-4 py-2 bg-black/40 rounded hover:bg-black/60" disabled={pageIndex === pages.length}>
              Next <FiChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    {/* Mobile Floating Toolbar */}
<div ref={mobileMenuRef} className="sm:hidden fixed bottom-5 right-5 flex flex-col items-end gap-3 z-50">
  <AnimatePresence>
    {showMobileMenu && (
      <>
        {[
          { onClick: handleShare, icon: <FiShare2 />, title: "Share", disabled: sharing },
          { onClick: downloadAsPdf, icon: <Download />, title: "Download book as PDF", disabled: downloadingPdf },
          {
            onClick: toggleFavorite,
            icon: <FiHeart />,
            title: "Favorite",
            disabled: savingFavorite,
            className: isFavorite ? "bg-amber-400 text-black" : "bg-black/70 text-white",
          },
          { onClick: decreaseFont, icon: <FiMinus />, title: "Decrease font" },
          { onClick: increaseFont, icon: <FiPlus />, title: "Increase font" },
          {
            onClick: () => setTheme(t => (t === "dark" ? "light" : "dark")),
            icon: theme === "dark" ? <FiSun /> : <FiMoon />,
            title: "Toggle theme",
          },
        ].map((btn, i) => (
          <motion.button
            key={btn.title}
            initial={{ opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.85 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 22 }}
            onClick={btn.onClick}
            disabled={btn.disabled}
            title={btn.title}
            className={`relative p-3 rounded-full shadow-lg ${btn.className ?? "bg-black/70 text-white"}`}
          >
            {btn.icon}
          </motion.button>
        ))}
      </>
    )}
  </AnimatePresence>

  {/* Toggle button — disappears after inactivity like prev/next */}
  <AnimatePresence>
    {showMobileToggle && (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowMobileMenu(v => !v)}
        title="Toggle toolbar"
        className={`p-3 rounded-full shadow-xl transition-transform ${
          showMobileMenu ? "bg-amber-400 text-black rotate-45" : "bg-black/70 text-white"
        }`}
      >
        {
          showMobileMenu ? <FiX size={20} /> : <FiMenu size={20} />
        }
      </motion.button>
    )}
  </AnimatePresence>
</div>

    </div>
  );
}
