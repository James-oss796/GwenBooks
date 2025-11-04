import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { auth } from "@/auth"; // 👈 make sure this points to your NextAuth export
import { eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase"; // 👈 ensure your Supabase client file is set up

export async function POST(req: Request) {
  try {
    // ✅ Get logged-in user from NextAuth
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Parse FormData
    const formData = await req.formData();
    const title = formData.get("title")?.toString() || "";
    const author = formData.get("author")?.toString() || "Unknown";
    const genre = formData.get("genre")?.toString() || "General";
    const language = formData.get("language")?.toString() || "English";
    const description = formData.get("description")?.toString() || "";
    const file = formData.get("file") as File | null;

    if (!file || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Upload file to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `Books/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Books")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }

    // ✅ Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from("Books")
      .getPublicUrl(filePath);
    const fileUrl = publicUrlData.publicUrl;

    // ✅ Get the uploader from DB
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Save uploaded book details
    const result = await db
      .insert(uploaded_books)
      .values({
        uploaderId: user.id,
        title,
        author,
        description,
        genre,
        language,
        fileUrl,
        coverUrl: "", // optional cover
        fileType: file.type || "pdf",
      })
      .returning();

    return NextResponse.json({ success: true, book: result[0] });
  } catch (error: any) {
    console.error("❌ Upload failed:", error);
    return NextResponse.json({ error: "Failed to upload book" }, { status: 500 });
  }
}
