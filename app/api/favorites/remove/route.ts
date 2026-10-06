// app/api/favorites/remove/route.ts
import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { favorites } from "@/DATABASE/schema";
import { eq, and } from "drizzle-orm"; // ✅ import and()
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";

export async function POST(req: Request) {
  const user = await requireApprovedUser();
  if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: user.status });

  let body: { bookId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
  if (!bookId || bookId.length > 200)
    return NextResponse.json({ error: "bookId required" }, { status: 400 });

  // ✅ Correct syntax: use eq() and and()
  await db
    .delete(favorites)
    .where(and(eq(favorites.bookId, bookId), eq(favorites.userId, user.userId)));

  return NextResponse.json({ ok: true });
}
