"use client";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ButtonSpinner } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PendingBook = {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  genre: string | null;
  language: string | null;
  fileUrl: string | null;
  fileType: string | null;
  requestedPublic: boolean;
  rightsAttested: boolean;
  createdAt: string | null;
  uploaderEmail: string | null;
};

export default function ApprovalsPage() {
  const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<{ id: number; action: "approve" | "reject" } | null>(null);

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
    setActingOn({ id, action });
    try {
      const res = await fetch(`/api/books/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(action === "approve" ? "Book approved." : "Book rejected.");
        await refresh();
      } else {
        toast.error(data.error || "Something went wrong!");
      }
    } catch {
      toast.error("Action failed. Check your connection and try again.");
    } finally {
      setActingOn(null);
    }
  }

  return (
    <main className="max-w-6xl mx-auto py-10 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-700">Pending book approvals</h1>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading…</p>
      ) : pendingBooks.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          No pending books for approval.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingBooks.map((book) => (
            <div
              key={book.id}
              className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white hover:shadow-md transition-all"
            >
              <h2 className="font-semibold text-lg text-gray-800">{book.title}</h2>
              <p className="text-sm text-gray-600">{book.author || "Unknown author"} · {book.fileType?.toUpperCase() || "Book"}</p>
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
              <p className="mt-2 text-xs text-gray-600">Sharing request: {book.requestedPublic ? "Public after approval" : "Private to uploader"}{book.requestedPublic && !book.rightsAttested ? " · Rights confirmation missing" : ""}</p>

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
                  disabled={actingOn?.id === book.id}
                  aria-busy={actingOn?.id === book.id && actingOn.action === "approve"}
                  className="relative inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white w-1/2 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
                >
                  {actingOn?.id === book.id && actingOn.action === "approve" && <span className="absolute inset-0 flex items-center justify-center"><ButtonSpinner /></span>}
                  <span className={actingOn?.id === book.id && actingOn.action === "approve" ? "opacity-0" : ""}>Approve</span>
                </button>

                <button
                  onClick={() => handleAction(book.id, "reject")}
                  disabled={actingOn?.id === book.id}
                  aria-busy={actingOn?.id === book.id && actingOn.action === "reject"}
                  className="relative inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white w-1/2 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
                >
                  {actingOn?.id === book.id && actingOn.action === "reject" && <span className="absolute inset-0 flex items-center justify-center"><ButtonSpinner /></span>}
                  <span className={actingOn?.id === book.id && actingOn.action === "reject" ? "opacity-0" : ""}>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
