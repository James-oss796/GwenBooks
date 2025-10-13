"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { FastAverageColor } from "fast-average-color";

interface BookCardProps {
  id: number | string; // Gutenberg ID (number) or fallback string
  title: string;
  author?: string;
  genre?: string;
  coverUrl?: string | null;
  coverColor?: string;
  isLoanedBook?: boolean;
  userId?: string;
}

const BookCard = ({
  id,
  title,
  author,
  genre,
  coverUrl,
  coverColor,
  isLoanedBook = false,
}: BookCardProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [avgColor, setAvgColor] = useState<string>(coverColor || "#fff");

  const fallbackCover =
    coverUrl ||
    `https://covers.openlibrary.org/b/isbn/${id}-L.jpg` ||
    `https://archive.org/services/img/${id}` ||
    "/icons/default-book.svg";

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const fac = new FastAverageColor();

    const handleLoad = async () => {
      try {
        const color = await fac.getColorAsync(img);
        setAvgColor(color.hex);
      } catch (err) {
        console.warn("Failed to get average color:", err);
      }
    };

    img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [fallbackCover]);

  return (
    <li className={cn(isLoanedBook && "xs:w-52 w-full")}>
      <Link href={`/library/${String(id).replace(/^works\//, "").replace(/^\/?works\//, "")}`} prefetch>
        <div className="group hover:scale-[1.03] transition-transform duration-200">
          {/* Hidden img for color extraction */}
          <img
            ref={imgRef}
            src={fallbackCover}
            alt={title}
            crossOrigin="anonymous"
            style={{ display: "none" }}
          />

          {/* ✅ Pass the extracted color to BookCover */}
          <BookCover coverColor={avgColor} coverUrl={fallbackCover} />

          <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
            <p className="book-title line-clamp-2">{title}</p>
            {author && (
              <p className="text-light-300 text-sm italic truncate">{author}</p>
            )}
            {genre && (
              <p className="book-genre text-xs text-light-400">{genre}</p>
            )}
          </div>
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
      </Link>
    </li>
  );
};

export default BookCard;
