"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TocItem = { label: string; href: string; subitems?: TocItem[] };
type Props = { url: string; initialLocation: number; onLocationChange: (location: number) => void; theme: "light" | "dark"; fontSize: number };

export default function EpubReader({ url, initialLocation, onLocationChange, theme, fontSize }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);
  const locationChangeRef = useRef(onLocationChange);
  const initialLocationRef = useRef(initialLocation);
  locationChangeRef.current = onLocationChange;
  initialLocationRef.current = initialLocation;

  const applyTheme = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    rendition.themes.default({
      body: {
        color: theme === "dark" ? "#e8e2d8 !important" : "#29251f !important",
        background: theme === "dark" ? "#171614 !important" : "#fffaf1 !important",
        "font-size": `${fontSize}px !important`,
        "line-height": "1.8 !important",
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "max-width": "42rem !important",
        margin: "0 auto !important",
      },
      "p, li": { "line-height": "1.8 !important" },
    });
  }, [fontSize, theme]);

  useEffect(() => {
    let active = true;
    let rendition: any;
    let book: any;
    async function openBook() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 403 ? "You do not have access to this book." : "The uploaded EPUB could not be downloaded.");
        const bytes = await response.arrayBuffer();
        const { default: ePub } = await import("epubjs");
        book = ePub(bytes);
        bookRef.current = book;
        await book.ready;
        if (!active || !rootRef.current) return;
        setToc((book.navigation?.toc || []).map((item: TocItem) => item));
        const locations = await book.locations.generate(1000);
        if (!active) return;
        setTotalLocations(book.locations.length() || locations?.length || 0);
        rendition = book.renderTo(rootRef.current, {
          width: "100%", height: "min(72vh, 900px)", flow: "paginated", spread: "none", allowScriptedContent: false,
        });
        renditionRef.current = rendition;
        applyTheme();
        rendition.on("relocated", (current: { start?: { location?: number } }) => {
          const next = Number(current.start?.location || 0);
          setLocation(next);
          locationChangeRef.current(next);
        });
        const restoredLocation = initialLocationRef.current;
        const cfi = restoredLocation > 0 ? book.locations.cfiFromLocation(restoredLocation) : undefined;
        await rendition.display(cfi || undefined);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "This EPUB could not be opened. It may be damaged or encrypted.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void openBook();
    return () => {
      active = false;
      rendition?.destroy?.();
      book?.destroy?.();
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [url]);

  useEffect(() => { applyTheme(); }, [applyTheme]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") { event.preventDefault(); void renditionRef.current?.next(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); void renditionRef.current?.prev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const openChapter = (href: string) => { void renditionRef.current?.display(href); };
  const percentage = totalLocations ? Math.min(100, Math.round((location / totalLocations) * 100)) : 0;

  return (
    <section aria-label="EPUB reader" className={`overflow-hidden rounded-xl border ${theme === "dark" ? "border-white/10 bg-[#171614]" : "border-stone-200 bg-[#fffaf1]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 p-3 sm:px-5">
        <details className="relative">
          <summary className="cursor-pointer rounded border px-3 py-2 text-sm">Contents</summary>
          <nav aria-label="Table of contents" className="absolute left-0 top-full z-20 mt-2 max-h-[60vh] w-72 overflow-auto rounded-lg border bg-white p-3 text-slate-900 shadow-xl">
            {toc.length ? <ol className="space-y-1">{toc.map((item, index) => <li key={`${item.href}-${index}`}><button type="button" onClick={() => openChapter(item.href)} className="w-full rounded px-2 py-2 text-left text-sm hover:bg-stone-100">{item.label}</button>{item.subitems?.length ? <ol className="ml-3 border-l pl-2">{item.subitems.map((child, childIndex) => <li key={`${child.href}-${childIndex}`}><button type="button" onClick={() => openChapter(child.href)} className="w-full px-2 py-1 text-left text-xs hover:underline">{child.label}</button></li>)}</ol> : null}</li>)}</ol> : <p className="text-sm text-slate-500">This EPUB does not include a table of contents.</p>}
          </nav>
        </details>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void renditionRef.current?.prev()} className="rounded border px-3 py-2" aria-label="Previous section">Previous</button>
          <button type="button" onClick={() => void renditionRef.current?.next()} className="rounded border px-3 py-2" aria-label="Next section">Next</button>
        </div>
        <p aria-live="polite" className="min-w-20 text-right text-sm text-stone-500">{percentage}% read</p>
      </div>
      <div className="relative px-2 py-3 sm:px-5">
        {loading && <p role="status" className="absolute inset-0 z-10 grid place-items-center bg-white/75 text-sm text-slate-700">Opening EPUB…</p>}
        {error && <p role="alert" className="grid min-h-[55vh] place-items-center px-6 text-center text-red-800">{error}</p>}
        <div ref={rootRef} className="min-h-[55vh] w-full" />
      </div>
      <div className="h-1.5 bg-black/10" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
        <div className="h-full bg-amber-500 transition-[width]" style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}
