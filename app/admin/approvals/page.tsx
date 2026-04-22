"use client";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type PendingBook = {
  id: number;
  title: string;
  description: string | null;
  genre: string | null;
  language: string | null;
  fileUrl: string | null;
  createdAt: string | null;
  uploaderEmail: string | null;
};

export default function ApprovalsPage() {
  const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/books/pending", { cache: "no-store" });
      const data = await res.json();
      setPendingBooks(Array.isArray(data.books) ? data.books : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // ✅ Button handler
  async function handleAction(id: number, action: "approve" | "reject") {
    const res = await fetch(`/api/books/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success(
        action === "approve"
          ? "✅ Book approved successfully!"
          : "❌ Book rejected successfully!"
      );
      await refresh();
    } else {
      toast.error(data.error || "Something went wrong!");
    }
  }

  return (
    <main className="max-w-6xl mx-auto py-10 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-700">📚 Pending Book Approvals</h1>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading…</p>
      ) : pendingBooks.length === 0 ? (
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
              {book.uploaderEmail && (
                <p className="text-sm text-gray-500 mt-1">
                  Uploaded by{" "}
                  <span className="font-medium text-blue-700">{book.uploaderEmail}</span>
                </p>
              )}
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                {book.description || "No description provided."}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Genre: {book.genre || "N/A"} • Language: {book.language || "N/A"}
              </p>

              <div className="flex items-center justify-between mt-3">
                {book.fileUrl && (
                  <a
                    href={book.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    View file
                  </a>
                )}
                {book.createdAt && (
                  <span className="text-xs text-gray-400">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* ✅ Replaced the old forms here */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => handleAction(book.id, "approve")}
                  className="bg-green-600 hover:bg-green-700 text-white w-1/2 py-2 rounded-lg text-sm font-semibold"
                >
                  ✅ Approve
                </button>

                <button
                  onClick={() => handleAction(book.id, "reject")}
                  className="bg-red-600 hover:bg-red-700 text-white w-1/2 py-2 rounded-lg text-sm font-semibold"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
