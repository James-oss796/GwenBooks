import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books } from "@/DATABASE/schema";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";
import { BOOK_UPLOAD_LIMIT, validateBookFile } from "@/lib/bookFileValidation";

const BOOKS_BUCKET = "books";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensurePrivateBooksBucket() {
  const { error } = await supabaseAdmin.storage.updateBucket(BOOKS_BUCKET, {
    public: false,
    fileSizeLimit: BOOK_UPLOAD_LIMIT,
    allowedMimeTypes: ["application/pdf", "application/epub+zip"],
  });
  return error;
}

export async function GET() {
  const access = await requireApprovedUser();
  if (!access.ok) return NextResponse.json({ error: "Sign in with an approved account to view uploads." }, { status: access.status });
  try {
    const uploads = await db.query.uploaded_books.findMany({
      where: (book, { eq }) => eq(book.uploaderId, access.userId),
      orderBy: (book, { desc }) => [desc(book.createdAt)],
      columns: { id: true, title: true, author: true, description: true, genre: true, language: true, coverUrl: true, fileType: true, fileSize: true, isPublic: true, requestedPublic: true, status: true, createdAt: true },
    });
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Fetching uploads failed:", error);
    return NextResponse.json({ error: "Your uploads could not be loaded right now." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const access = await requireApprovedUser();
  if (!access.ok) return NextResponse.json({ error: "Sign in with an approved account to upload a book." }, { status: access.status });
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength && contentLength > BOOK_UPLOAD_LIMIT + 64 * 1024) return NextResponse.json({ error: "The upload exceeds the 4 MB limit." }, { status: 413 });

  let storagePath: string | undefined;
  try {
    const formData = await req.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;
    const title = String(formData.get("title") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const genre = String(formData.get("genre") || "").trim();
    const language = String(formData.get("language") || "").trim();
    const requestedPublic = formData.get("visibility") === "public";
    const rightsAttested = formData.get("rightsAttested") === "on" || formData.get("rightsAttested") === "true";

    if (!file) return NextResponse.json({ error: "Choose a PDF or EPUB file to upload." }, { status: 400 });
    if (title.length < 2 || title.length > 255) return NextResponse.json({ error: "Title must be between 2 and 255 characters." }, { status: 400 });
    if ([author, description, genre, language].some((value) => value.length > 2000)) return NextResponse.json({ error: "Book details are too long." }, { status: 400 });
    if (requestedPublic && !rightsAttested) return NextResponse.json({ error: "Confirm that you have the right to share this file before requesting public listing." }, { status: 400 });
    const validation = await validateBookFile(file);
    if ("error" in validation) return NextResponse.json({ error: validation.error }, { status: 415 });

    const bucketError = await ensurePrivateBooksBucket();
    if (bucketError) {
      console.error("Private books bucket configuration failed:", bucketError.message);
      return NextResponse.json({ error: "Private book storage is temporarily unavailable. Please try again." }, { status: 503 });
    }

    storagePath = `user_uploads/${access.userId}/${randomUUID()}.${validation.type}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BOOKS_BUCKET).upload(storagePath, file, {
      cacheControl: "0",
      contentType: validation.type === "pdf" ? "application/pdf" : "application/epub+zip",
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: "The file could not be stored. Please try again." }, { status: 502 });

    try {
      const [record] = await db.insert(uploaded_books).values({
        uploaderId: access.userId, title, author: author || "Unknown", genre: genre || "General",
        language: language || "English", description, fileUrl: null, storagePath, fileSize: file.size,
        fileType: validation.type, isPublic: false, requestedPublic, rightsAttested,
        status: "PENDING", createdAt: new Date(),
      }).returning({ id: uploaded_books.id, title: uploaded_books.title, status: uploaded_books.status });
      return NextResponse.json({ upload: record, message: requestedPublic ? "Upload saved privately while it waits for moderator review." : "Private upload complete." }, { status: 201 });
    } catch (error) {
      await supabaseAdmin.storage.from(BOOKS_BUCKET).remove([storagePath]).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    console.error("Book upload failed:", error);
    return NextResponse.json({ error: "The book could not be uploaded. Please try again." }, { status: 500 });
  }
}
