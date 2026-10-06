import { db } from "@/DATABASE/drizzle";
import { uploaded_books } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

async function readId(req: Request): Promise<number | null> {
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const id = Number(body?.id);
      return Number.isFinite(id) ? id : null;
    }
    const form = await req.formData();
    const id = Number(form.get("id"));
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  try {
    const id = await readId(req);
    if (!id) return NextResponse.json({ error: "Missing book ID" }, { status: 400 });

    const [book] = await db.select({ requestedPublic: uploaded_books.requestedPublic, rightsAttested: uploaded_books.rightsAttested }).from(uploaded_books).where(eq(uploaded_books.id, id)).limit(1);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    if (book.requestedPublic && !book.rightsAttested) return NextResponse.json({ error: "The uploader has not confirmed rights to share this book publicly." }, { status: 400 });
    await db.update(uploaded_books)
      .set({ status: "APPROVED", isPublic: book.requestedPublic === true })
      .where(eq(uploaded_books.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
