import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const encoded = encodeURIComponent(title.trim());
  const results: { source: string; url: string; format: string }[] = [];

  try {
    // --- Gutenberg ---
    const gutenbergRes = await fetch(`https://gutendex.com/books?search=${encoded}`);
    const gutenbergData = await gutenbergRes.json();
    if (gutenbergData.results?.length) {
      const match = gutenbergData.results[0];
      const pdf = match.formats["application/pdf"];
      const txt = match.formats["text/plain; charset=utf-8"];
      if (pdf) results.push({ source: "Gutenberg", url: pdf, format: "PDF" });
      else if (txt) results.push({ source: "Gutenberg", url: txt, format: "TXT" });
    }

    // --- Open Library ---
    const olRes = await fetch(`https://openlibrary.org/search.json?title=${encoded}`);
    const olData = await olRes.json();
    if (olData.docs?.length) {
      const doc = olData.docs[0];
      if (doc.key) {
        results.push({
          source: "OpenLibrary",
          url: `https://openlibrary.org${doc.key}`,
          format: "READ",
        });
      }
    }

    // --- Internet Archive ---
    const iaRes = await fetch(
      `https://archive.org/advancedsearch.php?q=${encoded}&fl[]=identifier&output=json`
    );
    const iaData = await iaRes.json();
    if (iaData?.response?.docs?.length) {
      const id = iaData.response.docs[0].identifier;
      results.push({
        source: "Internet Archive",
        url: `https://archive.org/download/${id}`,
        format: "ZIP",
      });
    }

    return NextResponse.json({ links: results });
  } catch (err) {
    console.error("Scrape failed", err);
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  }
}
