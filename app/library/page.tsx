import BookSearch from "@/components/BookSearch";
import BookList from "@/components/BookList";
import { Book } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book library",
  description: "Search across connected book catalogs and see legitimate source availability.",
  alternates: { canonical: "/library" },
};

async function fetchGutenbergBooks(): Promise<{ books: Book[]; unavailable: boolean }> {
  try {
    const res = await fetch(
      "https://gutendex.com/books?languages=en&sort=popular&mime_type=text%2Fplain",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { books: [], unavailable: true };

    const data = await res.json() as { results: Array<{ id: number; title: string; authors?: Array<{ name?: string }>; subjects?: string[]; formats?: Record<string, string> }> };
    return { books: data.results.map((b) => ({
      id: `gutenberg:${b.id}`,
      title: b.title,
      author: b.authors?.map((person) => person.name).filter(Boolean).join(", ") || undefined,
      genre: b.subjects?.[0],
      coverUrl: "",
      coverColor: "#f4efe6",
      source: "gutenberg" as const,
      sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
      isFullyReadable: false,
      availability: "source_only" as const,
      formats: Object.keys(b.formats || {}),
    })), unavailable: false };
  } catch {
    return { books: [], unavailable: true };
  }
}

export default async function LibraryPage() {
  const { books, unavailable } = await fetchGutenbergBooks();

  return (
    <main className="p-6 space-y-6 min-h-screen bg-[#0a0a0a]">
      <h1 className="text-3xl font-bold text-white">Digital Library</h1>
      <BookSearch userId="" />
      {books.length > 0 ? (
        <BookList title="Popular eBooks" books={books} />
      ) : unavailable ? (
        <section role="status" className="mx-auto max-w-3xl rounded-xl border border-white/15 p-6 text-center text-white/75">
          <h2 className="text-lg font-semibold text-white">The catalogue is temporarily unavailable</h2>
          <p className="mt-2 text-sm">Search above to try the connected book sources, or come back shortly.</p>
        </section>
      ) : (
        <p role="status" className="mx-auto max-w-3xl py-8 text-center text-white/70">
          No books were returned by the catalogue. Search above to look across the connected sources.
        </p>
      )}
    </main>
  );
}
