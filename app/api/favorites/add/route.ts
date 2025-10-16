// app/api/favorites/add/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // your server auth helper
import { db } from "@/DATABASE/drizzle"; // your drizzle instance
import { favorites } from "@/DATABASE/schema"; // favorites table

export async function POST(req: Request) {
  const user = await auth(); // returns session or null
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookId, title, author, coverUrl } = body;
  if (!bookId) return NextResponse.json({ error: "bookId required" }, { status: 400 });

  // insert into DB
  await db.insert(favorites).values({
    userId: user.user.id,
    bookId: String(bookId),
    title,
    author,
    coverUrl,
  });

  return NextResponse.json({ ok: true });
}
