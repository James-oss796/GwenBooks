import { cn } from '@/lib/utils';
import React from 'react';
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
}

const BookCover = ({
  className,
  variant = "regular",
  coverColor = "#012b48",
  coverUrl = "https://placehold.co/400x600.png",
  onImageLoad,
  priority = false,
}: Props) => {
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
      {/* SVG overlay for extra depth */}
      <BookCoverSvg coverColor={coverColor} />

      {/* Book Image Layer */}
      <div
        className="absolute z-10"
        style={{ position: "absolute", top: 0, bottom: 0, left: "12%", width: "87.5%" }}
      >
        <Image
          src={coverUrl}
          alt="Book Cover"
          fill
          sizes={imageSizes[variant]}
          priority={priority}
          crossOrigin="anonymous"
          onLoad={(event) => onImageLoad?.(event.currentTarget)}
          className="rounded-sm object-fill"
        />
      </div>
    </div>
  );
};

export default BookCover;
