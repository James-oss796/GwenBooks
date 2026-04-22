import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const uploads = await db.query.uploaded_books.findMany({
      where: eq(uploaded_books.uploaderId, user.id),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return NextResponse.json({ uploads });
  } catch (err) {
    console.error("Fetching uploads failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
