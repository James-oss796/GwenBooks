import Link from "next/link";
import BookCover from "@/components/BookCover";

interface BookNotFoundProps {
  book: {
    id: string | number;
    title: string;
    author?: string;
    coverUrl?: string;
    source: "gutenberg" | "internetarchive" | "wikisource";
    sourceUrl?: string;
  };
}

function sourceSearchUrl(book: BookNotFoundProps["book"]) {
  if (book.sourceUrl) return book.sourceUrl;
  const term = encodeURIComponent(book.title);
  if (book.source === "gutenberg") return `https://www.gutenberg.org/ebooks/search/?query=${term}`;
  if (book.source === "internetarchive") return `https://archive.org/search?query=${term}`;
  return `https://en.wikisource.org/wiki/Special:Search?search=${term}`;
}

export default function BookNotFound({ book }: BookNotFoundProps) {
  return (
    <main className="root-container flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex w-full max-w-xl flex-col items-center rounded-2xl border border-white/10 bg-dark-800 p-8 shadow-lg">
        <BookCover coverColor="#f4efe6" coverUrl={book.coverUrl || ""} title={book.title} author={book.author} className="mb-6 !h-auto !w-40 aspect-[143/199]" />
        <h1 className="text-2xl font-bold text-white">This book could not be opened</h1>
        <p className="mt-3 text-light-200">GwenBooks could not load readable text for this result. We have not found a verified download for it.</p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={sourceSearchUrl(book)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-dark-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Check {book.source === "gutenberg" ? "Project Gutenberg" : book.source === "internetarchive" ? "Internet Archive" : "Wikisource"}
          </a>
          <Link href="/books/search" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-5 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Search other sources
          </Link>
        </div>
      </div>
    </main>
  );
}
