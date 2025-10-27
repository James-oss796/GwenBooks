// lib/fetchFallbackPDF.ts

/**
 * Attempts to locate a direct downloadable PDF file
 * for a given book from Internet Archive or Open Library.
 */
export async function fetchFallbackPDF(bookId: string, source: string) {
  try {
    if (source === "internetarchive") {
      // Query Internet Archive metadata API
      const res = await fetch(`https://archive.org/metadata/${bookId}`);
      if (!res.ok) return null;

      const data = await res.json();

      // Find a .pdf file among available files
      const pdfFile = data?.files?.find((f: any) => f.name?.endsWith(".pdf"));
      if (pdfFile) {
        return `https://archive.org/download/${bookId}/${pdfFile.name}`;
      }
    }

    if (source === "openlibrary") {
      // OpenLibrary PDFs are not consistently named, but this path works for some
      return `https://openlibrary.org${bookId}.pdf`;
    }

    return null;
  } catch (error) {
    console.error("Error fetching fallback PDF:", error);
    return null;
  }
}
