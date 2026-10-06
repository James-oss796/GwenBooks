import React from "react";
import Reader from "@/components/Render"; // ✅ Use your actual Reader component filename
import Link from "next/link";
import BookCover from "@/components/BookCover";
import { fetchBookBySource } from "@/lib/fetchBooks";
import BookNotFound from "@/components/BookNotFound"; // ✅ Your styled not-found page
import type { Book } from "@/types";
import { getUploadedBookForViewer } from "@/lib/uploadedBookAccess";
import { notFound, redirect } from "next/navigation";

const sourceNames: Partial<Record<NonNullable<Book["source"]>, string>> = {
  gutenberg: "Project Gutenberg",
  internetarchive: "Internet Archive",
  wikisource: "Wikisource",
};

type ReadPageProps = {
  params: { id: string };
  searchParams?: {
    title?: string;
    author?: string;
    coverUrl?: string;
    textUrl?: string;
    downloadId?: string;
  };
};

type ReaderPage = { title: string; page: number };

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

function normalizeBookText(text: string) {
  const namedEntities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    lsquo: "'",
    rsquo: "'",
    ldquo: '"',
    rdquo: '"',
    ndash: "-",
    mdash: "-",
    hellip: "...",
  };

  return text
    .normalize("NFC")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_entity, code: string) => {
      const value = code[0].toLowerCase() === "x"
        ? Number.parseInt(code.slice(1), 16)
        : Number.parseInt(code, 10);
      return Number.isFinite(value) && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : "";
    })
    .replace(/&(nbsp|amp|lt|gt|quot|apos|lsquo|rsquo|ldquo|rdquo|ndash|mdash|hellip);/gi, (_entity, name: string) => namedEntities[name.toLowerCase()] || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200D\uFEFF\uFFFD]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function Page({ params, searchParams }: ReadPageProps) {
  const decodedId = decodeURIComponent(params.id);
  const uploadedId = decodedId.match(/^uploaded:(\d+)$/);
  if (uploadedId) {
    const result = await getUploadedBookForViewer(Number(uploadedId[1]));
    if ("error" in result) {
      if (result.error === "unauthenticated") redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/read/${encodeURIComponent(decodedId)}`)}`);
      notFound();
    }
    return (
      <Reader
        book={{
          id: decodedId,
          title: result.book.title,
          author: result.book.author || "Unknown",
          source: "uploaded",
          coverUrl: result.book.coverUrl || "",
          fileType: result.book.fileType === "epub" ? "epub" : "pdf",
        }}
        pages={[]}
        uploadedFile={{ type: result.book.fileType === "epub" ? "epub" : "pdf", url: `/api/user/books/${result.book.id}/file` }}
      />
    );
  }
  const book = await fetchBookBySource(decodedId, {
    title: searchParams?.title,
    author: searchParams?.author,
    coverUrl: searchParams?.coverUrl,
    readUrl: searchParams?.textUrl,
    downloadId: searchParams?.downloadId,
  });

  // 🔴 Fix: pass undefined-safe book to BookNotFound
  if (!book) {
return (
<BookNotFound
book={{
id: decodedId,
title: "Unknown Book",
author: "Unknown Author",
coverUrl: "",
source: "gutenberg",
}}
/>
);
}

  if (!book.isFullyReadable || !["gutenberg", "internetarchive", "wikisource"].includes(book.source || "")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-gray-900 p-6">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-2xl border border-gray-100 p-8 text-center">
          <BookCover coverColor={book.coverColor || "#f4efe6"} coverUrl={book.coverUrl || ""} title={book.title} author={book.author} className="mx-auto mb-6 !h-auto !w-48 aspect-[143/199] shadow-lg" />

          <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
          <p className="text-gray-600 mb-6">by {book.author || "Unknown"}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              This title isn’t available in GwenBooks’ reader. Use the source link below to check reading options.
              You can download it or view it directly on{" "}
              <span className="font-semibold">
                {sourceNames[book.source || "gutenberg"] || "the source site"}
              </span>.
            </p>
          </div>

          {book.downloadId ? (
            <Link
              href={`/api/books/download?archiveId=${encodeURIComponent(book.downloadId)}`}
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg mb-3 text-center"
            >
              Download PDF
            </Link>
          ) : null}

          <a
            href={book.sourceUrl || book.readUrl || "https://www.gutenberg.org/"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold px-6 py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg text-center"
          >
            Read on {sourceNames[book.source || "gutenberg"] || "Source"}
          </a>

          <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
            Source availability is shown as provided by the catalog.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Gutenberg book: load text
  let raw: string = "";
  try {
    if (book.textContent) {
      raw = book.textContent;
    } else if (!book.chapters?.length) {
      if (!book.readUrl) throw new Error("No readable text URL is available");
      const textRes = await fetch(book.readUrl);
      if (!textRes.ok) throw new Error(`Failed to fetch: ${textRes.status}`);
      raw = await textRes.text();
    }
  } catch (err) {
    console.error("Error fetching book content:", err);
    return (
      <BookNotFound
book={{
id: book.id,
title: book.title,
author: book.author,
coverUrl: book.coverUrl,
source: (book.source?.toLowerCase() || "gutenberg") as "gutenberg" | "internetarchive" | "wikisource",
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

  const pages: string[] = [];
  const chapters: ReaderPage[] = [];
  if (book.chapters?.length) {
    for (const chapter of book.chapters) {
      const chapterPages = chunkTextIntoPages(normalizeBookText(chapter.content), 3500);
      if (!chapterPages.length) continue;
      chapters.push({ title: chapter.title, page: pages.length });
      pages.push(...chapterPages);
    }
  } else {
    pages.push(...chunkTextIntoPages(normalizeBookText(raw), 3500));
  }

  if (pages.length === 0) {
    return (
      <BookNotFound
book={{
id: book.id,
title: book.title,
author: book.author,
coverUrl: book.coverUrl,
source: (book.source?.toLowerCase() || "gutenberg") as "gutenberg" | "internetarchive" | "wikisource",
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
        source: book.source as "gutenberg" | "internetarchive" | "wikisource" | undefined,
        author: book.author,
        coverUrl: book.coverUrl,
        sourceUrl: book.sourceUrl,
      }}
      pages={pages}
      chapters={chapters}
    />
  );
}
