// app/api/books/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1️⃣ Fetch main Open Library data
    const workRes = await fetch(`https://openlibrary.org/works/${id}.json`);
    if (!workRes.ok) throw new Error("Open Library work not found");
    const workData = await workRes.json();

    // 2️⃣ Try to find edition (books endpoint gives editions)
    const editionsRes = await fetch(
      `https://openlibrary.org/works/${id}/editions.json?limit=1`
    );
    const editionsData = await editionsRes.json();
    const edition = editionsData.entries?.[0];

    const coverId = edition?.covers?.[0] || workData?.covers?.[0];
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;

    // 3️⃣ Try to get archive.org identifier
    const archiveId =
      edition?.ocaid ||
      edition?.identifiers?.archive_org?.[0] ||
      workData?.ocaid;

    let downloadLinks: { format: string; url: string }[] = [];

    if (archiveId) {
      // Attempt to fetch metadata from Internet Archive
      const iaRes = await fetch(
        `https://archive.org/metadata/${archiveId}`
      );
      if (iaRes.ok) {
        const iaData = await iaRes.json();
        const files = iaData.files || [];
        for (const file of files) {
          if (file.name?.endsWith(".pdf")) {
            downloadLinks.push({
              format: "PDF",
              url: `https://archive.org/download/${archiveId}/${file.name}`,
            });
          } else if (file.name?.endsWith(".epub")) {
            downloadLinks.push({
              format: "EPUB",
              url: `https://archive.org/download/${archiveId}/${file.name}`,
            });
          }
        }
      }
    }

    // 4️⃣ Fallback links
    const fallbackLinks = {
      openLibrary: `https://openlibrary.org/works/${id}`,
      internetArchive: archiveId
        ? `https://archive.org/details/${archiveId}`
        : null,
    };

    return NextResponse.json({
      title: workData.title || edition?.title,
      author: workData.authors?.[0]?.author?.key
        ? workData.authors[0].author.key.replace("/authors/", "")
        : edition?.authors?.[0]?.name || "Unknown Author",
      coverUrl,
      downloadLinks,
      fallbackLinks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Book not found" },
      { status: 404 }
    );
  }
}
