import { NextResponse } from "next/server";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";


export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upload to Supabase storage
    const filePath = `user_uploads/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("Books") // your bucket name
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("Books")
      .getPublicUrl(filePath);

    // Insert with pending status
    await db.insert(uploaded_books).values({
      uploaderId: user.id,
      title,
      author: author || "Unknown",
      genre: genre || "General",
      language: language || "English",
      description: description || "",
      fileUrl: publicUrlData.publicUrl,
      isPublic: false,
      fileType: "pdf",
      status: "PENDING",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
