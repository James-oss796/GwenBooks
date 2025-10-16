import React from "react";
import BookCard from "@/components/BookCard";
import { Book } from "@/types";

interface Props {
  title: string;
  books: Book[];
  userId?: string; // added userId
  containerClassName?: string;
}

export default function BookList ({ title, books, userId, containerClassName }: Props) {
  if (books.length < 1) return null; // better than undefined

  return (
     <section className={`space-y-4 ${containerClassName || ''}`}>
      {title && <h2 className="text-xl font-semibold text-light-100">{title}</h2>}
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} {...book} />
        ))}
      </ul>
    </section>
  );
};
