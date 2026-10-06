import { NextResponse } from "next/server";
import { getUploadedBookFile } from "@/lib/uploadedBookAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid book ID." }, { status: 400 });

  try {
    const result = await getUploadedBookFile(id);
    if ("error" in result && result.error) {
      const status = result.error === "unauthenticated" ? 401 : result.error === "forbidden" ? 403 : result.error === "storage_unavailable" ? 503 : 404;
      return NextResponse.json({ error: result.error === "storage_unavailable" ? "Private book storage is temporarily unavailable." : "This book is unavailable." }, { status });
    }
    if (!("data" in result)) return NextResponse.json({ error: "This book is unavailable." }, { status: 404 });
    const type = result.book.fileType === "epub" ? "application/epub+zip" : "application/pdf";
    return new Response(result.data.stream(), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(result.data.size),
        "Content-Disposition": `inline; filename="${result.book.title.replace(/[\r\n"\\]/g, "_")}.${result.book.fileType || "pdf"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Private book delivery failed:", error);
    return NextResponse.json({ error: "The book file could not be opened." }, { status: 500 });
  }
}
