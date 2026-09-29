"use client";

import React, { useState } from "react";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { FastAverageColor } from "fast-average-color";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

interface BookCardProps {
id: number | string;
title: string;
author?: string;
genre?: string;
coverUrl?: string | null;
coverColor?: string;
isLoanedBook?: boolean;
  source?: "gutenberg" | "openlibrary" | "internetarchive" | "google" | "googlebooks" | "openstax";
  downloadUrl?: string;
  downloadId?: string;
  priority?: boolean;
}

const BookCard = ({
id,
title,
author,
source,
genre,
coverUrl,
  downloadUrl,
  downloadId,
  priority = false,
coverColor,
isLoanedBook = false,
}: BookCardProps) => {
const [avgColor, setAvgColor] = useState<string>(coverColor || "#fff");
const [isLoading, setIsLoading] = useState(false);
const router = useRouter();

const fallbackCover =
coverUrl && coverUrl.trim() !== ""
? coverUrl
: `https://covers.openlibrary.org/b/id/${id}-L.jpg`;


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

  router.push(`/read/${safeId}`);
};

return (
<li className={cn(isLoanedBook ? "xs:w-52 w-full" : "w-full relative")}>
<div className="relative">
  <button
    type="button"
    onClick={handleClick}
        disabled={isLoading}
    className="group relative block w-full text-left transition-transform duration-200 hover:scale-[1.03]"
    aria-label={`Open ${title}`}
  >
    <BookCover
      coverColor={avgColor}
      coverUrl={fallbackCover}
      onImageLoad={handleCoverLoad}
      priority={priority}
    />

    <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
      <p className="book-title line-clamp-2">{title}</p>
      {author && (
        <p className="text-light-300 text-sm italic truncate">{author}</p>
      )}
      {genre && (
        <p className="book-genre text-xs text-light-400">{genre}</p>
      )}
    </div>

    {/* Spinner overlay */}
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
        <div className="h-6 w-6 border-4 border-t-transparent border-white rounded-full animate-spin" />
      </div>
    )}
  </button>
  {(downloadUrl || downloadId) && (
    <a
      href={downloadUrl
        ? `/api/books/download?url=${encodeURIComponent(downloadUrl)}`
        : `/api/books/download?archiveId=${encodeURIComponent(downloadId!)}`}
      target="_blank"
      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
    >
      <Download className="h-4 w-4" aria-hidden="true" /> Download PDF
    </a>
  )}
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