import { db } from "@/DATABASE/drizzle";
import { uploaded_books } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    await db.update(uploaded_books).set({ status: "rejected" }).where(eq(uploaded_books.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Rejection failed:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
