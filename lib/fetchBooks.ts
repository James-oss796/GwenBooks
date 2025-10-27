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

// 🔍 MAIN FETCH FUNCTION — Google Books first, with readability filtering
export async function fetchBooks(query: string): Promise<Book[]> {
  if (!query) return [];

  const cached = getCached(query);
  if (cached) return cached;

  const results: Book[] = [];

  try {
    // 1️⃣ GUTENBERG - Most reliable for in-app reading (moved to first!)
    try {
      const gutenRes = await fetch(
        `https://gutendex.com/books?search=${encodeURIComponent(query)}`
      );
      const gutenData = await gutenRes.json();
      if (gutenData.results?.length > 0) {
        const gutenBooks = gutenData.results
          .filter((g: any) => {
            // Only include if it has readable formats
            const formats = g.formats || {};
            return (
              formats["text/html"] ||
              formats["text/plain; charset=utf-8"] ||
              formats["text/plain"]
            );
          })
          .slice(0, 8)
          .map((g: any): Book => {
            const formats = g.formats || {};
            // Prioritize formats that work best in-app
            const readUrl =
              formats["text/html; charset=utf-8"] ||
              formats["text/html"] ||
              formats["text/plain; charset=utf-8"] ||
              formats["text/plain"];

            return {
              id: `gutenberg:${g.id}`,
              title: g.title || "Untitled",
              author: g.authors?.[0]?.name || "Unknown",
              coverUrl:
                g.formats["image/jpeg"] ||
                g.formats["image/jpg"] ||
                "/placeholder-book.jpg",
              readUrl,
              source: "gutenberg",
              coverColor: "#fff",
              isFullyReadable: true, // ✅ Can read in-app
            };
          });
        results.push(...gutenBooks);
      }
    } catch (err) {
      console.error("[Gutenberg] Failed:", err);
    }

    // 2️⃣ GOOGLE BOOKS - Preview only (external redirect)
    if (results.length < 12) {
      try {
        // Try free ebooks first
        const googleRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            query
          )}&filter=free-ebooks&maxResults=15`
        );
        const googleData = await googleRes.json();

        if (googleData.items?.length > 0) {
          const googleBooks = googleData.items
            .filter((item: any) => {
              const accessInfo = item.accessInfo;
              return (
                accessInfo &&
                accessInfo.webReaderLink &&
                (accessInfo.viewability === "ALL_PAGES" ||
                  accessInfo.viewability === "PARTIAL" ||
                  accessInfo.accessViewStatus === "FULL_PUBLIC_DOMAIN")
              );
            })
            .map((item: any): Book => {
              const volume = item.volumeInfo;
              const accessInfo = item.accessInfo;

              return {
                id: `googlebooks:${item.id}`,
                title: volume.title || "Untitled",
                author: volume.authors?.join(", ") || "Unknown",
                coverUrl:
                  volume.imageLinks?.thumbnail ||
                  volume.imageLinks?.smallThumbnail ||
                  "/placeholder-book.jpg",
                readUrl: accessInfo.webReaderLink,
                source: "google",
                coverColor: "#fff",
                isFullyReadable: false, // ⚠️ External redirect only
              };
            })
            .slice(0, 8);

          results.push(...googleBooks);
        }
      } catch (err) {
        console.error("[GoogleBooks] Failed:", err);
      }
    }

    // 3️⃣ OPEN LIBRARY (external redirect to Internet Archive)
    if (results.length < 12) {
      try {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(
            query
          )}&limit=20&has_fulltext=true`
        );
        const ol = await olRes.json();
        if (ol.docs?.length > 0) {
          const olBooks = ol.docs
            .filter((d: any) => d.ia && d.ia.length > 0)
            .slice(0, 8)
            .map((d: any): Book => {
              const ia = d.ia[0];
              return {
                id: `openlibrary:${ia}`,
                title: d.title ?? "Untitled",
                author: d.author_name ? d.author_name[0] : "Unknown",
                coverUrl: d.cover_i
                  ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
                  : "/placeholder-book.jpg",
                readUrl: `https://archive.org/details/${ia}`,
                source: "openlibrary",
                coverColor: "#fff",
                isFullyReadable: false, // ⚠️ External redirect
              };
            });
          results.push(...olBooks);
        }
      } catch (err) {
        console.error("[OpenLibrary] Failed:", err);
      }
    }

    // 4️⃣ INTERNET ARCHIVE (external redirect)
    if (results.length < 10) {
      try {
        const archiveRes = await fetch(
          `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
            query
          )}%20AND%20mediatype:texts&fl[]=identifier,title,creator&rows=10&output=json`
        );
        const archiveData = await archiveRes.json();

        if (archiveData.response?.docs?.length > 0) {
          const archiveBooks = archiveData.response.docs
            .slice(0, 6)
            .map((b: any): Book => ({
              id: `internetarchive:${b.identifier}`,
              title: b.title || "Untitled",
              author: b.creator || "Unknown",
              coverUrl: `https://archive.org/services/img/${b.identifier}`,
              readUrl: `https://archive.org/details/${b.identifier}`,
              source: "internetarchive",
              coverColor: "#fff",
              isFullyReadable: false, // ⚠️ External redirect
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
      // 🏛️ Gutenberg - Only source that works in-app
      case "gutenberg": {
        const cleanId = idPart.replace(/\D/g, "");
        const res = await fetch(`https://gutendex.com/books/${cleanId}`);
        if (!res.ok) return null;

        const data = await res.json();
        const formats = data.formats ?? {};

        // Get the best readable format
        const readUrl =
          formats["text/html; charset=utf-8"] ||
          formats["text/html"] ||
          formats["text/plain; charset=utf-8"] ||
          formats["text/plain"] ||
          null;

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
          isFullyReadable: true,
        };
      }

      // 📖 Google Books - External only
      case "googlebooks": {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${idPart}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        const volume = data.volumeInfo;
        const accessInfo = data.accessInfo;

        return {
          id: data.id,
          title: volume.title,
          author: (volume.authors && volume.authors.join(", ")) || "Unknown",
          coverUrl:
            volume.imageLinks?.thumbnail ||
            volume.imageLinks?.smallThumbnail ||
            "/placeholder-book.jpg",
          readUrl: accessInfo?.webReaderLink || volume.previewLink,
          source: "googlebooks",
          isFullyReadable: false,
        };
      }

      // 📚 Open Library - External (redirects to Internet Archive)
      case "openlibrary": {
        const identifier = idPart;
        return {
          id: identifier,
          title: "Book",
          author: "Unknown",
          coverUrl: "/placeholder-book.jpg",
          readUrl: `https://archive.org/details/${identifier}`,
          source: "openlibrary",
          isFullyReadable: false,
        };
      }

      // 🗄️ Internet Archive - External only
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
          readUrl: `https://archive.org/details/${identifier}`,
          source: "internetarchive",
          isFullyReadable: false,
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