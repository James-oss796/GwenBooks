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
      .set({ status: "rejected", adminNote: "Rejected by admin review" })
      .where(eq(uploaded_books.id, Number(id)));

    return NextResponse.redirect("/admin/approvals");
  } catch (error) {
    console.error("Rejection error:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
