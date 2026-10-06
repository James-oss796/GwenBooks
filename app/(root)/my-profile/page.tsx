"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import BookList from "@/components/BookList";
import BookSearch from "@/components/BookSearch";
import { handleLogout } from "@/app/actions/logout";
import type { Book } from "@/types";

type FavoriteRow = { bookId: string; title: string | null; author: string | null; coverUrl: string | null };
type ProgressRow = { bookId: string; pageIndex: number; title: string | null; author: string | null; coverUrl: string | null; updatedAt: string | null };

function favoriteToBook(row: FavoriteRow): Book {
  const separator = row.bookId.indexOf(":");
  const source = separator >= 0 ? row.bookId.slice(0, separator) : "gutenberg";
  const id = separator >= 0 ? row.bookId.slice(separator + 1) : row.bookId;
  return { id, source: source as Book["source"], title: row.title || "Untitled book", author: row.author || "Unknown author", coverUrl: row.coverUrl || "/icons/default-book.svg", coverColor: "#E2E8F0" };
}

export default function ProfilePage() {
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [recent, setRecent] = useState<ProgressRow[]>([]);
  const [forYou, setForYou] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [discoveryError, setDiscoveryError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const [favoriteResponse, progressResponse] = await Promise.all([
          fetch("/api/favorites", { cache: "no-store" }),
          fetch("/api/progress/save", { cache: "no-store" }),
        ]);
        if (!favoriteResponse.ok || !progressResponse.ok) throw new Error("Profile data could not be loaded.");
        const [favoriteData, progressData] = await Promise.all([favoriteResponse.json(), progressResponse.json()]);
        const favoriteRows = favoriteData.favorites as FavoriteRow[];
        const recentRows = progressData.recent as ProgressRow[];
        if (cancelled) return;
        setFavorites(favoriteRows.map(favoriteToBook));
        setRecent(recentRows);
        const affinity = recentRows.find((item) => item.author)?.author || favoriteRows.find((item) => item.author)?.author;
        if (affinity) {
          try {
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(affinity)}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (!cancelled) setForYou((data.results as Book[]).filter((book) => book.id !== recentRows[0]?.bookId).slice(0, 8));
          } catch { if (!cancelled) setDiscoveryError("Related catalog results could not be loaded just now."); }
        }
      } catch {
        if (!cancelled) setLoadError("Your library data is temporarily unavailable. Please refresh to try again.");
      } finally { if (!cancelled) setLoading(false); }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/70 p-5 shadow-sm">
        <div><p className="text-sm text-muted-foreground">Your library</p><h1 className="text-2xl font-semibold">Reading, saved for you</h1></div>
        <div className="flex gap-3"><Button asChild variant="outline"><Link href="/users/my-upload">My uploads</Link></Button><form action={handleLogout}><Button size="sm">Log out</Button></form></div>
      </div>
      <details className="rounded-xl border bg-white/60 p-4 shadow-sm">
        <summary className="cursor-pointer font-medium">Search books</summary>
        <div className="mt-5 max-h-[70vh] overflow-y-auto overscroll-contain"><BookSearch compactResults /></div>
      </details>
      <Tabs defaultValue="fyp" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-3 border-b pb-2">
          <TabsTrigger value="fyp">For you</TabsTrigger><TabsTrigger value="favorites">Favorites</TabsTrigger><TabsTrigger value="recent">Recent reads</TabsTrigger>
        </TabsList>
        <TabsContent value="fyp">
          {loadError ? <p role="alert">{loadError}</p> : loading ? <p role="status">Finding books related to your reading…</p> : discoveryError ? <p role="status">{discoveryError}</p> : forYou.length ? <BookList title="Related discoveries" books={forYou} /> : <div className="rounded-xl border p-8 text-center text-muted-foreground">Read or save a catalog book to see related titles from its author here. <Link className="ml-1 underline" href="/books/search">Explore the catalog</Link>.</div>}
        </TabsContent>
        <TabsContent value="favorites">
          {loadError ? <p role="alert">{loadError}</p> : loading ? <p role="status">Loading saved books…</p> : favorites.length ? <BookList title="Your favorites" books={favorites} /> : <p className="rounded-xl border py-8 text-center text-muted-foreground">Save a book while browsing or reading and it will appear here.</p>}
        </TabsContent>
        <TabsContent value="recent">
          {loadError ? <p role="alert">{loadError}</p> : loading ? <p role="status">Loading recent reads…</p> : recent.length ? <ul className="grid gap-3 sm:grid-cols-2">
            {recent.map((item) => <li key={item.bookId} className="flex min-w-0 items-center gap-4 rounded-xl border bg-white/60 p-4 shadow-sm">
              {item.coverUrl && <img src={item.coverUrl} alt={`Cover of ${item.title || "book"}`} className="h-24 w-16 shrink-0 rounded object-cover" loading="lazy" />}
              <div className="min-w-0"><Link className="line-clamp-2 font-medium underline" href={`/read/${encodeURIComponent(item.bookId)}`}>{item.title || "Continue reading"}</Link>
                {item.author && <p className="mt-1 truncate text-sm text-muted-foreground">{item.author}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{item.bookId.split(":")[0]} · position {item.pageIndex + 1}{item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleDateString()}` : ""}</p>
              </div>
            </li>)}
          </ul> : <p className="rounded-xl border py-8 text-center text-muted-foreground">Books you start reading will appear in your history.</p>}
        </TabsContent>
      </Tabs>
    </main>
  );
}
