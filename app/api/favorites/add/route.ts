// app/api/favorites/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle"; // your drizzle instance
import { favorites } from "@/DATABASE/schema";
import { and, eq } from "drizzle-orm";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";

export async function POST(req: Request) {
  const user = await requireApprovedUser();
  if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: user.status });

  let body: { bookId?: unknown; title?: unknown; author?: unknown; coverUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
  if (!bookId || bookId.length > 200) return NextResponse.json({ error: "Valid bookId is required" }, { status: 400 });

  const [existing] = await db.select({ id: favorites.id }).from(favorites).where(
    and(eq(favorites.bookId, bookId), eq(favorites.userId, user.userId)),
  ).limit(1);
  if (existing) return NextResponse.json({ ok: true });

  await db.insert(favorites).values({
    userId: user.userId,
    bookId,
    title: typeof body.title === "string" ? body.title.slice(0, 255) : null,
    author: typeof body.author === "string" ? body.author.slice(0, 255) : null,
    coverUrl: typeof body.coverUrl === "string" ? body.coverUrl.slice(0, 2000) : null,
  });

  return NextResponse.json({ ok: true });
}
