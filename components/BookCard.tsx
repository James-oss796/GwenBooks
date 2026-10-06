"use client";

import React, { useState } from "react";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { ButtonSpinner } from "./ui/button";
import { FastAverageColor } from "fast-average-color";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import type { ReactNode } from "react";

interface BookCardProps {
id: number | string;
title: string;
author?: string;
genre?: string;
coverUrl?: string | null;
  readUrl?: string;
coverColor?: string;
isLoanedBook?: boolean;
  source?: "gutenberg" | "internetarchive" | "wikisource" | "uploaded" | "openlibrary" | "googlebooks";
  downloadUrl?: string;
  downloadId?: string;
  priority?: boolean;
  sources?: Array<{ name: string; url?: string; availability: "readable_in_app" | "external_preview" | "source_only" }>;
  favoriteAction?: ReactNode;
  isFullyReadable?: boolean;
  sourceUrl?: string;
}

const BookCard = ({
id,
title,
author,
source,
genre,
coverUrl,
readUrl,
  downloadUrl,
  downloadId,
  priority = false,
  sources,
  favoriteAction,
  isFullyReadable,
  sourceUrl,
coverColor,
isLoanedBook = false,
}: BookCardProps) => {
const [avgColor, setAvgColor] = useState<string>(coverColor || "#fff");
const [isLoading, setIsLoading] = useState(false);
const router = useRouter();

const fallbackCover = coverUrl?.trim() || "";


const handleCoverLoad = async (image: HTMLImageElement) => {
const fac = new FastAverageColor();
try {
const color = await fac.getColorAsync(image);
setAvgColor(color.hex);
} catch (err) {
console.warn("Failed to extract cover color:", err);
}
};

const handleClick = (e: React.MouseEvent) => {
e.preventDefault();
  if (isFullyReadable !== true && sourceUrl) {
    window.location.assign(sourceUrl);
    return;
  }
  setIsLoading(true);
  const safeSource = (source || "gutenberg").toLowerCase();

  // ✅ Proper cleanup for IDs
  let cleanedId = String(id).trim();

  if (safeSource === "openlibrary") {
    cleanedId = cleanedId.replace(/^\/works\//, ""); // remove /works/
  } else if (safeSource === "gutenberg") {
    cleanedId = cleanedId.replace(/\D/g, ""); // keep only digits
  }

  // ✅ Encode safely for Next.js route
  const safeId = encodeURIComponent(`${safeSource}:${cleanedId}`);

  const readerParams = new URLSearchParams({
    title,
    author: author || "",
    coverUrl: coverUrl || "",
  });
  if (readUrl) readerParams.set("textUrl", readUrl);
  if (downloadId) readerParams.set("downloadId", downloadId);
  router.push(`/read/${safeId}?${readerParams.toString()}`);
};

return (
<li className={cn(isLoanedBook ? "xs:w-52 w-full" : "w-full relative")}>
<div className="relative">
  <button
    type="button"
    onClick={handleClick}
        disabled={isLoading}
    className="group relative block w-full text-left transition-transform duration-200 hover:scale-[1.03]"
    aria-label={isFullyReadable ? `Read ${title} in GwenBooks` : sourceUrl ? `Open ${title} at its source` : `Check availability for ${title}`}
  >
    <BookCover
      coverColor={avgColor}
      coverUrl={fallbackCover}
      title={title}
      author={author}
      onImageLoad={handleCoverLoad}
      priority={priority}
    />

    <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
      <p className="book-title line-clamp-2">{title}</p>
      {author && (
        <p className="text-light-300 text-sm italic truncate">{author}</p>
      )}
      {genre && (
        <p className="book-genre text-xs text-light-400">Source: {genre === "gutenberg" ? "Project Gutenberg" : genre === "wikisource" ? "Wikisource" : genre}</p>
      )}
      <p className="mt-2 text-sm font-semibold text-blue-700">{isFullyReadable ? "Read in GwenBooks" : downloadId ? "Download PDF" : source === "gutenberg" ? "Download options" : sourceUrl ? "Get this book" : "Check availability"} <span aria-hidden="true">→</span></p>
    </div>

    {/* Spinner overlay */}
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/55">
        <ButtonSpinner />
      </div>
    )}
  </button>
  {favoriteAction && <div className="mt-2">{favoriteAction}</div>}
  {(downloadUrl || downloadId) && (
    <a
      href={downloadId
        ? `/api/books/download?archiveId=${encodeURIComponent(downloadId)}`
        : downloadUrl!}
      target="_blank"
      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
    >
      <Download className="h-4 w-4" aria-hidden="true" /> Download PDF
    </a>
  )}
  {!!sources?.length && <ul aria-label="Book sources" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-light-300">
    {sources.map((item) => <li key={`${item.name}:${item.url || ""}`}>
      {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" onClick={(event) => event.stopPropagation()}>{item.name}</a> : item.name}
    </li>)}
  </ul>}
  <Link className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-blue-700 underline underline-offset-2" href={`/books/details/${encodeURIComponent(`${source || "gutenberg"}:${String(id)}`)}?${new URLSearchParams({ title, author: author || "", coverUrl: coverUrl || "", textUrl: readUrl || "", downloadId: downloadId || "" }).toString()}`}>Book details<span className="sr-only"> for {title}</span></Link>
</div>

  {isLoanedBook && (
    <div className="mt-3 w-full">
      <div className="book-loaned flex items-center gap-2">
        <Image
          src="/icons/calendar.svg"
          alt="calendar"
          width={18}
          height={18}
          className="object-contain"
        />
        <p className="text-light-100 text-sm">11 days left to return</p>
      </div>
      <Button className="book-btn mt-2">Download Receipt</Button>
    </div>
  )}
</li>


);
};

export default BookCard;
