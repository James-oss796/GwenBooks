import { db } from "@/DATABASE/drizzle";
import { uploaded_books } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = form.get("id");

    if (!id) return NextResponse.json({ error: "Missing book ID" }, { status: 400 });

    await db
      .update(uploaded_books)
      .set({ status: "APPROVED", isPublic: true })
      .where(eq(uploaded_books.id, Number(id)));

    return NextResponse.redirect("/admin/approvals");
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
