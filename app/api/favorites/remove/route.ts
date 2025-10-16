// app/api/favorites/remove/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { favorites } from "@/DATABASE/schema";
import { eq, and } from "drizzle-orm"; // ✅ import and()

export async function POST(req: Request) {
  const user = await auth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await req.json();
  if (!bookId)
    return NextResponse.json({ error: "bookId required" }, { status: 400 });

  // ✅ Correct syntax: use eq() and and()
  await db
    .delete(favorites)
    .where(and(eq(favorites.bookId, String(bookId)), eq(favorites.userId, user.user.id)));

  return NextResponse.json({ ok: true });
}
