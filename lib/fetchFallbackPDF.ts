// lib/fetchFallbackPDF.ts

export async function fetchFallbackPDF(id: string, source: string) {
  try {
    // 🟢 Handle Open Library sources
    if (source === "openlibrary") {
      // 1. Try to get the work metadata
      const workUrl = `https://openlibrary.org/works/${id}.json`;
      const workRes = await fetch(workUrl);
      if (!workRes.ok) throw new Error(`OpenLibrary work fetch failed (${workRes.status})`);

      const workData = await workRes.json();

      // 2. Try to extract Internet Archive identifier
      const iaId = workData?.ia?.[0];
      if (iaId) {
        // Construct possible PDF link from Internet Archive
        const pdfUrl = `https://archive.org/download/${iaId}/${iaId}.pdf`;
        const check = await fetch(pdfUrl, { method: "HEAD" });
        if (check.ok) return pdfUrl;

        // Fallback: try EPUB
        const epubUrl = `https://archive.org/download/${iaId}/${iaId}.epub`;
        const checkEpub = await fetch(epubUrl, { method: "HEAD" });
        if (checkEpub.ok) return epubUrl;
      }

      // 3. Try edition-level lookup if IA link missing
      if (workData?.links?.length) {
        const archiveLink = workData.links.find((l: any) =>
          l.url?.includes("archive.org")
        );
        if (archiveLink) {
          const match = archiveLink.url.match(/details\/([^/]+)/);
          if (match) {
            const identifier = match[1];
            return `https://archive.org/download/${identifier}/${identifier}.pdf`;
          }
        }
      }
    }

    // 🟠 Handle Internet Archive sources
    if (source === "internetarchive") {
      // 1. Get metadata
      const metaUrl = `https://archive.org/metadata/${id}`;
      const metaRes = await fetch(metaUrl);
      if (!metaRes.ok) throw new Error(`Internet Archive metadata fetch failed (${metaRes.status})`);

      const meta = await metaRes.json();
      if (meta?.files?.length) {
        // 2. Look for best possible file
        const priority = [".pdf", ".epub", ".txt"];
        for (const ext of priority) {
          const file = meta.files.find((f: any) => f.name.endsWith(ext));
          if (file) {
            return `https://archive.org/download/${id}/${file.name}`;
          }
        }
      }
    }

    // 🔴 Default: no link found
    return null;
  } catch (err) {
    console.error("❌ Failed to fetch fallback PDF:", err);
    return null;
  }
}
