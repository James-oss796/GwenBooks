import React from "react";
import Link from "next/link";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { Book } from "@/types";

interface BookCardProps extends Book {
  userId?: string;
}

const BookCard = ({
  id,
  title,
  genre,
  coverUrl,
  coverColor,
  isLoanedBook = false,
  userId,
}: BookCardProps) => (
  <li className={cn(isLoanedBook && "xs:w-52 w-full")}>
    {/* ✅ Changed link to point to /library/[id] */}
    <Link
      href={`/library/${encodeURIComponent(title)}`}
      className={cn(isLoanedBook && "w-full flex flex-col items-center")}
    >
      {/* ✅ Fallback image if coverUrl is missing */}
      <BookCover
        coverColor={coverColor || "#E2E8F0"}
        coverUrl={coverUrl || "/icons/default-book.svg"}
      />

      <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
        <p className="book-title">{title}</p>
        <p className="book-genre">{genre}</p>
      </div>

      {isLoanedBook && (
        <div className="mt-3 w-full">
          <div className="book-loaned flex items-center gap-2 text-sm text-light-100">
            <Image
              src="/icons/calendar.svg"
              alt="calendar"
              width={18}
              height={18}
              className="object-contain"
            />
            <p>11 days left to return</p>
          </div>
          <Button className="book-btn mt-2 w-full">Download Receipt</Button>
        </div>
      )}
    </Link>
  </li>
);

export default BookCard;
