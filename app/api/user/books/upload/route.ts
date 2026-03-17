import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { auth } from "@/auth";

const BOOKS_BUCKET = "books";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET all uploads for a user (optional, for SPA refresh)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const uploads = await db.query.uploaded_books.findMany({
      where: eq(uploaded_books.uploaderId, user.id)
    });

    return NextResponse.json({ uploads });
  } catch (err) {
    console.error("Fetching uploads failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST new upload
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const genre = formData.get("genre") as string;
    const language = formData.get("language") as string;

    if (!file || !title)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Upload to Supabase storage
    const safeName = file.name.replace(/[^\w.\-()+\s]/g, "_");
    const filePath = `user_uploads/${user.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BOOKS_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message || "Upload failed" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BOOKS_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { error: "Upload succeeded but public URL could not be generated." },
        { status: 500 }
      );
    }

    const inserted = await db.insert(uploaded_books).values({
      uploaderId: user.id,
      title,
      author: author || "Unknown",
      genre: genre || "General",
      language: language || "English",
      description: description || "",
      fileUrl: publicUrlData.publicUrl,
      isPublic: false,
      fileType: file.name.split(".").pop() || "pdf",
      status: "PENDING",
      createdAt: new Date(),
    }).returning();

    // Return the new upload immediately
    return NextResponse.json({ uploads: inserted });
  } catch (err) {
    console.error("Upload failed:", err);
    const message =
      err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}