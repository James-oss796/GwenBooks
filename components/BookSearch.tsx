"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import type { Book } from "@/types";
import BookCover from "@/components/BookCover";

interface BookSearchProps {
  userId?: string;
  compactResults?: boolean;
}

export default function BookSearch({ userId, compactResults = false }: BookSearchProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  void userId;
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, "ok" | "empty" | "error">>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const canSave = sessionStatus === "authenticated" && Boolean(session?.user?.id || userId);
  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!canSave) return;
    let cancelled = false;
    fetch("/api/favorites")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && Array.isArray(data?.favorites)) setFavoriteIds(new Set(data.favorites.map((item: { bookId: string }) => item.bookId)));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [canSave]);

  const toggleFavorite = async (book: Book) => {
    if (!canSave || savingId) return;
    setSavingId(book.id);
    setFavoriteError(null);
    const alreadySaved = favoriteIds.has(book.id);
    try {
      const response = await fetch(`/api/favorites/${alreadySaved ? "remove" : "add"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl || "" }),
      });
      if (!response.ok) throw new Error("Favorite update was rejected");
      setFavoriteIds((current) => {
        const updated = new Set(current);
        if (alreadySaved) updated.delete(book.id); else updated.add(book.id);
        return updated;
      });
    } catch {
      setFavoriteError("We couldn't update your saved books. Please sign in with an approved account and try again.");
    } finally { setSavingId(null); }
  };

  const searchBooks = async () => {
    if (query.trim().length < 2) {
      setSearched(true);
      setSearchError("Enter at least two characters to search.");
      setBooks([]);
      return;
    }
    setLoading(true);
    setBooks([]);
    setSearched(false);
    setSearchError(null);
    setProviderStatus({});

    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch books");

      const data = await res.json();
      setBooks(data.results || []);
      setProviderStatus(data.providerStatus || {});
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Book search is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 🔍 Search Input + Button */}
      <form className="flex items-center gap-2 w-full max-w-2xl mx-auto" onSubmit={(event) => { event.preventDefault(); void searchBooks(); }}>
        <Input
          aria-label="Search books by title, author, subject, or ISBN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, author, subject, or ISBN"
          className="
            flex-1
            bg-white 
            text-gray-900 
            placeholder:text-gray-500 
            border border-gray-300 
            rounded-lg 
            px-4 py-2
            focus:outline-none
            focus:ring-2 focus:ring-blue-500
          "
        />
        <Button
          disabled={loading}
          loading={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* 📚 Search Results */}
      {books.length > 0 ? (
        <>
        <p className="text-sm text-gray-600" aria-live="polite">{books.length} results for “{normalizedQuery}”</p>
        {Object.values(providerStatus).some((status) => status === "error") && <p role="status" className="text-sm text-amber-800">Some book sources are temporarily unavailable, so these results may be incomplete.</p>}
        <ul className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${compactResults ? "max-h-[65vh] overflow-y-auto overscroll-contain pr-2" : ""}`}>
          {books.map((book, index) => {
            const separator = book.id.indexOf(":");
            const source = separator === -1 ? book.source : book.id.slice(0, separator);
            const id = separator === -1 ? book.id : book.id.slice(separator + 1);
            if (!source || !id) return null;
            if (book.isFullyReadable && (book.readUrl || source === "wikisource" || source === "internetarchive")) return (
              <BookCard
                key={book.id}
                id={id}
                title={book.title}
                author={book.author}
                readUrl={book.readUrl}
                genre={book.genre || source}
                coverUrl={book.coverUrl || ""}
                coverColor={book.coverColor || "#ffffff"}
                source={source as "gutenberg" | "internetarchive" | "wikisource"}
                downloadUrl={book.downloadUrl}
                downloadId={book.downloadId}
                sources={book.sources}
                isFullyReadable={book.isFullyReadable}
                sourceUrl={book.sourceUrl}
                favoriteAction={canSave ? <button type="button" disabled={savingId === book.id} aria-pressed={favoriteIds.has(book.id)} onClick={() => void toggleFavorite(book)} className="min-h-10 rounded-md border border-current/20 px-3 text-sm font-medium text-blue-700 disabled:opacity-60">{savingId === book.id ? "Saving…" : favoriteIds.has(book.id) ? "Saved · Remove" : "Save book"}</button> : <Link href="/sign-in" className="inline-flex min-h-10 items-center text-sm font-medium text-blue-700 underline underline-offset-2">Sign in to save</Link>}
                priority={index < 4}
              />
            );
            return <li key={book.id}><article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-[143/199] bg-stone-100">
                <BookCover coverColor={book.coverColor || "#f4efe6"} coverUrl={book.coverUrl || ""} title={book.title} author={book.author} className="!h-full !w-full" />
              </div>
              <div className="space-y-2 p-4">
                <h2 className="line-clamp-2 font-semibold text-gray-900">{book.title}</h2>
                {book.author && <p className="line-clamp-1 text-sm text-gray-600">{book.author}</p>}
                {book.publicationDate && <p className="text-xs text-gray-500">{book.publicationDate}{book.publisher ? ` · ${book.publisher}` : ""}</p>}
                {book.description && <p className="line-clamp-3 text-sm text-gray-700">{book.description}</p>}
                {!!book.subjects?.length && <p className="line-clamp-2 text-xs text-gray-500">{book.subjects.slice(0, 3).join(" · ")}</p>}
                <p className="text-xs font-medium text-gray-600">Sources</p>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {(book.sources?.length ? book.sources : [{ name: source || "Book catalog", url: book.sourceUrl, availability: book.availability || "source_only" }]).map((item) => <li key={`${item.name}:${item.url || ""}`}>
                    {item.url ? <a className="text-blue-700 underline underline-offset-2" href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : <span>{item.name}</span>}
                  </li>)}
                </ul>
                <p className="text-sm text-gray-700">{book.availability === "external_preview" ? "Preview on source site" : "See available formats and access options at the source."}</p>
                {!!book.formats?.length && <p className="line-clamp-2 text-xs text-gray-500">Formats: {book.formats.map((format) => format.replace(/;.*$/, "")).join(", ")}</p>}
                {book.downloadId ? <a className="inline-flex min-h-10 items-center rounded-md bg-blue-700 px-4 font-medium text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2" href={`/api/books/download?archiveId=${encodeURIComponent(book.downloadId)}`}>Download PDF</a> : book.sourceUrl && <a className="inline-flex min-h-10 items-center rounded-md border border-blue-700 px-4 font-medium text-blue-800 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2" href={book.sourceUrl} target="_blank" rel="noopener noreferrer">{source === "gutenberg" && book.formats?.length ? "Download options" : "Get this book"}<span className="sr-only"> (opens in new tab)</span></a>}
                {canSave ? <button type="button" disabled={savingId === book.id} aria-pressed={favoriteIds.has(book.id)} onClick={() => void toggleFavorite(book)} className="ml-3 inline-flex min-h-10 items-center font-medium text-blue-700 underline underline-offset-2 disabled:opacity-60">{savingId === book.id ? "Saving…" : favoriteIds.has(book.id) ? "Saved · Remove" : "Save book"}</button> : <Link href="/sign-in" className="ml-3 inline-flex min-h-10 items-center font-medium text-blue-700 underline underline-offset-2">Sign in to save</Link>}
              </div>
            </article></li>;
          })}
        </ul>
        {favoriteError && <p role="alert" className="text-sm text-red-700">{favoriteError}</p>}
        </>
      ) : (
        !loading && searchError ? (
          <p role="alert" className="text-center text-red-600 text-sm mt-6">
            {searchError}
          </p>
        ) : !loading && searched ? (
          <div className="text-center text-gray-600 text-sm mt-6" role="status">
            <p>No matching books found. Try another title, author, or ISBN.</p>
            {Object.values(providerStatus).some((status) => status === "error") && <p className="mt-2">Some book sources are temporarily unavailable; results may be incomplete.</p>}
          </div>
        ) : !loading && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Search book metadata across Open Library, Google Books (when configured), Project Gutenberg, and Wikisource. Source availability is shown for each result.
          </p>
        )
      )}
    </div>
  );
}
