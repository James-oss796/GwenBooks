"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type Props = { url: string; title: string; initialPage: number; onPageChange: (pageIndex: number) => void; theme: "light" | "dark" };

export default function PdfReader({ url, title, initialPage, onPageChange, theme }: Props) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(760);
  const [error, setError] = useState("");
  const frameRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width - 32)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pages || restoredRef.current) return;
    const restored = Math.max(1, Math.min(pages, initialPage + 1));
    setPage(restored);
    restoredRef.current = true;
  }, [pages, initialPage]);

  useEffect(() => { if (pages && restoredRef.current) onPageChange(page - 1); }, [page, pages, onPageChange]);

  const step = (delta: number) => setPage((current) => Math.max(1, Math.min(pages, current + delta)));
  const fullscreen = async () => {
    if (!frameRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await frameRef.current.requestFullscreen();
  };

  return (
    <section aria-label={`${title} PDF reader`} className={`rounded-xl border ${theme === "dark" ? "border-white/10 bg-[#151515]" : "border-stone-200 bg-white"}`}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-current/10 px-3 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setScale((value) => Math.max(0.6, value - 0.1))} aria-label="Zoom out" className="rounded border px-3 py-2">−</button>
          <span aria-live="polite" className="min-w-14 text-center text-sm">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((value) => Math.min(2, value + 0.1))} aria-label="Zoom in" className="rounded border px-3 py-2">+</button>
          <button type="button" onClick={() => setScale(1)} className="rounded border px-3 py-2 text-sm">Fit width</button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} disabled={page <= 1} className="rounded border px-3 py-2 disabled:opacity-40" aria-label="Previous page">Previous</button>
          <label className="flex items-center gap-2 text-sm"><span className="sr-only">Page number</span><input aria-label="Page number" type="number" min={1} max={pages || undefined} value={page} onChange={(event) => setPage(Math.max(1, Math.min(pages || 1, Number(event.target.value) || 1)))} className="w-16 rounded border bg-transparent px-2 py-1" /> <span>of {pages || "—"}</span></label>
          <button type="button" onClick={() => step(1)} disabled={!pages || page >= pages} className="rounded border px-3 py-2 disabled:opacity-40" aria-label="Next page">Next</button>
          <button type="button" onClick={() => void fullscreen()} className="rounded border px-3 py-2 text-sm">Fullscreen</button>
        </div>
      </div>
      <div ref={frameRef} className="min-h-[60vh] overflow-auto p-3 sm:p-6">
        <Document file={url} onLoadSuccess={({ numPages }) => { setPages(numPages); setError(""); }} onLoadError={() => setError("This PDF could not be opened. It may be damaged or password protected.")} loading={<p role="status" className="py-20 text-center">Opening PDF…</p>} error={<p role="alert" className="py-20 text-center">{error || "This PDF could not be opened."}</p>}>
          <Page pageNumber={page} width={Math.round(width * scale)} renderTextLayer renderAnnotationLayer className="mx-auto shadow-md" />
        </Document>
      </div>
      <div className="h-1.5 bg-black/10" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pages ? Math.round((page / pages) * 100) : 0}>
        <div className="h-full bg-amber-500 transition-[width]" style={{ width: `${pages ? (page / pages) * 100 : 0}%` }} />
      </div>
    </section>
  );
}
