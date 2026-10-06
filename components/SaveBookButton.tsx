"use client";

import { useState } from "react";
import { FiHeart } from "react-icons/fi";

export default function SaveBookButton({ book }: { book: { id: string; title: string; author?: string | null; coverUrl?: string | null } }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      if (!saved) {
        const existing = await fetch("/api/favorites", { cache: "no-store" });
        if (existing.ok) {
          const data = await existing.json();
          if (data.favorites?.some((item: { bookId: string }) => item.bookId === book.id)) { setSaved(true); return; }
        }
      }
      const response = await fetch(`/api/favorites/${saved ? "remove" : "add"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl }),
      });
      if (!response.ok) throw new Error("Could not update your saved books.");
      setSaved(!saved);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update your saved books."); }
    finally { setBusy(false); }
  };
  return <div><button type="button" onClick={() => void toggle()} disabled={busy} aria-pressed={saved} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"><FiHeart aria-hidden="true" />{busy ? "Saving…" : saved ? "Saved" : "Save book"}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
