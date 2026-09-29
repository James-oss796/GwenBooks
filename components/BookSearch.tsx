"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import type { Book } from "@/types";

interface BookSearchProps {
  userId?: string;
}

export default function BookSearch({ userId }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  void userId;
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchBooks = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setBooks([]);
    setSearched(false);
    setSearchError(null);

    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch books");

      const data = await res.json();
      setBooks(data.results || []);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Book search is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 🔍 Search Input + Button */}
      <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchBooks();
          }}
          placeholder="Search for a book..."
          className="
            flex-1
            bg-white 
            text-gray-900 
            placeholder:text-gray-500 
            border border-gray-300 
            rounded-lg 
            px-4 py-2
            focus:outline-none
            focus:ring-2 focus:ring-blue-500
          "
        />
        <Button
          onClick={searchBooks}
          disabled={loading}
          loading={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* 📚 Search Results */}
      {books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book, index) => {
            const separator = book.id.indexOf(":");
            const source = separator === -1 ? book.source : book.id.slice(0, separator);
            const id = separator === -1 ? book.id : book.id.slice(separator + 1);
            if (!source || !id) return null;
            return (
              <BookCard
                key={book.id}
                id={id}
                title={book.title}
                author={book.author}
                genre={book.genre || source}
                coverUrl={book.coverUrl || "/placeholder-book.jpg"}
                coverColor={book.coverColor || "#ffffff"}
                source={source as NonNullable<Book["source"]>}
                downloadUrl={book.downloadUrl}
                downloadId={book.downloadId}
                priority={index < 4}
              />
            );
          })}
        </div>
      ) : (
        !loading && searchError ? (
          <p role="alert" className="text-center text-red-600 text-sm mt-6">
            {searchError}
          </p>
        ) : !loading && searched ? (
          <p className="text-center text-gray-500 text-sm mt-6">
            No matching free books found. Try another title, author, or subject.
          </p>
        ) : !loading && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Search books from Project Gutenberg, OpenStax, Google Books, Open Library, and Internet Archive.
          </p>
        )
      )}
    </div>
  );
}
