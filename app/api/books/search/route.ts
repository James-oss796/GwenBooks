import { NextRequest, NextResponse } from "next/server";

const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json?q=";
const INTERNET_ARCHIVE_SEARCH = "https://archive.org/advancedsearch.php?q=";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  let results: any[] = [];

  // 1. Search Open Library
  try {
    const olRes = await fetch(`${OPEN_LIBRARY_SEARCH}${encodeURIComponent(query)}&limit=10`);
    const olData = await olRes.json();

    if (olData.docs?.length) {
      results = olData.docs.map((book: any) => ({
        id: book.key,
        title: book.title,
        author: book.author_name?.join(", ") || "Unknown",
        cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
        url: `https://openlibrary.org${book.key}`, // fallback for direct link
        source: "openlibrary",
      }));
    }
  } catch (err) {
    console.error("Open Library fetch error:", err);
  }

  // 2. Fallback to Internet Archive if fewer than 10
  if (results.length < 10) {
    try {
      const iaRes = await fetch(
        `${INTERNET_ARCHIVE_SEARCH}title:${encodeURIComponent(query)}&fl[]=identifier,title,creator&output=json&rows=10`
      );
      const iaData = await iaRes.json();

      if (iaData.response.docs?.length) {
        const iaResults = iaData.response.docs
          .filter((book: any) => !results.find(r => r.title === book.title)) // remove duplicates
          .map((book: any) => ({
            id: book.identifier,
            title: book.title,
            author: book.creator || "Unknown",
            cover: `https://archive.org/services/img/${book.identifier}`,
            url: `https://archive.org/details/${book.identifier}`,
            source: "internetarchive",
          }));
        results.push(...iaResults);
      }
    } catch (err) {
      console.error("Internet Archive fetch error:", err);
    }
  }

  return NextResponse.json({ results });
}
