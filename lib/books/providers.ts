import type { Book } from "@/types";
import { isOpenCommercialReuseLicense } from "@/lib/books/openLicense";

export type ProviderName = "Project Gutenberg" | "Internet Archive" | "Open Library" | "Google Books" | "Wikisource";
export type ProviderResult = { books: Book[]; status: "ok" | "empty" | "error" };

export interface BookProvider {
  name: ProviderName;
  search(query: string, signal: AbortSignal): Promise<Book[]>;
}

type GutenbergItem = { id: number; title?: string; authors?: Array<{ name?: string }>; formats?: Record<string, string>; subjects?: string[]; languages?: string[] };
type OpenLibraryItem = { key?: string; title?: string; author_name?: string[]; first_sentence?: string[] | string; subject?: string[]; first_publish_year?: number; language?: string[]; publisher?: string[]; isbn?: string[]; cover_i?: number };
type GoogleItem = { id: string; volumeInfo?: { title?: string; authors?: string[]; subtitle?: string; description?: string; categories?: string[]; publishedDate?: string; publisher?: string; industryIdentifiers?: Array<{ identifier?: string }>; language?: string; imageLinks?: { thumbnail?: string; smallThumbnail?: string }; infoLink?: string; previewLink?: string }; accessInfo?: { embeddable?: boolean; viewability?: string } };
type WikiItem = { pageid: number; title?: string; wordcount?: number };
type ArchiveFile = { name?: string; format?: string; size?: string };
type ArchiveItem = { identifier?: string; title?: string; creator?: string | string[]; description?: string | string[]; subject?: string | string[]; language?: string | string[]; licenseurl?: string; rights?: string; "access-restricted-item"?: boolean; files?: ArchiveFile[] };

const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).map((item) => item.trim()) : [];
const first = (...values: unknown[]) => values.map(text).find(Boolean);
const book = (fields: Partial<Book> & Pick<Book, "id" | "title" | "source">, provider: ProviderName): Book => {
  const availability = fields.availability || (fields.isFullyReadable ? "readable_in_app" : "source_only");
  return {
    ...fields, author: fields.author || undefined, coverUrl: fields.coverUrl || "", coverColor: "#f4efe6", availability,
    sources: [{ name: provider, url: fields.sourceUrl, availability }],
  };
};

async function json<T>(url: string, signal: AbortSignal): Promise<T> {
  const contact = process.env.OPEN_LIBRARY_CONTACT_EMAIL;
  let response: Response;
  for (let attempt = 0; ; attempt++) {
    response = await fetch(url, { signal, headers: { "User-Agent": `GwenBooks/1.0${contact ? ` (${contact})` : ""}` } });
    if (response.status !== 429 || attempt >= 1) break;
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? Math.min(1000, retryAfter * 1000) : 500));
  }
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json() as Promise<T>;
}

export const providers: BookProvider[] = [
  {
    name: "Project Gutenberg",
    async search(query, signal) {
      const data = await json<{ results?: GutenbergItem[] }>(`https://gutendex.com/books?search=${encodeURIComponent(query)}`, signal);
      return (data.results || []).map((item) => {
        const formats = item.formats || {};
        const sourceUrl = `https://www.gutenberg.org/ebooks/${item.id}`;
        return book({
          id: `gutenberg:${item.id}`, source: "gutenberg", sourceId: String(item.id), title: text(item.title) || "Untitled",
          author: item.authors?.map((author) => text(author.name)).filter(Boolean).join(", "),
          // Gutenberg's linking guidance asks third-party sites not to inline hosted images/files.
          sourceUrl,
          formats: Object.keys(formats), subjects: strings(item.subjects), language: strings(item.languages)[0],
          isFullyReadable: false, availability: "source_only",
        }, "Project Gutenberg");
      });
    },
  },
  {
    name: "Internet Archive",
    async search(query, signal) {
      const escaped = query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const searchUrl = new URL("https://archive.org/advancedsearch.php");
      searchUrl.searchParams.set("q", `title:"${escaped}" OR creator:"${escaped}"`);
      for (const field of ["identifier", "title", "creator"]) searchUrl.searchParams.append("fl[]", field);
      searchUrl.searchParams.set("rows", "8");
      searchUrl.searchParams.set("page", "1");
      searchUrl.searchParams.set("output", "json");
      const data = await json<{ response?: { docs?: Array<{ identifier?: string; title?: string; creator?: string | string[] }> } }>(searchUrl.toString(), signal);
      const items = (data.response?.docs || []).filter((item) => item.identifier && item.title).slice(0, 6);
      return Promise.all(items.map(async (item) => {
        const id = item.identifier!;
        const fallback = book({ id: `internetarchive:${id}`, source: "internetarchive", sourceId: id, title: text(item.title) || "Untitled", author: Array.isArray(item.creator) ? item.creator.join(", ") : text(item.creator), sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`, availability: "source_only" }, "Internet Archive");
        try {
          const meta = await json<{ metadata?: ArchiveItem; files?: ArchiveFile[] }>(`https://archive.org/metadata/${encodeURIComponent(id)}`, signal);
          const record = meta.metadata || {};
          const license = record.licenseurl;
          if (!isOpenCommercialReuseLicense(license) || record["access-restricted-item"] === true) return fallback;
          const files = meta.files || record.files || [];
          const textFile = files.find((file) => /\.txt$/i.test(file.name || "") && !/(?:meta|marc|files\.txt|contents)/i.test(file.name || ""));
          const pdfFile = files.find((file) => /\.pdf$/i.test(file.name || "") && !/(?:meta|cover|thumbnail)/i.test(file.name || ""));
          const readUrl = textFile?.name ? `https://archive.org/download/${encodeURIComponent(id)}/${textFile.name.split("/").map(encodeURIComponent).join("/")}` : undefined;
          return book({
            ...fallback, author: Array.isArray(record.creator) ? record.creator.join(", ") : first(record.creator, item.creator) || undefined,
            description: first(Array.isArray(record.description) ? record.description[0] : record.description),
            subjects: strings(record.subject).slice(0, 8), language: strings(record.language)[0],
            coverUrl: `https://archive.org/services/img/${encodeURIComponent(id)}`, sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
            readUrl, downloadId: pdfFile ? id : undefined, formats: files.map((file) => text(file.format)).filter((value): value is string => !!value),
            isFullyReadable: !!readUrl, availability: readUrl ? "readable_in_app" : "source_only",
          }, "Internet Archive");
        } catch { return fallback; }
      }));
    },
  },
  {
    name: "Open Library",
    async search(query, signal) {
      const data = await json<{ docs?: OpenLibraryItem[] }>(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`, signal);
      return (data.docs || []).map((item) => {
        const key = text(item.key);
        const workId = key?.replace(/^\/works\//, "");
        return book({
          id: `openlibrary:${workId || encodeURIComponent(item.title || "unknown")}`, source: "openlibrary",
          sourceId: key, title: text(item.title) || "Untitled", author: strings(item.author_name).join(", ") || undefined,
          description: text(Array.isArray(item.first_sentence) ? item.first_sentence[0] : item.first_sentence), subjects: strings(item.subject).slice(0, 8),
          publicationDate: item.first_publish_year ? String(item.first_publish_year) : undefined,
          language: strings(item.language)[0], publisher: strings(item.publisher)[0], isbn: strings(item.isbn).slice(0, 3),
          coverUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : undefined,
          sourceUrl: key ? `https://openlibrary.org${key}` : undefined, availability: "source_only",
        }, "Open Library");
      });
    },
  },
  {
    name: "Google Books",
    async search(query, signal) {
      const key = process.env.GOOGLE_BOOKS_API_KEY;
      if (!key) return [];
      const data = await json<{ items?: GoogleItem[] }>(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&key=${encodeURIComponent(key)}`, signal);
      return (data.items || []).map((item) => {
        const info = item.volumeInfo || {};
        const access = item.accessInfo || {};
        const readUrl = access.embeddable && access.viewability === "ALL_PAGES" ? text(info.previewLink) : undefined;
        const image = first(info.imageLinks?.thumbnail, info.imageLinks?.smallThumbnail)?.replace(/^http:/, "https:");
        return book({
          id: `googlebooks:${item.id}`, source: "googlebooks", sourceId: text(item.id), title: text(info.title) || "Untitled",
          author: strings(info.authors).join(", ") || undefined, subtitle: text(info.subtitle), description: text(info.description),
          subjects: strings(info.categories), publicationDate: text(info.publishedDate), publisher: text(info.publisher),
          isbn: (info.industryIdentifiers || []).map((identifier) => text(identifier.identifier)).filter((value): value is string => !!value),
          language: text(info.language), coverUrl: image, readUrl, sourceUrl: first(info.infoLink, info.previewLink),
          availability: readUrl ? "external_preview" : "source_only", isFullyReadable: false,
        }, "Google Books");
      });
    },
  },
  {
    name: "Wikisource",
    async search(query, signal) {
      const data = await json<{ query?: { search?: WikiItem[] } }>(`https://en.wikisource.org/w/api.php?action=query&list=search&srnamespace=0&srprop=wordcount&srlimit=10&format=json&origin=*&srsearch=${encodeURIComponent(query)}`, signal);
      const items = (data.query?.search || []).filter((item) => !/\/(?:chapter|book|volume)\b/i.test(item.title || ""));
      const chapterRoots = new Set<number>();
      await Promise.all(items.filter((item) => (item.wordcount || 0) < 10000).slice(0, 4).map(async (item) => {
        try {
          const tree = await json<{ query?: { pages?: Record<string, { links?: Array<{ title?: string }> }> } }>(`https://en.wikisource.org/w/api.php?action=query&prop=links&plnamespace=0&pllimit=max&pageids=${item.pageid}&format=json`, signal);
          const title = item.title || "";
          const chapters = Object.values(tree.query?.pages || {}).flatMap((page) => page.links || []).filter((link) => link.title && link.title.startsWith(`${title}/Chapter`));
          if (chapters.length >= 10) chapterRoots.add(item.pageid);
        } catch { /* A catalog match can still be shown without an in-app reading action. */ }
      }));
      return items.map((item) => {
        const readable = (typeof item.wordcount === "number" && item.wordcount >= 10000) || chapterRoots.has(item.pageid);
        return book({
          id: `wikisource:${item.pageid}`, source: "wikisource", sourceId: String(item.pageid), title: text(item.title) || "Untitled",
          author: undefined, sourceUrl: `https://en.wikisource.org/?curid=${item.pageid}`,
          ...(readable ? { readUrl: `https://en.wikisource.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&pageids=${item.pageid}&format=json` } : {}),
          availability: readable ? "readable_in_app" : "source_only",
          isFullyReadable: readable,
        }, "Wikisource");
      });
    },
  },
];

export function normalizeQuery(query: string) {
  return query.normalize("NFKC").toLocaleLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function editDistanceAtMost(left: string, right: string, maximum: number) {
  if (Math.abs(left.length - right.length) > maximum) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    let rowMinimum = i;
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
      rowMinimum = Math.min(rowMinimum, current[j]);
    }
    if (rowMinimum > maximum) return false;
    previous = current;
  }
  return previous[right.length] <= maximum;
}

function hasTerm(term: string, fieldWords: string[]) {
  const maximumDistance = Math.max(1, Math.floor(term.length * 0.17));
  return fieldWords.some((word) => word.includes(term) || (term.length >= 5 && editDistanceAtMost(term, word, maximumDistance)));
}

export async function searchProvider(provider: BookProvider, query: string): Promise<ProviderResult> {
  const controller = new AbortController();
  // Providers can take several seconds from a local or cold serverless instance.
  // They still run concurrently, so this is a ceiling rather than serial latency.
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const books = await provider.search(query, controller.signal);
    return { books, status: books.length ? "ok" : "empty" };
  } catch (error) {
    console.warn(`[Book search] ${provider.name} unavailable:`, error instanceof Error ? error.message : "unknown error");
    return { books: [], status: "error" };
  } finally { clearTimeout(timeout); }
}

export function rankAndDeduplicate(books: Book[], query: string) {
  const normalized = normalizeQuery(query);
  const queryTerms = normalized.split(" ").filter((term) => term.length > 1);
  const score = (item: Book) => {
    const title = normalizeQuery(item.title);
    const author = normalizeQuery(item.author || "");
    const titleWords = title.split(" ");
    const authorWords = author.split(" ");
    const titleExact = title === normalized;
    const authorExact = author === normalized;
    const overlap = queryTerms.filter((term) => hasTerm(term, [...titleWords, ...authorWords])).length / Math.max(queryTerms.length, 1);
    const completeness = [item.author, item.description, item.coverUrl, item.publicationDate, item.subjects?.length].filter(Boolean).length;
    return (titleExact ? 100 : 0) + (authorExact ? 80 : 0) + overlap * 40 + (item.isFullyReadable ? 12 : 0) + completeness;
  };
  const matches = books.filter((item) => {
    const fields = normalizeQuery(`${item.title} ${item.author || ""} ${item.subjects?.join(" ") || ""}`);
    const matchedTerms = queryTerms.filter((term) => hasTerm(term, fields.split(" "))).length;
    const minimumMatches = Math.max(1, Math.ceil(queryTerms.length * 0.65));
    return queryTerms.length === 0 || matchedTerms >= minimumMatches;
  });
  const unique = new Map<string, Book>();
  for (const item of matches.sort((a, b) => score(b) - score(a))) {
    const key = normalizeQuery(item.title);
    const existing = unique.get(key);
    if (!existing) unique.set(key, item);
    else {
      const availability = existing.availability === "readable_in_app" || item.availability !== "readable_in_app" ? existing.availability : item.availability;
      const sources = [...(existing.sources || [])];
      for (const source of item.sources || []) if (!sources.some((candidate) => candidate.name === source.name)) sources.push(source);
      const readableProvider = item.isFullyReadable && !existing.isFullyReadable ? item : existing;
      unique.set(key, {
        ...existing,
        ...(!existing.author && item.author ? { author: item.author } : {}),
        ...(!existing.coverUrl && item.coverUrl ? { coverUrl: item.coverUrl } : {}),
        ...(!existing.description && item.description ? { description: item.description } : {}),
        ...(!existing.subjects?.length && item.subjects?.length ? { subjects: item.subjects } : {}),
        ...(!existing.language && item.language ? { language: item.language } : {}),
        ...(!existing.publicationDate && item.publicationDate ? { publicationDate: item.publicationDate } : {}),
        ...(!existing.publisher && item.publisher ? { publisher: item.publisher } : {}),
        ...(!existing.isbn?.length && item.isbn?.length ? { isbn: item.isbn } : {}),
        ...(item.downloadId && !existing.downloadId ? { downloadId: item.downloadId } : {}),
        ...(item.downloadUrl && !existing.downloadUrl ? { downloadUrl: item.downloadUrl } : {}),
        ...(item.formats?.length && !existing.formats?.length ? { formats: item.formats } : {}),
        ...(readableProvider.isFullyReadable ? { source: readableProvider.source, sourceId: readableProvider.sourceId, readUrl: readableProvider.readUrl } : {}),
        availability, isFullyReadable: existing.isFullyReadable || item.isFullyReadable,
        sourceUrl: readableProvider.isFullyReadable ? readableProvider.sourceUrl : existing.sourceUrl || item.sourceUrl, sources,
      });
    }
  }
  return [...unique.values()].sort((a, b) => score(b) - score(a)).slice(0, 40);
}
