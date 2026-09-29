import React from "react";
import Reader from "@/components/Render"; // ✅ Use your actual Reader component filename
import Image from "next/image";
import Link from "next/link";
import { fetchBookBySource } from "@/lib/fetchBooks";
import { fetchFallbackPDF } from "@/lib/fetchFallbackPDF";
import BookNotFound from "@/components/BookNotFound"; // ✅ Your styled not-found page

type ReadPageProps = {
  params: { id: string };
};

function chunkTextIntoPages(text: string, approxCharsPerPage = 4000) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pages: string[] = [];
  let buffer = "";

  for (const p of paragraphs) {
    if ((buffer + "\n\n" + p).length > approxCharsPerPage && buffer.length > 0) {
      pages.push(buffer.trim());
      buffer = p;
    } else {
      buffer = buffer ? buffer + "\n\n" + p : p;
    }
  }

  if (buffer.trim()) pages.push(buffer.trim());
  return pages;
}

export default async function Page({ params }: ReadPageProps) {
  const decodedId = decodeURIComponent(params.id);
  const book = await fetchBookBySource(decodedId);

  // 🔴 Fix: pass undefined-safe book to BookNotFound
  if (!book) {
return (
<BookNotFound
book={{
id: decodedId,
title: "Unknown Book",
author: "Unknown Author",
coverUrl: "/placeholder-book.jpg",
source: "gutenberg",
downloadLinks: [],
}}
/>
);
}

  const sourceNames: Record<string, string> = {
    google: "Google Books",
    googlebooks: "Google Books",
    openlibrary: "Open Library",
    internetarchive: "Internet Archive",
    gutenberg: "Project Gutenberg",
    openstax: "OpenStax",
  };

  if (book.source === "openstax" && book.readUrl) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] text-gray-900">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <h1 className="text-xl font-semibold">{book.title}</h1>
            <p className="text-sm text-gray-500">OpenStax free textbook</p>
          </div>
          {book.downloadUrl ? (
            <Link
              href={`/api/books/download?url=${encodeURIComponent(book.downloadUrl)}`}
              className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Download PDF
            </Link>
          ) : null}
        </header>
        <iframe
          src={book.readUrl}
          title={`${book.title} online textbook`}
          className="h-[calc(100vh-78px)] min-h-[70vh] w-full border-0 bg-white"
        />
      </main>
    );
  }

  // ❌ If book not readable (non-Gutenberg)
  if (!book.isFullyReadable || book.source !== "gutenberg") {
    const pdfUrl = book.downloadUrl || await fetchFallbackPDF(book.id, book.source);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-gray-900 p-6">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-2xl border border-gray-100 p-8 text-center">
          <div className="relative mx-auto w-48 h-64 mb-6 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={book.coverUrl || "/placeholder-book.jpg"}
              alt={book.title}
              fill
              className="object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
          <p className="text-gray-600 mb-6">by {book.author || "Unknown"}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              📖 This title isn’t fully available for online reading.  
              You can download it or view it directly on{" "}
              <span className="font-semibold">
                {sourceNames[book.source] || "the source site"}
              </span>.
            </p>
          </div>

          {pdfUrl ? (
            <Link
              href={`/api/books/download?url=${encodeURIComponent(pdfUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg mb-3 text-center"
            >
              📥 Download PDF
            </Link>
          ) : (
            <div className="text-sm text-gray-500 mb-4">
              PDF download unavailable for this title.
            </div>
          )}

          <Link
            href={book.readUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold px-6 py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg text-center"
          >
            🌐 Open on {sourceNames[book.source] || "Source"}
          </Link>

          <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
            ✅ Redirecting to verified, legal sources only.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Gutenberg book: load text
  let raw: string;
  try {
    const textRes = await fetch(book.readUrl);
    if (!textRes.ok) throw new Error(`Failed to fetch: ${textRes.status}`);
    raw = await textRes.text();
  } catch (err) {
    console.error("Error fetching book content:", err);
    return (
      <BookNotFound
book={{
id: book.id,
title: book.title,
author: book.author,
coverUrl: book.coverUrl,
source: (book.source?.toLowerCase() ||
"gutenberg") as "gutenberg" | "openlibrary" | "internetarchive" | "google",
downloadLinks: [],
}}
/>
    );
  }

  // Clean HTML if necessary
  if (/<\s*html/i.test(raw)) {
    raw = raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/h\d>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  const pages = chunkTextIntoPages(raw, 3500);

  if (pages.length === 0) {
    return (
      <BookNotFound
book={{
id: book.id,
title: book.title,
author: book.author,
coverUrl: book.coverUrl,
source: (book.source?.toLowerCase() ||
"gutenberg") as "gutenberg" | "openlibrary" | "internetarchive" | "google",
downloadLinks: [],
}}
/>
    );
  }

  // ✅ Finally render the Reader
  return (
    <Reader
      book={{
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
      }}
      pages={pages}
    />
  );
}
