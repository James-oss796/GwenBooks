// lib/fetchBooks.ts
import { Book } from "@/types";
import { normalizeQuery, providers, rankAndDeduplicate, searchProvider } from "@/lib/books/providers";
import { isOpenCommercialReuseLicense } from "@/lib/books/openLicense";

// Simple in-memory cache
const cache = new Map<string, { data: Book[]; providerStatus: Record<string, "ok" | "empty" | "error">; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const archiveTextCache = new Map<string, Book | null>();

async function fetchProviderJson<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  for (let attempt = 0; ; attempt++) {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
    if (response.status !== 429 || attempt >= 2) break;
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? Math.min(1500, retryAfter * 1000) : 600 * (attempt + 1)));
  }
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return await response.json() as T;
}

type ReaderOverrides = Partial<Pick<Book, "title" | "author" | "coverUrl" | "readUrl" | "downloadId" | "downloadUrl">>;
type ArchiveMetadata = { metadata?: Record<string, unknown>; files?: Array<{ name?: string }> };
type ArchiveRecord = { identifier?: string; title?: string; creator?: string | string[] };
type GutenbergRecord = { id: number; title: string; authors?: Array<{ name?: string }>; formats?: Record<string, string> };
type WikisourceRecord = { query?: { pages?: Record<string, { pageid?: number; title?: string; extract?: string; links?: Array<{ title?: string }> }> } };

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

function getCached(query: string) {
  const cached = cache.get(query);
  if (!cached) return null;
  const ttl = Object.values(cached.providerStatus).some((status) => status === "error") ? 20_000 : CACHE_TTL;
  const isExpired = Date.now() - cached.timestamp > ttl;
  if (isExpired) {
    cache.delete(query);
    return null;
  }
  return cached;
}

async function getOpenArchiveBook(record: ArchiveRecord): Promise<Book | null> {
  const identifier = String(record.identifier || "");
  if (!identifier) return null;
  if (archiveTextCache.has(identifier)) return archiveTextCache.get(identifier) || null;

  try {
    const metadata = await fetchProviderJson<ArchiveMetadata>(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
    const item = metadata.metadata || {};
    const license = String(item.licenseurl || "");
    if (item["access-restricted-item"] === true || !isOpenCommercialReuseLicense(license)) {
      archiveTextCache.set(identifier, null);
      return null;
    }

    const textFile = (metadata.files || []).find((file) =>
      /\.txt$/i.test(file.name || "") && !/(?:meta|marc|files\.txt|contents)/i.test(file.name || "")
    );
    if (!textFile?.name) {
      archiveTextCache.set(identifier, null);
      return null;
    }

    const encodedPath = String(textFile.name).split("/").map(encodeURIComponent).join("/");
    const itemTitle = typeof item.title === "string" ? item.title : undefined;
    const itemCreator = typeof item.creator === "string" ? item.creator : undefined;
    const book: Book = {
      id: `internetarchive:${identifier}`,
      title: record.title || itemTitle || "Untitled",
      author: Array.isArray(record.creator) ? record.creator.join(", ") : record.creator || itemCreator || "Unknown",
      coverUrl: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
      readUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodedPath}`,
      downloadId: (metadata.files || []).some((file) => /\.pdf$/i.test(file.name || "")) ? identifier : undefined,
      source: "internetarchive",
      sourceId: identifier,
      sourceUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
      availability: "readable_in_app",
      formats: (metadata.files || []).map((file) => file.name?.split(".").pop()?.toLowerCase()).filter((value): value is string => !!value),
      coverColor: "#fff",
      isFullyReadable: true,
    };
    archiveTextCache.set(identifier, book);
    return book;
  } catch {
    return null;
  }
}

export async function searchBooks(query: string) {
  const normalized = normalizeQuery(query);
  if (normalized.length < 2 || normalized.length > 120) return { results: [] as Book[], providerStatus: {} };
  const cached = getCached(normalized);
  if (cached) return { results: cached.data, providerStatus: cached.providerStatus };
  const activeProviders = providers.filter((provider) => provider.name !== "Google Books" || !!process.env.GOOGLE_BOOKS_API_KEY);
  const responses = await Promise.all(activeProviders.map((provider) => searchProvider(provider, query.trim())));
  const providerStatus = Object.fromEntries(activeProviders.map((provider, index) => [provider.name, responses[index].status]));
  const results = rankAndDeduplicate(responses.flatMap((response) => response.books), query);
  cache.set(normalized, { data: results, providerStatus, timestamp: Date.now() });
  return { results, providerStatus };
}

export async function fetchBooks(query: string): Promise<Book[]> {
  return (await searchBooks(query)).results;
}

// =====================================
// 🔍 Fetch Book By Source (For Reader)
// =====================================
export async function fetchBookBySource(rawId: string, overrides: ReaderOverrides = {}): Promise<Book | null> {
  if (!rawId) return null;

  const decoded = decodeURIComponent(rawId);
  const [source, idPart] = decoded.split(":");

  try {
    switch (source) {
      // 🏛️ Gutenberg - Only source that works in-app
      case "gutenberg": {
        const cleanId = idPart.replace(/\D/g, "");
        const data = await fetchProviderJson<GutenbergRecord>(`https://gutendex.com/books/${cleanId}`);
        const formats = data.formats ?? {};

        return {
          id: String(data.id),
          title: data.title,
          author: data.authors?.[0]?.name || "Unknown",
          coverUrl:
            "",
          coverColor: "#ffffff",
          readUrl: `https://www.gutenberg.org/ebooks/${cleanId}`,
          source: "gutenberg",
          downloadUrl: formats["application/pdf"] || overrides.downloadUrl,
          isFullyReadable: false,
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
        const pageUrl = `https://en.wikisource.org/w/api.php?action=query&prop=extracts%7Clinks&explaintext=1&exsectionformat=plain&plnamespace=0&pllimit=max&pageids=${encodeURIComponent(idPart)}&format=json`;
        const response = await fetchProviderJson<WikisourceRecord>(pageUrl);
        const page = response.query?.pages?.[idPart];
        if (!page?.title) return null;
        const textContent = page.extract;
        if (textContent?.trim() && textContent.trim().split(/\s+/).length >= 10000) return {
          id: idPart, title: page.title, author: "Wikisource", coverUrl: "", coverColor: "#ffffff", source: "wikisource",
          sourceUrl: `https://en.wikisource.org/?curid=${idPart}`, textContent, isFullyReadable: true,
        };
        const chapters = (page.links || []).map((link) => link.title).filter((title): title is string => !!title && title.startsWith(`${page.title}/Chapter`)).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
        if (chapters.length >= 10) {
          const batches: string[][] = [];
          for (let start = 0; start < chapters.length; start += 30) batches.push(chapters.slice(start, start + 30));
          const chapterPages = await Promise.all(batches.map(async (titles) => {
            const extracts = await fetchProviderJson<WikisourceRecord>(`https://en.wikisource.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(titles.join("|"))}&format=json`);
            const byTitle = new Map(Object.values(extracts.query?.pages || {}).map((chapter) => [chapter.title, chapter]));
            return titles.map((title) => {
              const chapter = byTitle.get(title);
              return chapter?.extract?.trim() ? { id: String(chapter.pageid || title), title: title.replace(`${page.title}/`, ""), content: chapter.extract } : null;
            }).filter((chapter): chapter is { id: string; title: string; content: string } => chapter !== null);
          }));
          const fullChapters = batches.flatMap((_, index) => chapterPages[index]).filter(Boolean);
          if (fullChapters.length >= 10) return {
            id: idPart, title: page.title, author: "Wikisource", coverUrl: "", coverColor: "#ffffff", source: "wikisource",
            sourceUrl: `https://en.wikisource.org/?curid=${idPart}`, chapters: fullChapters, isFullyReadable: true,
          };
          return null;
        }
        if (!textContent?.trim() || textContent.trim().split(/\s+/).length < 10000) return null;
        return { id: idPart, title: page.title, author: "Wikisource", coverUrl: "", coverColor: "#ffffff", source: "wikisource", sourceUrl: `https://en.wikisource.org/?curid=${idPart}`, textContent, isFullyReadable: true };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("fetchBookBySource failed:", error);
    return null;
  }
}
