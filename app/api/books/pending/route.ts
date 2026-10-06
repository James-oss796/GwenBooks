import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  try {
    const books = await db
      .select({
        id: uploaded_books.id,
        title: uploaded_books.title,
        author: uploaded_books.author,
        description: uploaded_books.description,
        genre: uploaded_books.genre,
        language: uploaded_books.language,
        fileType: uploaded_books.fileType,
        requestedPublic: uploaded_books.requestedPublic,
        rightsAttested: uploaded_books.rightsAttested,
        createdAt: uploaded_books.createdAt,
        uploaderEmail: users.email,
      })
      .from(uploaded_books)
      .innerJoin(users, eq(users.id, uploaded_books.uploaderId))
      .where(eq(uploaded_books.status, "PENDING"));

    return NextResponse.json({ books: books.map((book) => ({ ...book, fileUrl: `/api/user/books/${book.id}/file` })) });
  } catch (error) {
    console.error("Error fetching pending books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
