import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  // Fetch all books pending approval with uploader info
  const pendingBooks = await db
    .select({
      id: uploaded_books.id,
      title: uploaded_books.title,
      author: uploaded_books.author,
      genre: uploaded_books.genre,
      description: uploaded_books.description,
      createdAt: uploaded_books.createdAt,
      uploaderId: uploaded_books.uploaderId,
      fileUrl: uploaded_books.fileUrl,
      language: uploaded_books.language,
      uploaderEmail: users.email,
    })
    .from(uploaded_books)
    .leftJoin(users, eq(users.id, uploaded_books.uploaderId))
    .where(eq(uploaded_books.status, "PENDING"));

  return (
    <main className="max-w-6xl mx-auto py-10 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-700">📚 Pending Book Approvals</h1>
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {pendingBooks.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          No pending books for approval 🎉
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingBooks.map((book) => (
            <div
              key={book.id}
              className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white hover:shadow-md transition-all"
            >
              <h2 className="font-semibold text-lg text-gray-800">{book.title}</h2>
              <p className="text-sm text-gray-500">by {book.author}</p>

              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                {book.description || "No description provided."}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Genre: {book.genre || "N/A"} • Language: {book.language}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Uploaded by:{" "}
                <span className="font-medium text-blue-700">
                  {book.uploaderEmail || "Unknown user"}
                </span>
              </p>

              <div className="flex items-center justify-between mt-4">
                <a
                  href={book.fileUrl}
                  target="_blank"
                  className="text-sm text-blue-600 underline"
                  rel="noopener noreferrer"
                >
                  View File
                </a>
                <span className="text-xs text-gray-400">
                  {new Date(book.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-3 mt-5">
                <form action="/api/admin/books/approve" method="POST" className="w-1/2">
                  <input type="hidden" name="id" value={book.id} />
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded-lg text-sm font-semibold"
                  >
                     Approve
                  </button>
                </form>

                <form action="/api/admin/books/reject" method="POST" className="w-1/2">
                  <input type="hidden" name="id" value={book.id} />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white w-full py-2 rounded-lg text-sm font-semibold"
                  >
                     Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
