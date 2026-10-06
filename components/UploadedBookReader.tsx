"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiHeart, FiMaximize, FiMinus, FiMoon, FiPlus, FiSun } from "react-icons/fi";
import PdfReader from "@/components/readers/PdfReader";
import EpubReader from "@/components/readers/EpubReader";

type Props = { book: { id: string; title: string; author?: string; coverUrl?: string; fileType: "pdf" | "epub" }; fileUrl: string };

export default function UploadedBookReader({ book, fileUrl }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [restored, setRestored] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [favorite, setFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const shellRef = useRef<HTMLElement>(null);
  const progressKey = `read:${book.id}:progress`;

  useEffect(() => {
    let active = true;
    const local = Number(localStorage.getItem(progressKey) || 0);
    if (Number.isSafeInteger(local) && local >= 0) setPageIndex(local);
    async function restore() {
      try {
        const [progressResponse, favoritesResponse] = await Promise.all([
          fetch(`/api/progress/save?bookId=${encodeURIComponent(book.id)}`, { cache: "no-store" }),
          fetch("/api/favorites", { cache: "no-store" }),
        ]);
        if (!active) return;
        if (progressResponse.ok) {
          const data = await progressResponse.json();
          if (Number.isSafeInteger(data.progress?.pageIndex) && data.progress.pageIndex >= 0) setPageIndex(data.progress.pageIndex);
        }
        if (favoritesResponse.ok) {
          const data = await favoritesResponse.json();
          setFavorite(Array.isArray(data.favorites) && data.favorites.some((entry: { bookId: string }) => entry.bookId === book.id));
        }
      } catch {
        if (active) setFavoriteError("Saved reading position could not be synced. You can continue reading on this device.");
      } finally { if (active) setRestored(true); }
    }
    void restore();
    return () => { active = false; };
  }, [book.id, progressKey]);

  const savePosition = useCallback((next: number) => {
    setPageIndex(next);
    localStorage.setItem(progressKey, String(next));
    if (!restored) return;
    fetch("/api/progress/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: book.id, pageIndex: next, title: book.title, author: book.author, coverUrl: book.coverUrl }),
    }).catch(() => setFavoriteError("Reading position could not sync. It remains saved on this device."));
  }, [book.id, progressKey, restored]);

  const toggleFavorite = async () => {
    setSavingFavorite(true);
    setFavoriteError("");
    const next = !favorite;
    try {
      const response = await fetch(`/api/favorites/${next ? "add" : "remove"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl }),
      });
      if (!response.ok) throw new Error("Your saved books could not be updated.");
      setFavorite(next);
    } catch (error) { setFavoriteError(error instanceof Error ? error.message : "Your saved books could not be updated."); }
    finally { setSavingFavorite(false); }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch { setFavoriteError("Fullscreen is not available in this browser."); }
  };

  return (
    <main ref={shellRef} className={`min-h-screen px-3 pb-6 pt-5 sm:px-6 ${theme === "dark" ? "bg-[#10100f] text-stone-100" : "bg-[#f7f4ee] text-stone-900"}`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/users/my-upload" className="text-sm text-blue-700 underline underline-offset-4">My library</Link>
            <h1 className="mt-1 truncate text-xl font-semibold sm:text-2xl">{book.title}</h1>
            {book.author && <p className="text-sm text-current/60">{book.author}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {book.fileType === "epub" && <>
              <button type="button" onClick={() => setFontSize((size) => Math.max(14, size - 1))} aria-label="Decrease text size" className="rounded border border-current/20 p-2"><FiMinus /></button>
              <button type="button" onClick={() => setFontSize((size) => Math.min(30, size + 1))} aria-label="Increase text size" className="rounded border border-current/20 p-2"><FiPlus /></button>
            </>}
            <button type="button" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="rounded border border-current/20 p-2">{theme === "dark" ? <FiSun /> : <FiMoon />}</button>
            <button type="button" onClick={() => void toggleFullscreen()} aria-label="Toggle fullscreen" className="rounded border border-current/20 p-2"><FiMaximize /></button>
            <button type="button" onClick={() => void toggleFavorite()} disabled={savingFavorite} aria-pressed={favorite} aria-label={favorite ? "Remove from saved books" : "Save book"} className={`rounded border border-current/20 p-2 ${favorite ? "text-rose-600" : ""}`}><FiHeart /></button>
          </div>
        </header>
        {favoriteError && <p role="status" className="mb-3 text-sm text-amber-700">{favoriteError}</p>}
        {book.fileType === "pdf" ? <PdfReader url={fileUrl} title={book.title} initialPage={pageIndex} onPageChange={savePosition} theme={theme} /> : <EpubReader url={fileUrl} initialLocation={pageIndex} onLocationChange={savePosition} theme={theme} fontSize={fontSize} />}
      </div>
    </main>
  );
}
