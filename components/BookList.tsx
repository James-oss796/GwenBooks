import React from "react";
import BookCard from "@/components/BookCard";
import { Book } from "@/types";

interface Props {
  title: string;
  books: Book[];
  userId?: string; // added userId
  containerClassName?: string;
}

const BookList = ({ title, books, userId, containerClassName }: Props) => {
  if (books.length < 1) return null; // better than undefined

  return (
    <section className={containerClassName}>
      <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>

      <ul className="book-list">
        {books.map((book) => (
          <BookCard key={book.title} {...book}  />
        ))}
      </ul>
    </section>
  );
};

export default BookList;
