"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { FastAverageColor } from "fast-average-color";
import { useRouter } from "next/navigation";

interface BookCardProps {
  id: number | string;
  title: string;
  author?: string;
  genre?: string;
  coverUrl?: string | null;
  coverColor?: string;
  isLoanedBook?: boolean;
  userId?: string;
  source:  "gutenberg" | "openlibrary" | "internetarchive";
}

const BookCard = ({
  id,
  title,
  author,
  source,
  genre,
  coverUrl,
  coverColor,
  isLoanedBook = false,
}: BookCardProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [avgColor, setAvgColor] = useState<string>(coverColor || "#fff");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fallbackCover =
    coverUrl && coverUrl.trim() !== ""
      ? coverUrl
      : `https://covers.openlibrary.org/b/id/${id}-L.jpg`;

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const fac = new FastAverageColor();
    const handleLoad = async () => {
      try {
        const color = await fac.getColorAsync(img);
        setAvgColor(color.hex);
      } catch {
        console.warn("Failed to extract average color");
      }
    };

    img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [fallbackCover]);

  const cleanId = String(id).replace(/[^0-9]/g, "").trim();

 const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsLoading(true);

  setTimeout(() => {
    const safeSource = (source || "gutenberg").toLowerCase();

    // Clean Open Library IDs like "/works/OL12345W"
    const cleanedId = String(id).replace(/^\/works\//, "").trim();

    // Build a safe, encoded route param
    const safeId = encodeURIComponent(`${safeSource}:${cleanedId}`);

    router.push(`/read/${safeId}`);
  }, 500);
};



  return (
    <li className={cn(isLoanedBook ? "xs:w-52 w-full" : "w-full relative")}>
      <div
        onClick={handleClick}
        className="group hover:scale-[1.03] transition-transform duration-200 cursor-pointer"
      >
        <img ref={imgRef} src={fallbackCover} alt={title} className="hidden" />

        <BookCover coverColor={avgColor} coverUrl={fallbackCover} />

        <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
          <p className="book-title line-clamp-2">{title}</p>
          {author && <p className="text-light-300 text-sm italic truncate">{author}</p>}
          {genre && <p className="book-genre text-xs text-light-400">{genre}</p>}
        </div>

        {/* Spinner overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="h-6 w-6 border-4 border-t-transparent border-white rounded-full animate-spin" />
          </div>
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
