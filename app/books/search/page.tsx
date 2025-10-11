// app/books/search/page.tsx
import BookSearch from "@/components/BookSearch";

export default function BooksSearchPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Search Books</h1>
      <BookSearch />
    </div>
  );
}
