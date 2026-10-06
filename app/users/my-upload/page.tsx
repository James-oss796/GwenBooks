"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import { Button } from "@/components/ui/button";

type UploadRow = {
  id: number; title: string; author: string | null; description: string | null; coverUrl: string | null;
  fileType: string | null; fileSize: number | null; isPublic: boolean | null; requestedPublic: boolean;
  status: string | null; createdAt: string | null;
};

function UploadCards({ title, uploads }: { title: string; uploads: UploadRow[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}<span className="ml-2 text-sm font-normal text-slate-500">{uploads.length}</span></h2>
      {uploads.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{uploads.map((book) => (
        <li key={book.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <BookCover variant="small" coverColor="#d9e2ef" coverUrl={book.coverUrl || ""} title={book.title} author={book.author || undefined} className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="line-clamp-2 font-semibold text-slate-900">{book.title}</h3>
            <p className="mt-1 truncate text-sm text-slate-600">{book.author || "Unknown author"}</p>
            <p className="mt-2 text-xs text-slate-500">{book.fileType?.toUpperCase() || "Book"}{book.fileSize ? ` · ${(book.fileSize / 1024 / 1024).toFixed(1)} MB` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{book.isPublic ? "Public" : "Private"}</span>
              {book.status !== "APPROVED" && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-900">{book.status === "REJECTED" ? "Review needed" : "Pending review"}</span>}
            </div>
            <Button asChild className="mt-auto pt-4" variant="link"><Link href={`/read/uploaded%3A${book.id}`}>Read book</Link></Button>
          </div>
        </li>
      ))}</ul> : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No books in this section yet.</p>}
    </section>
  );
}

export default function MyUploadsPage() {
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadUploads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user/books/uploads", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your books could not be loaded.");
      setUploads(Array.isArray(data.uploads) ? data.uploads : []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your books could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadUploads(); }, [loadUploads]);

  const privateBooks = uploads.filter((book) => !book.isPublic);
  const publicBooks = uploads.filter((book) => book.isPublic);

  return (
    <main className="mx-auto max-w-6xl space-y-9 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium uppercase tracking-[0.16em] text-blue-700">Personal library</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">My uploaded books</h1><p className="mt-2 max-w-2xl text-slate-600">Your private collection and books approved for sharing, in one place.</p></div>
        <Button asChild><Link href="/users/upload">Upload a book</Link></Button>
      </header>
      {loading ? <p role="status" className="py-8 text-center text-slate-500">Loading your library…</p> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}<button type="button" onClick={() => void loadUploads()} className="ml-3 underline">Try again</button></div> : <>
        <UploadCards title="Private books" uploads={privateBooks} />
        <UploadCards title="Public books" uploads={publicBooks} />
      </>}
    </main>
  );
}
