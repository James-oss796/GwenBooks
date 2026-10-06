import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/DATABASE/drizzle";
import { favorites } from "@/DATABASE/schema";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";

export async function GET() {
  const user = await requireApprovedUser();
  if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: user.status });

  const rows = await db.select({
    bookId: favorites.bookId,
    title: favorites.title,
    author: favorites.author,
    coverUrl: favorites.coverUrl,
  }).from(favorites).where(eq(favorites.userId, user.userId));

  return NextResponse.json({ favorites: rows });
}
