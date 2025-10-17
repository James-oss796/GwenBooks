import React from "react";
import Reader from "@/components/Render";
import { notFound } from "next/navigation";

type ReadPageProps = {
  params: { id: string };
};

const PREFERRED_FORMATS = [
  "text/plain; charset=utf-8",
  "text/plain",
  "text/html; charset=utf-8",
  "text/html",
];

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

async function fetchGutenbergBook(id: string) {
  const res = await fetch(`https://gutendex.com/books/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const formats = data.formats ?? {};

  // ✅ Ensure correct typing for readUrl
  let readUrl: string | null = null;
  for (const key of PREFERRED_FORMATS) {
    const url = formats[key];
    if (typeof url === "string") {
      readUrl = url;
      break;
    }
  }

  // fallback search
  if (!readUrl) {
    const candidate = Object.values(formats).find(
      (v) => typeof v === "string" && (v.endsWith(".txt") || v.includes("/files/"))
    );
    readUrl = typeof candidate === "string" ? candidate : null;
  }

  const coverUrl =
    (typeof formats["image/jpeg"] === "string" && formats["image/jpeg"]) ||
    (typeof data.formats?.["image/jpeg"] === "string" && data.formats["image/jpeg"]) ||
    null;

  const title = typeof data.title === "string" ? data.title : `Book ${id}`;
  const author =
    Array.isArray(data.authors) && data.authors.length > 0
      ? data.authors[0].name
      : "Unknown";

  return { id: String(id), title, author, readUrl, coverUrl };
}

export default async function Page({ params }: ReadPageProps) {
  const awaitedParams = await params;
  const { id } = awaitedParams;
  const book = await fetchGutenbergBook(id);

  if (!book || !book.readUrl) {
    return notFound();
  }

  let raw: string;

  try {
    const textRes = await fetch(book.readUrl);
    if (!textRes.ok) return notFound();
    raw = await textRes.text();
  } catch {
    return notFound();
  }

  // ✅ Handle HTML to plaintext conversion
  if (
    book.readUrl.endsWith(".htm") ||
    book.readUrl.endsWith(".html") ||
    /<\s*html/i.test(raw)
  ) {
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

  // Normalize whitespace
  raw = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

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
