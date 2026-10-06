import { NextRequest, NextResponse } from "next/server";
import { isOpenCommercialReuseLicense } from "@/lib/books/openLicense";

const ALLOWED_ARCHIVE_HOSTS = new Set(["archive.org", "www.archive.org"]);
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const archiveId = request.nextUrl.searchParams.get("archiveId") || "";
  if (!/^[A-Za-z0-9._-]{2,120}$/.test(archiveId)) return NextResponse.json({ error: "Invalid Internet Archive book identifier." }, { status: 400 });

  try {
    const metadataResponse = await fetch(`https://archive.org/metadata/${encodeURIComponent(archiveId)}`, { signal: AbortSignal.timeout(7000) });
    if (!metadataResponse.ok) return NextResponse.json({ error: "The source catalog could not be reached." }, { status: 502 });
    const metadata = await metadataResponse.json() as { metadata?: { licenseurl?: string; "access-restricted-item"?: boolean }; files?: Array<{ name?: string }> };
    if (metadata.metadata?.["access-restricted-item"] === true || !isOpenCommercialReuseLicense(metadata.metadata?.licenseurl)) {
      return NextResponse.json({ error: "This Archive.org item does not expose a verified open license for download." }, { status: 403 });
    }
    const pdf = metadata.files?.find((file) => /\.pdf$/i.test(file.name || "") && !/(?:meta|cover|thumbnail)/i.test(file.name || ""));
    if (!pdf?.name) return NextResponse.json({ error: "No downloadable PDF is available for this item." }, { status: 404 });

    const encodedPath = pdf.name.split("/").map(encodeURIComponent).join("/");
    const target = new URL(`https://archive.org/download/${encodeURIComponent(archiveId)}/${encodedPath}`);
    if (!ALLOWED_ARCHIVE_HOSTS.has(target.hostname)) return NextResponse.json({ error: "Unsupported download source." }, { status: 400 });
    const upstream = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(30000) });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "The source file is temporarily unavailable." }, { status: 502 });
    const finalUrl = new URL(upstream.url);
    if (finalUrl.protocol !== "https:" || !(ALLOWED_ARCHIVE_HOSTS.has(finalUrl.hostname) || finalUrl.hostname.endsWith(".archive.org"))) return NextResponse.json({ error: "The source redirected to an unsupported host." }, { status: 502 });
    const filename = (pdf.name.split("/").pop() || `${archiveId}.pdf`).replace(/[\\/"\r\n]/g, "_");
    return new Response(upstream.body, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Open-license download failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not prepare this download." }, { status: 502 });
  }
}
