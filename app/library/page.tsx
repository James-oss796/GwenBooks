import React from "react";
import { notFound } from "next/navigation";
import BookSearch from "@/components/BookSearch";
import BookList from "@/components/BookList";
import { Book } from "@/types";

async function fetchGutenbergBooks(): Promise<Book[]> {
  try {
    const res = await fetch(
      "https://gutendex.com/books?languages=en&sort=popular&mime_type=text%2Fplain",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data.results.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.authors?.[0]?.name ?? "Unknown Author",
      genre: b.subjects?.[0] ?? "General",
      coverUrl: b.formats["image/jpeg"] ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function LibraryPage() {
  const books = await fetchGutenbergBooks();
  if (!books.length) return notFound();

  return (
    
    <main className="p-6 space-y-6 min-h-screen bg-[#0a0a0a]">
      
      <h1 className="text-3xl font-bold text-white">📚 Digital Library</h1>
      <BookSearch userId="" />
      <BookList title="Popular eBooks" books={books} />
    </main>
  );
}
