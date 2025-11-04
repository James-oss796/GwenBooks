import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const books = await db
      .select({
        id: uploaded_books.id,
        title: uploaded_books.title,
        description: uploaded_books.description,
        genre: uploaded_books.genre,
      })
      .from(uploaded_books)
      .innerJoin(users, eq(users.id, uploaded_books.uploaderId))
      .where(eq(uploaded_books.status, "pending"));

    return NextResponse.json({ books });
  } catch (error) {
    console.error("❌ Error fetching pending books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
