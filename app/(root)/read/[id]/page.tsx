import { fetchBookByTitle } from "@/lib/fetchBooks";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string }; // here 'id' is actually the title slug
}

const ReaderPage = async ({ params }: Props) => {
  const decodedTitle = decodeURIComponent(params.id);
  const book = await fetchBookByTitle(decodedTitle);

  if (!book) return notFound();

  return (
    <main className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
      <h1 className="text-3xl font-bold text-white">{book.title}</h1>
      <p className="text-light-200">{book.author}</p>

      <div className="rounded-lg overflow-hidden shadow-lg">
        <iframe
          src={book.readUrl}
          className="w-full h-[80vh] rounded"
          title={book.title}
        />
      </div>

      {/* Future AI Features */}
      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold text-light-100">
          AI Reading Tools
        </h2>
        <ul className="list-disc list-inside text-light-200">
          <li>AI Summary of this book</li>
          <li>Highlight and annotate text</li>
          <li>Personalized reading experience</li>
        </ul>
      </section>
    </main>
  );
};

export default ReaderPage;
