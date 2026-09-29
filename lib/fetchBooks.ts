// lib/fetchBooks.ts
import { Book } from "@/types";

// Simple in-memory cache
const cache = new Map<string, { data: Book[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

async function fetchProviderJson(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

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
  if (!query?.trim()) return [];

  const normalizedQuery = query.trim().toLowerCase();
  const cached = getCached(normalizedQuery);
  if (cached) return cached;

  const encodedQuery = encodeURIComponent(query.trim());
  const providers = await Promise.all([
    fetchProviderJson(`https://gutendex.com/books?search=${encodedQuery}`)
      .then((data) => (data.results || []).filter((book: any) => {
        const formats = book.formats || {};
        return formats["text/html; charset=utf-8"] || formats["text/html"] ||
          formats["text/plain; charset=utf-8"] || formats["text/plain"];
      }).slice(0, 8).map((book: any): Book => {
        const formats = book.formats || {};
        return {
          id: `gutenberg:${book.id}`,
          title: book.title || "Untitled",
          author: book.authors?.[0]?.name || "Unknown",
          coverUrl: formats["image/jpeg"] || formats["image/jpg"] || "/placeholder-book.jpg",
          readUrl: formats["text/html; charset=utf-8"] || formats["text/html"] || formats["text/plain; charset=utf-8"] || formats["text/plain"],
          downloadUrl: formats["application/pdf"],
          source: "gutenberg",
          coverColor: "#fff",
          isFullyReadable: true,
        };
      })).catch((error) => { console.warn("[Gutenberg] Search unavailable:", error); return []; }),
    fetchProviderJson("https://openstax.org/apps/cms/api/books/?format=json", {
      next: { revalidate: 3600 },
    }).then((data) => {
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      return (data.books || []).filter((book: any) => {
        const searchable = [book.title, ...(book.subjects || []), ...(book.subject_categories || [])]
          .join(" ").toLowerCase();
        return book.book_state === "live" && book.pdf_url && terms.every((term) => searchable.includes(term));
      }).slice(0, 12).map((book: any): Book => ({
        id: `openstax:${String(book.slug || "").replace(/^books\//, "")}`,
        title: book.title || "Untitled",
        author: "OpenStax",
        genre: (book.subjects || []).join(", ") || "Textbook",
        coverUrl: book.cover_url || "/placeholder-book.jpg",
        readUrl: book.webview_rex_link || book.webview_link,
        downloadUrl: book.pdf_url,
        source: "openstax",
        coverColor: "#fff",
        isFullyReadable: true,
      }));
    }).catch((error) => { console.warn("[OpenStax] Search unavailable:", error); return []; }),
    fetchProviderJson(`https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&filter=free-ebooks&maxResults=15`)
      .then((data) => (data.items || []).filter((item: any) => {
        const access = item.accessInfo;
        return access?.webReaderLink && (access.viewability === "ALL_PAGES" || access.viewability === "PARTIAL" || access.accessViewStatus === "FULL_PUBLIC_DOMAIN");
      }).slice(0, 8).map((item: any): Book => ({
        id: `googlebooks:${item.id}`,
        title: item.volumeInfo?.title || "Untitled",
        author: item.volumeInfo?.authors?.join(", ") || "Unknown",
        coverUrl: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || "/placeholder-book.jpg",
        readUrl: item.accessInfo.webReaderLink,
        source: "googlebooks",
        coverColor: "#fff",
        isFullyReadable: false,
      }))).catch((error) => { console.warn("[GoogleBooks] Search unavailable:", error); return []; }),
    fetchProviderJson(`https://openlibrary.org/search.json?q=${encodedQuery}&limit=20&has_fulltext=true`)
      .then((data) => (data.docs || []).filter((book: any) => book.ia?.length)
        .slice(0, 8).map((book: any): Book => {
          const archiveId = book.ia[0];
          return {
            id: `openlibrary:${book.key?.replace(/^\/works\//, "") || archiveId}`,
            title: book.title || "Untitled",
            author: book.author_name?.[0] || "Unknown",
            coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : "/placeholder-book.jpg",
            readUrl: `https://archive.org/details/${archiveId}`,
            downloadId: archiveId,
            source: "openlibrary",
            coverColor: "#fff",
            isFullyReadable: false,
          };
        })).catch((error) => { console.warn("[OpenLibrary] Search unavailable:", error); return []; }),
    fetchProviderJson(`https://archive.org/advancedsearch.php?q=${encodedQuery}%20AND%20mediatype:texts&fl[]=identifier,title,creator&rows=10&output=json`)
      .then((data) => (data.response?.docs || []).slice(0, 6).map((book: any): Book => ({
        id: `internetarchive:${book.identifier}`,
        title: book.title || "Untitled",
        author: Array.isArray(book.creator) ? book.creator.join(", ") : book.creator || "Unknown",
        coverUrl: `https://archive.org/services/img/${book.identifier}`,
        readUrl: `https://archive.org/details/${book.identifier}`,
        downloadId: book.identifier,
        source: "internetarchive",
        coverColor: "#fff",
        isFullyReadable: false,
      }))).catch((error) => { console.warn("[InternetArchive] Search unavailable:", error); return []; }),
  ]);

  const results = providers.flat();
  const uniqueResults = Array.from(new Map(results.map((book) => [book.id, book])).values());
  cache.set(normalizedQuery, { data: uniqueResults, timestamp: Date.now() });
  return uniqueResults;
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
        const workRes = await fetch(`https://openlibrary.org/works/${identifier}.json`);
        if (!workRes.ok) return null;
        const workData = await workRes.json();
        return {
          id: identifier,
          title: workData.title || "Untitled",
          author: workData.authors?.[0]?.author?.key?.replace("/authors/", "") || "Unknown",
          coverUrl: workData.covers?.[0]
            ? `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`
            : "/placeholder-book.jpg",
          readUrl: workData.ia?.[0]
            ? `https://archive.org/details/${workData.ia[0]}`
            : `https://openlibrary.org/works/${identifier}`,
          source: "openlibrary",
          isFullyReadable: false,
        };
      }

      case "openstax": {
        const catalogRes = await fetch(
          "https://openstax.org/apps/cms/api/books/?format=json",
          { next: { revalidate: 3600 } }
        );
        if (!catalogRes.ok) return null;
        const catalog = await catalogRes.json();
        const slug = `books/${idPart}`;
        const entry = catalog.books?.find((book: any) => book.slug === slug);
        if (!entry) return null;
        return {
          id: idPart,
          title: entry.title || "Untitled",
          author: "OpenStax",
          coverUrl: entry.cover_url || "/placeholder-book.jpg",
          readUrl: entry.webview_rex_link || entry.webview_link,
          downloadUrl: entry.pdf_url,
          source: "openstax",
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