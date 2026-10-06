"use client";

import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import Image from 'next/image';
import BookCoverSvg from './BookCoversvg';

type BookCoverVariant = "extraSmall" | "small" | "medium" | "regular" | "wide";

const variantStyles: Record<BookCoverVariant, string> = {
  extraSmall: "book-cover_extra_small",
  small: "book-cover_small",
  medium: "book-cover_medium",
  regular: "book-cover_regular",
  wide: "book-cover_wide",
};

const imageSizes: Record<BookCoverVariant, string> = {
  extraSmall: "29px",
  small: "55px",
  medium: "144px",
  regular: "(max-width: 480px) 114px, 174px",
  wide: "(max-width: 480px) 256px, 296px",
};

interface Props {
  className?: string;
  variant?: BookCoverVariant;
  coverColor: string;
  coverUrl: string;
  onImageLoad?: (image: HTMLImageElement) => void;
  priority?: boolean;
  title?: string;
  author?: string;
}

const BookCover = ({
  className,
  variant = "regular",
  coverColor = "#012b48",
  coverUrl = "",
  onImageLoad,
  priority = false,
  title = "Book cover unavailable",
  author,
}: Props) => {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        'relative transition-all duration-300 rounded-md overflow-hidden',
        variantStyles[variant],
        className,
      )}
      // ✅ background color from fast-average-color
      style={{ position: "relative", backgroundColor: coverColor }}
    >
      {/* Keep the decorative book frame behind the cover artwork. */}
      <BookCoverSvg coverColor={coverColor} />
      {(!coverUrl || failed) && <div className="absolute inset-[8%_7%_9%_20%] z-10 flex flex-col justify-center gap-2 overflow-hidden bg-stone-100 p-3 text-center text-stone-800">
        <span className="line-clamp-5 font-serif text-sm font-semibold">{title}</span>
        {author && <span className="line-clamp-3 text-xs">{author}</span>}
      </div>}

      {/* Book Image Layer */}
      {coverUrl && !failed && <div
        className="absolute z-10 overflow-hidden"
        style={{ position: "absolute", top: "1.5%", bottom: "12.5%", left: "12%", width: "87.5%" }}
      >
        <Image
          src={coverUrl}
          alt={`Cover of ${title}`}
          fill
          sizes={imageSizes[variant]}
          priority={priority}
          onError={() => setFailed(true)}
          crossOrigin="anonymous"
          onLoad={(event) => onImageLoad?.(event.currentTarget)}
          className="rounded-sm object-cover"
        />
      </div>}
    </div>
  );
};

export default BookCover;
