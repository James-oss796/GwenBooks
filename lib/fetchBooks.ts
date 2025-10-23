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

        // fallback: any readable format
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

      default:
        return null;
    }
  } catch (error) {
    console.error("fetchBookBySource failed:", error);
    return null;
  }
}
