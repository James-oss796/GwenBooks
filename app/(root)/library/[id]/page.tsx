import React from "react";
import BookList from "@/components/BookList";
import { notFound } from "next/navigation";
import BookSearch from "@/components/BookSearch";

// 🔹 Book type
type Book = {
  id: number | string;
  title: string;
  author?: string;
  genre?: string;
  coverUrl?: string | null;
  coverColor?: string;
};

// 🔹 Fetch from Project Gutenberg
async function fetchGutenbergBooks(): Promise<Book[]> {
  try {
    // Example: Top 20 most downloaded English books
    const res = await fetch(
      "https://gutendex.com/books?languages=en&sort=popular&mime_type=text%2Fplain",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();

    const books: Book[] = data.results.map((b: any) => {
      const author = b.authors?.[0]?.name ?? "Unknown Author";
      const genre = b.subjects?.[0] ?? "General";
      const coverUrl =
        b.formats["image/jpeg"] ||
        `https://covers.openlibrary.org/b/isbn/${b.identifiers?.isbn?.[0]}-L.jpg` ||
        null;

      return {
        id: b.id,
        title: b.title,
        author,
        genre,
        coverUrl,
      };
    });

    return books;
  } catch (error) {
    console.error("❌ Gutenberg fetch error:", error);
    return [];
  }
}

// 🔹 Optional: Try to fetch Open Library random books as backup
async function fetchOpenLibraryBooks(): Promise<Book[]> {
  try {
    const res = await fetch(
      "https://openlibrary.org/subjects/literature.json?limit=10",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();

    const books: Book[] = data.works.map((b: any) => ({
      id: b.key.replace("/works/", ""),
      title: b.title,
      author: b.authors?.[0]?.name ?? "Unknown Author",
      genre: data.name ?? "General",
      coverUrl: b.cover_id
        ? `https://covers.openlibrary.org/b/id/${b.cover_id}-L.jpg`
        : null,
    }));

    return books;
  } catch (error) {
    console.error("❌ OpenLibrary fetch error:", error);
    return [];
  }
}

// 🔹 Combine the two sources
async function getCombinedBooks(): Promise<Book[]> {
  const gutenberg = await fetchGutenbergBooks();
  const openLibrary = await fetchOpenLibraryBooks();

  // Merge & deduplicate (based on title)
  const seen = new Set<string>();
  const merged = [...gutenberg, ...openLibrary].filter((b) => {
    const lowerTitle = b.title.toLowerCase();
    if (seen.has(lowerTitle)) return false;
    seen.add(lowerTitle);
    return true;
  });

  return merged.slice(0, 25); // Limit to 25 for now
}

export default async function LibraryPage() {
  const books = await getCombinedBooks();

  if (!books.length) return notFound();

  return (
    <main className="p-6 space-y-6 min-h-screen bg-[#0a0a0a]">
      <h1 className="text-3xl font-bold text-white">📚 Digital Library</h1>
       <BookSearch userId={""} />

      {/* ✅ Render BookList (it uses BookCard internally) */}
      <BookList books={books} />
    </main>
  );
}
