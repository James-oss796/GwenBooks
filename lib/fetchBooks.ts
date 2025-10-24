// lib/fetchBooks.ts
import { Book } from "@/types";

// Simple in-memory cache
const cache = new Map<string, { data: Book[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCached(query: string): Book[] | null {
  const cached = cache.get(query.toLowerCase());
  if (!cached) return null;
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(query.toLowerCase());
    return null;
  }
  return cached.data;
}

// 🔍 MAIN FETCH FUNCTION — Google Books first
export async function fetchBooks(query: string): Promise<Book[]> {
  if (!query) return [];

  const cached = getCached(query);
  if (cached) return cached;

  const results: Book[] = [];

  try {
    // 1️⃣ GOOGLE BOOKS (Main source)
    try {
      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}&maxResults=12`
      );
      const googleData = await googleRes.json();

      if (googleData.items?.length > 0) {
        const googleBooks = googleData.items.map((item: any): Book => {
          const volume = item.volumeInfo;
          return {
            id: `googlebooks:${item.id}`,
            title: volume.title || "Untitled",
            author: volume.authors?.join(", ") || "Unknown",
            coverUrl:
              volume.imageLinks?.thumbnail ||
              volume.imageLinks?.smallThumbnail ||
              "/placeholder-book.jpg",
            readUrl: volume.previewLink || volume.infoLink || null,
            source: "google",
            coverColor: "#fff",
          };
        });
        results.push(...googleBooks);
      }
    } catch (err) {
      console.error("[GoogleBooks] Failed:", err);
    }

    // 2️⃣ GUTENBERG (Fallback for public-domain)
    if (results.length < 12) {
      try {
        const gutenRes = await fetch(
          `https://gutendex.com/books?search=${encodeURIComponent(query)}`
        );
        const gutenData = await gutenRes.json();
        if (gutenData.results?.length > 0) {
          const gutenBooks = gutenData.results.slice(0, 12).map((g: any): Book => ({
            id: `gutenberg:${g.id}`,
            title: g.title || "Untitled",
            author: g.authors?.[0]?.name || "Unknown",
            coverUrl:
              g.formats["image/jpeg"] ||
              g.formats["image/jpg"] ||
              "/placeholder-book.jpg",
            readUrl:
              g.formats["application/pdf"] ||
              g.formats["text/html"] ||
              g.formats["text/plain; charset=utf-8"] ||
              "#",
            source: "gutenberg",
            coverColor: "#fff",
          }));
          results.push(...gutenBooks);
        }
      } catch (err) {
        console.error("[Gutenberg] Failed:", err);
      }
    }

    // 3️⃣ OPEN LIBRARY (extra fallback)
    if (results.length < 12) {
      try {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(
            query
          )}&limit=12`
        );
        const ol = await olRes.json();
        if (ol.docs?.length > 0) {
          const olBooks = ol.docs.slice(0, 12).map((d: any): Book => {
            const ia = d.ia ? d.ia[0] : d.identifier?.[0] || null;
            const readUrl = ia
              ? `https://archive.org/download/${ia}/${ia}.pdf`
              : d.key
              ? `https://openlibrary.org${d.key}`
              : "https://openlibrary.org";
            return {
              id: `openlibrary:${d.key || ia}`,
              title: d.title ?? "Untitled",
              author: d.author_name ? d.author_name[0] : "Unknown",
              coverUrl: d.cover_i
                ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
                : "/placeholder-book.jpg",
              readUrl,
              source: "openlibrary",
              coverColor: "#fff",
            };
          });
          results.push(...olBooks);
        }
      } catch (err) {
        console.error("[OpenLibrary] Failed:", err);
      }
    }

    // 4️⃣ INTERNET ARCHIVE (final fallback)
    if (results.length === 0) {
      try {
        const archiveRes = await fetch(
          `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
            query
          )}&fl[]=identifier,title,creator&rows=12&output=json`
        );
        const archiveData = await archiveRes.json();

        if (archiveData.response?.docs?.length > 0) {
          const archiveBooks = archiveData.response.docs.map((b: any): Book => ({
            id: `internetarchive:${b.identifier}`,
            title: b.title || "Untitled",
            author: b.creator || "Unknown",
            coverUrl: `https://archive.org/services/img/${b.identifier}`,
            readUrl: `https://archive.org/download/${b.identifier}/${b.identifier}.pdf`,
            source: "internetarchive",
            coverColor: "#fff",
          }));
          results.push(...archiveBooks);
        }
      } catch (err) {
        console.error("[InternetArchive] Failed:", err);
      }
    }

    cache.set(query.toLowerCase(), { data: results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error("[fetchBooks] Unexpected error:", error);
    return [];
  }
}

// =====================================
// 🔍 Fetch Book By Source (For Reader)
// =====================================
export async function fetchBookBySource(rawId: string) {
  if (!rawId) return null;

  const decoded = decodeURIComponent(rawId);
  const [source, idPart] = decoded.split(":");

  try {
    switch (source) {
      // 🏛️ Gutenberg
      case "gutenberg": {
        const cleanId = idPart.replace(/\D/g, ""); // Remove "OL" or other prefixes
        const res = await fetch(`https://gutendex.com/books/${cleanId}`);
        if (!res.ok) return null;

        const data = await res.json();
        const formats = data.formats ?? {};

        let readUrl: string | null = null;
        const preferredFormats = [
          "text/plain; charset=utf-8",
          "text/plain",
          "text/html; charset=utf-8",
          "text/html",
        ];

        for (const fmt of preferredFormats) {
          if (typeof formats[fmt] === "string") {
            readUrl = formats[fmt];
            break;
          }
        }

        if (!readUrl) {
          const candidate = Object.values(formats).find(
            (v) =>
              typeof v === "string" &&
              (v.endsWith(".txt") ||
                v.endsWith(".htm") ||
                v.endsWith(".html") ||
                v.includes("/files/"))
          );
          readUrl = typeof candidate === "string" ? candidate : null;
        }

        return {
          id: String(data.id),
          title: data.title,
          author: data.authors?.[0]?.name || "Unknown",
          coverUrl:
            data.formats?.["image/jpeg"] ||
            data.formats?.["image/jpg"] ||
            "/placeholder-book.jpg",
          readUrl,
          source: "gutenberg",
        };
      }

      // 📚 Open Library
      case "openlibrary": {
        const workId = idPart.startsWith("/works/")
          ? idPart
          : `/works/${idPart}`;
        const res = await fetch(`https://openlibrary.org${workId}.json`);
        if (!res.ok) return null;

        const data = await res.json();
        const coverId = data.covers?.[0];
        return {
          id: data.key,
          title: data.title || "Untitled",
          author:
            data.authors && data.authors.length
              ? "Open Library Author"
              : "Unknown",
          coverUrl: coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : "/placeholder-book.jpg",
          readUrl: `https://openlibrary.org${data.key}`,
          source: "openlibrary",
        };
      }

      // 🗄️ Internet Archive
      case "internetarchive": {
        const identifier = idPart;
        const metadataRes = await fetch(
          `https://archive.org/metadata/${identifier}`
        );
        if (!metadataRes.ok) return null;
        const metadata = await metadataRes.json();

        return {
          id: identifier,
          title: metadata.metadata?.title || "Untitled",
          author: metadata.metadata?.creator || "Unknown",
          coverUrl: `https://archive.org/services/img/${identifier}`,
          readUrl: `https://archive.org/download/${identifier}/${identifier}.pdf`,
          source: "internetarchive",
        };
      }

      // 📖 Google Books (New!)
      case "googlebooks": {
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY; // Optional if you have one
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${idPart}${
            apiKey ? `?key=${apiKey}` : ""
          }`
        );
        if (!res.ok) return null;

        const data = await res.json();
        const volume = data.volumeInfo;

        return {
          id: data.id,
          title: volume.title,
          author: (volume.authors && volume.authors.join(", ")) || "Unknown",
          coverUrl:
            volume.imageLinks?.thumbnail ||
            volume.imageLinks?.smallThumbnail ||
            "/placeholder-book.jpg",
          readUrl:
            volume.previewLink || volume.infoLink || null,
          source: "googlebooks",
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("fetchBookBySource failed:", error);
    return null;
  }
}
