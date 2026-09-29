import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "assets.openstax.org",
  "archive.org",
  "www.gutenberg.org",
]);

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".archive.org");
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const archiveId = request.nextUrl.searchParams.get("archiveId");
  if (!rawUrl && !archiveId) {
    return NextResponse.json({ error: "Missing download URL" }, { status: 400 });
  }

  let target: URL;
  let filename: string;
  if (archiveId) {
    if (!/^[A-Za-z0-9._-]+$/.test(archiveId)) {
      return NextResponse.json({ error: "Invalid Archive.org identifier" }, { status: 400 });
    }
    try {
      const metadataRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(archiveId)}`);
      if (!metadataRes.ok) throw new Error("Metadata unavailable");
      const metadata = await metadataRes.json();
      const pdf = metadata.files?.find((file: { name?: string }) => file.name?.toLowerCase().endsWith(".pdf"));
      if (!pdf?.name) {
        return NextResponse.json({ error: "No PDF is available for this book" }, { status: 404 });
      }
      filename = pdf.name.split("/").pop() || "book.pdf";
      const encodedPath = pdf.name.split("/").map(encodeURIComponent).join("/");
      target = new URL(`https://archive.org/download/${encodeURIComponent(archiveId)}/${encodedPath}`);
    } catch {
      return NextResponse.json({ error: "Could not locate the book PDF" }, { status: 502 });
    }
  } else {
    try {
      target = new URL(rawUrl!);
    } catch {
      return NextResponse.json({ error: "Invalid download URL" }, { status: 400 });
    }
    filename = decodeURIComponent(target.pathname.split("/").pop() || "book.pdf");
  }

  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Unsupported download host" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, { redirect: "follow" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Book file is unavailable" }, { status: 502 });
    }
    const finalUrl = new URL(upstream.url);
    if (finalUrl.protocol !== "https:" || !isAllowedHost(finalUrl.hostname)) {
      return NextResponse.json({ error: "Unsupported download redirect" }, { status: 502 });
    }

    filename = filename.replace(/[\\/"\r\n]/g, "_");
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not download the book file" }, { status: 502 });
  }
}