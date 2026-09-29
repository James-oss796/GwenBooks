import { NextRequest, NextResponse } from "next/server";
import { fetchBooks } from "@/lib/fetchBooks";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  return NextResponse.json({ results: await fetchBooks(query.trim()) });
}
