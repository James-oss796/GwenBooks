import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/fetchBooks";
import searchRateLimit, { limitSearchLocally } from "@/lib/searchRateLimit";
import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { rankAndDeduplicate } from "@/lib/books/providers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query?.trim() || query.trim().length < 2) {
    return NextResponse.json({ error: "Enter at least two characters to search." }, { status: 400 });
  }
  if (query.length > 120) return NextResponse.json({ error: "Search must be 120 characters or fewer." }, { status: 400 });

  const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = await Promise.race([
    searchRateLimit.limit(ip).catch((error) => {
      console.error("Book search rate limiter unavailable:", error instanceof Error ? error.message : "unknown error");
      return null;
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 800)),
  ]);
  const effectiveRateLimit = rateLimitResult || limitSearchLocally(ip);
  if (!rateLimitResult) console.warn("Book search rate limiter unavailable; applying instance-local fallback.");
  if (!effectiveRateLimit.success) {
    return NextResponse.json({ error: "Search limit reached. Please wait briefly and try again." }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((effectiveRateLimit.reset - Date.now()) / 1000))) } });
  }

  const result = await searchBooks(query);
  const session = await auth();
  if (session?.user?.id) {
    const [viewer] = await db.select({ status: users.status }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (viewer?.status === "APPROVED") {
      const pattern = `%${query.trim().replace(/[\\%_]/g, "\\$&")}%`;
      const sharedBooks = await db.select({
        id: uploaded_books.id, title: uploaded_books.title, author: uploaded_books.author,
        description: uploaded_books.description, genre: uploaded_books.genre, language: uploaded_books.language,
        coverUrl: uploaded_books.coverUrl, fileType: uploaded_books.fileType,
      }).from(uploaded_books).where(and(
        eq(uploaded_books.status, "APPROVED"), eq(uploaded_books.isPublic, true),
        or(ilike(uploaded_books.title, pattern), ilike(uploaded_books.author, pattern), ilike(uploaded_books.description, pattern)),
      )).limit(12);
      const communityResults = sharedBooks.map((book) => ({
        id: `uploaded:${book.id}`, source: "uploaded" as const, sourceId: String(book.id), title: book.title,
        author: book.author || undefined, description: book.description || undefined, genre: book.genre || "Community book",
        language: book.language || undefined, coverUrl: book.coverUrl || "", coverColor: "#f4efe6",
        fileType: book.fileType === "epub" ? "epub" as const : "pdf" as const,
        sourceUrl: `/books/shared/${book.id}`, readUrl: `/read/uploaded%3A${book.id}`,
        availability: "readable_in_app" as const, isFullyReadable: true,
        sources: [{ name: "GwenBooks community library", url: `/books/shared/${book.id}`, availability: "readable_in_app" as const }],
      }));
      result.results = rankAndDeduplicate([...result.results, ...communityResults], query);
    }
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } });
}
