// lib/fetchBooks.ts
import { Book } from "@/types"; // ensure your types export Book

export async function fetchBooks(query: string): Promise<Book[]> {
  if (!query) return [];

  try {
    // Open Library search
    const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`);
    const ol = await olRes.json();

    if (ol.docs && ol.docs.length) {
      return ol.docs.slice(0, 12).map((d: any) => {
        // prefer Internet Archive identifier if present (ia)
        const ia = d.ia ? d.ia[0] : d.identifier?.[0] || null;
        const readUrl = ia
          ? `https://archive.org/download/${ia}/${ia}.pdf` // direct pdf attempt
          : d.key
          ? `https://openlibrary.org${d.key}` // fallback to OL work page
          : "https://openlibrary.org";

        return {
          id: d.key || ia || (d.cover_edition_key ?? d.edition_key?.[0] ?? d.title),
          title: d.title ?? "Untitled",
          author: d.author_name ? d.author_name[0] : "Unknown",
          coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : "/placeholder-book.jpg",
          readUrl,
          source: ia ? "Internet Archive" : "OpenLibrary",
        } as Book;
      });
    }

    // Fallback to Internet Archive advanced search
    const archiveRes = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator&rows=12&output=json`
    );
    const archiveData = await archiveRes.json();

    if (archiveData.response?.docs?.length > 0) {
      return archiveData.response.docs.map((b: any) => ({
        id: b.identifier,
        title: b.title || "Untitled",
        author: b.creator || "Unknown",
        coverUrl: `https://archive.org/services/img/${b.identifier}`,
        readUrl: `https://archive.org/download/${b.identifier}/${b.identifier}.pdf`,
        source: "Internet Archive",
      }));
    }

    return [];
  } catch (err) {
    console.error("fetchBooks error:", err);
    return [];
  }
}
