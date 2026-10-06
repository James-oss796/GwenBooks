// app/api/progress/save/route.ts
import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { reading_progress } from "@/DATABASE/schema";
import { and, eq, desc } from "drizzle-orm";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await requireApprovedUser();
  if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: user.status });

  const requestedBookId = req.nextUrl.searchParams.get("bookId");
  if (requestedBookId) {
    if (requestedBookId.length > 200) return NextResponse.json({ error: "Invalid book ID." }, { status: 400 });
    const [progress] = await db.select({
      bookId: reading_progress.bookId,
      pageIndex: reading_progress.pageIndex,
      title: reading_progress.title,
      author: reading_progress.author,
      coverUrl: reading_progress.coverUrl,
      updatedAt: reading_progress.updatedAt,
    }).from(reading_progress)
      .where(and(eq(reading_progress.userId, user.userId), eq(reading_progress.bookId, requestedBookId)))
      .limit(1);
    return NextResponse.json({ progress: progress || null });
  }

  const recent = await db.select({
    bookId: reading_progress.bookId,
    pageIndex: reading_progress.pageIndex,
    title: reading_progress.title,
    author: reading_progress.author,
    coverUrl: reading_progress.coverUrl,
    updatedAt: reading_progress.updatedAt,
  }).from(reading_progress)
    .where(eq(reading_progress.userId, user.userId))
    .orderBy(desc(reading_progress.updatedAt))
    .limit(20);

  return NextResponse.json({ recent });
}

export async function POST(req: Request) {
  const user = await requireApprovedUser();
  if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: user.status });

  let body: { bookId?: unknown; pageIndex?: unknown; title?: unknown; author?: unknown; coverUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
  const pageIndex = body.pageIndex;
  if (!bookId || bookId.length > 200 || !Number.isSafeInteger(pageIndex) || Number(pageIndex) < 0) {
    return NextResponse.json({ error: "Valid bookId and non-negative pageIndex are required" }, { status: 400 });
  }

  await db.insert(reading_progress)
  .values({
    userId: user.userId,
    bookId,
    pageIndex: Number(pageIndex),
    title: typeof body.title === "string" ? body.title.slice(0, 255) : null,
    author: typeof body.author === "string" ? body.author.slice(0, 255) : null,
    coverUrl: typeof body.coverUrl === "string" ? body.coverUrl.slice(0, 2000) : null,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [reading_progress.userId, reading_progress.bookId],
    set: {
      pageIndex: Number(pageIndex), updatedAt: new Date(),
      title: typeof body.title === "string" ? body.title.slice(0, 255) : undefined,
      author: typeof body.author === "string" ? body.author.slice(0, 255) : undefined,
      coverUrl: typeof body.coverUrl === "string" ? body.coverUrl.slice(0, 2000) : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
