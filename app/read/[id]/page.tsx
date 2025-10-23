// app/read/[id]/page.tsx
import React from "react";
import Reader from "@/components/Render";
import { notFound, redirect } from "next/navigation";
import { fetchBookBySource } from "@/lib/fetchBooks";

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

  if (!book) return notFound();

  // 🧭 If it's Open Library or Internet Archive, redirect to external reader
  if (
    book.source === "openlibrary" ||
    book.source === "internetarchive"
  ) {
    redirect(book.readUrl as string); // send user to the official read/borrow page
  }

  if (!book.readUrl) return notFound();

  let raw: string;
  try {
    const textRes = await fetch(book.readUrl);
    if (!textRes.ok) return notFound();
    raw = await textRes.text();
  } catch {
    return notFound();
  }

  // Convert HTML to plain text
  if (/<\s*html/i.test(raw)) {
    raw = raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/h\d>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  }

  const pages = chunkTextIntoPages(raw, 3500);

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
