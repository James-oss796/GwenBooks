// lib/fetchBooks.ts
import { Book } from "@/types";

// Simple in-memory cache
const cache = new Map<string, { data: Book[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const archiveTextCache = new Map<string, Book | null>();

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

  type ReaderOverrides = Partial<Pick<Book, "title" | "author" | "coverUrl" | "readUrl" | "downloadId">>;

  function isTrustedTextUrl(source: string, rawUrl?: string) {
    if (!rawUrl) return false;
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:") return false;
      if (source === "gutenberg") return url.hostname === "www.gutenberg.org" || url.hostname === "gutenberg.org";
      if (source === "internetarchive") return url.hostname === "archive.org" || url.hostname.endsWith(".archive.org");
      if (source === "wikisource") return url.hostname === "en.wikisource.org" && url.pathname === "/w/api.php";
      return false;
    } catch {
      return false;
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

  function matchesBookQuery(book: Book, query: string) {
    const ignoredTerms = new Set(["the", "and", "for", "with", "from", "into", "book", "books"]);
    const terms = query.toLowerCase().match(/[a-z0-9]+/g)?.filter((term) => term.length > 2 && !ignoredTerms.has(term)) || [];
    if (!terms.length) return true;
    const searchable = `${book.title} ${book.author || ""}`.toLowerCase();
    return terms.every((term) => searchable.includes(term));
  }

async function getOpenArchiveBook(record: any, firstPublishYear?: number): Promise<Book | null> {
  const identifier = String(record.identifier || "");
  if (!identifier) return null;
  if (archiveTextCache.has(identifier)) return archiveTextCache.get(identifier) || null;

  try {
    const metadata = await fetchProviderJson(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
    const item = metadata.metadata || {};
    const license = String(item.licenseurl || "");
    const rights = String(item.rights || "");
    const publicationYear = firstPublishYear || Number(String(item.date || item.year || "").match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)?.[0]);
    const isPublicDomain = Number.isFinite(publicationYear) && publicationYear > 0 && publicationYear <= 1930;
    const isOpenLicensed = /creativecommons\.org\/(?:publicdomain|licenses\/by(?:-sa)?\/)/i.test(license) || /public domain/i.test(rights);
    if (item["access-restricted-item"] === true || (!isPublicDomain && !isOpenLicensed)) {
      archiveTextCache.set(identifier, null);
      return null;
    }

    const textFile = (metadata.files || []).find((file: any) =>
      /\.txt$/i.test(file.name || "") && !/(?:meta|marc|files\.txt|contents)/i.test(file.name)
    );
    if (!textFile?.name) {
      archiveTextCache.set(identifier, null);
      return null;
    }

    const encodedPath = String(textFile.name).split("/").map(encodeURIComponent).join("/");
    const book: Book = {
      id: `internetarchive:${identifier}`,
      title: record.title || item.title || "Untitled",
      author: Array.isArray(record.creator) ? record.creator.join(", ") : record.creator || item.creator || "Unknown",
      coverUrl: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
      readUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodedPath}`,
      downloadId: identifier,
      source: "internetarchive",
      coverColor: "#fff",
      isFullyReadable: true,
    };
    archiveTextCache.set(identifier, book);
    return book;
  } catch {
    return null;
  }
}

// Search only sources that can provide text to the in-app reader.
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
    fetchProviderJson(`https://openlibrary.org/search.json?q=${encodedQuery}&limit=20&has_fulltext=true`)
      .then(async (data) => Promise.all((data.docs || [])
        .filter((book: any) => book.ia?.length && book.first_publish_year && book.first_publish_year <= 1930)
        .slice(0, 8).map(async (book: any) => {
          // Map OpenLibrary books to the Book type
          const archiveId = book.ia[0];
          return getOpenArchiveBook({ identifier: archiveId, title: book.title, creator: book.author_name?.[0] }, book.first_publish_year);
        })).then((books) => books.filter((book): book is Book => book !== null)))
      .catch((error) => { console.warn("[OpenLibrary] Search unavailable:", error); return []; }),
    fetchProviderJson(`https://en.wikisource.org/w/api.php?action=query&list=search&srnamespace=0&srlimit=8&format=json&srsearch=${encodedQuery}`)
      .then((data) => (data.query?.search || []).map((page: any): Book => ({
        id: `wikisource:${page.pageid}`,
        title: page.title,
        author: "Wikisource",
        coverUrl: "/placeholder-book.jpg",
        readUrl: `https://en.wikisource.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&pageids=${page.pageid}&format=json`,
        source: "wikisource",
        coverColor: "#fff",
        isFullyReadable: true,
      })))
      .catch((error) => { console.warn("[Wikisource] Search unavailable:", error); return []; }),
  ]);

  const sourceRank: Record<string, number> = {
    gutenberg: 0,
    wikisource: 1,
    internetarchive: 2,
  };
  const results = providers.flat()
    .filter((book) => book.isFullyReadable && book.readUrl && matchesBookQuery(book, query))
    .sort((a, b) => (sourceRank[a.source || ""] ?? 9) - (sourceRank[b.source || ""] ?? 9));
  const byTitle = new Map<string, Book>();
  for (const book of results) {
    const normalizedTitle = book.title
      .toLowerCase()
      .replace(/\b(?:18|19|20)\d{2}\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const existing = byTitle.get(normalizedTitle);
    if (!existing || (sourceRank[book.source || ""] ?? 9) < (sourceRank[existing.source || ""] ?? 9)) {
      byTitle.set(normalizedTitle, book);
    }
  }
  const uniqueResults = Array.from(byTitle.values());
  cache.set(normalizedQuery, { data: uniqueResults, timestamp: Date.now() });
  return uniqueResults;
}

// =====================================
// 🔍 Fetch Book By Source (For Reader)
// =====================================
export async function fetchBookBySource(rawId: string, overrides: ReaderOverrides = {}) {
  if (!rawId) return null;

  const decoded = decodeURIComponent(rawId);
  const [source, idPart] = decoded.split(":");

  try {
    switch (source) {
      // 🏛️ Gutenberg - Only source that works in-app
      case "gutenberg": {
        const cleanId = idPart.replace(/\D/g, "");
          if (isTrustedTextUrl(source, overrides.readUrl)) {
            return {
              id: cleanId,
              title: overrides.title || "Untitled",
              author: overrides.author || "Unknown",
              coverUrl: overrides.coverUrl || "/placeholder-book.jpg",
              readUrl: overrides.readUrl,
              source: "gutenberg",
              isFullyReadable: true,
            };
          }
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

      case "internetarchive": {
        const archiveBook = await getOpenArchiveBook({ identifier: idPart });
        if (!archiveBook?.readUrl) return null;
        const textUrl = isTrustedTextUrl(source, overrides.readUrl) ? overrides.readUrl! : archiveBook.readUrl;
        const textResponse = await fetch(textUrl);
        if (!textResponse.ok) return null;
        const textContent = await textResponse.text();
        if (!textContent.trim()) return null;
        return { ...archiveBook, textContent, isFullyReadable: true };
      }

      case "wikisource": {
        const textUrl = isTrustedTextUrl(source, overrides.readUrl)
          ? overrides.readUrl!
          : `https://en.wikisource.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&pageids=${encodeURIComponent(idPart)}&format=json`;
        const response = await fetchProviderJson(textUrl);
        const page = response.query?.pages?.[idPart];
        const textContent = page?.extract;
        if (!textContent?.trim()) return null;
        return {
          id: idPart,
          title: page.title || "Untitled",
          author: "Wikisource",
          coverUrl: "/placeholder-book.jpg",
          source: "wikisource",
          textContent,
          isFullyReadable: true,
        };
      }

      case "internetarchive": {
        const archiveBook = await getOpenArchiveBook({ identifier: idPart });
        if (!archiveBook?.readUrl) return null;
        const textResponse = await fetch(archiveBook.readUrl);
        if (!textResponse.ok) return null;
        const textContent = await textResponse.text();
        if (!textContent.trim()) return null;
        return { ...archiveBook, textContent, isFullyReadable: true };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("fetchBookBySource failed:", error);
    return null;
  }
}