// app/books/search/page.tsx
import BookSearch from "@/components/BookSearch";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search books",
  description: "Search book metadata across legitimate catalogs and check where a title can be read.",
  alternates: { canonical: "/books/search" },
};

export default function BooksSearchPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Search Books</h1>
      <BookSearch />
    </div>
  );
}
