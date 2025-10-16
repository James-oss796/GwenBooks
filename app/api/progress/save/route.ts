// app/api/progress/save/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { reading_progress } from "@/DATABASE/schema";

export async function POST(req: Request) {
  const user = await auth();
  const { bookId, pageIndex } = await req.json();

  // if user logged in, upsert reading progress
  if (user) {
    await db
      .insert(reading_progress)
      .values({ userId: user.user.id, bookId: String(bookId), pageIndex: Number(pageIndex) })
      .onConflictDoUpdate({
        target: reading_progress.userId,
        set: { pageIndex: Number(pageIndex) },
      });
  }

  return NextResponse.json({ ok: true });
}
