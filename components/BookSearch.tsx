"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  url: string;
  source: string;
}

interface BookSearchProps {
  userId: string;
}

export default function BookSearch({ userId }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const searchBooks = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setBooks([]);

    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch books");

      const data = await res.json();
      setBooks(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* 📚 Search Results */}
      {books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author}
              genre={book.source || "Unknown"}
              coverUrl={book.cover || "/placeholder-book.jpg"}
              coverColor="#ffffff"
              userId={userId}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Try searching for a book above 👆
          </p>
        )
      )}
    </div>
  );
}
