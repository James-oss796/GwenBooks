import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const books = await db
      .select({
        id: uploaded_books.id,
        title: uploaded_books.title,
        author: uploaded_books.author,
        genre: uploaded_books.genre,
        language: uploaded_books.language,
        fileType: uploaded_books.fileType,
        uploaderEmail: users.email,
      })
      .from(uploaded_books)
      .leftJoin(users, eq(uploaded_books.uploaderId, users.id))
      .orderBy(uploaded_books.id);

    return NextResponse.json({ success: true, books });
  } catch (error) {
    console.error("❌ Error fetching books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
