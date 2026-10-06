import { unzipSync } from "fflate";

export const BOOK_UPLOAD_LIMIT = 4 * 1024 * 1024;
export type UploadedBookType = "pdf" | "epub";

function zipHasSafeExpandedSize(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimum = Math.max(0, bytes.length - 65_557);
  let end = -1;
  for (let cursor = bytes.length - 22; cursor >= minimum; cursor--) {
    if (view.getUint32(cursor, true) === 0x06054b50) { end = cursor; break; }
  }
  if (end < 0) return false;
  const entries = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  let expanded = 0;
  const names = new Set<string>();
  const decoder = new TextDecoder();
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) return false;
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if (uncompressed > 20 * 1024 * 1024) return false;
    expanded += uncompressed;
    if (expanded > 80 * 1024 * 1024) return false;
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    names.add(name);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return names.has("mimetype") && names.has("META-INF/container.xml") && [...names].some((name) => name.endsWith(".opf"));
}

export async function validateBookFile(file: File): Promise<{ type: UploadedBookType } | { error: string }> {
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length || bytes.length > BOOK_UPLOAD_LIMIT) return { error: "Choose a non-empty book file smaller than 4 MB." };

  if (name.endsWith(".pdf")) {
    const signature = new TextDecoder().decode(bytes.subarray(0, 5));
    const tail = new TextDecoder().decode(bytes.subarray(Math.max(0, bytes.length - 2048)));
    if (signature !== "%PDF-" || !tail.includes("%%EOF")) return { error: "This file does not appear to be a complete PDF." };
    if (file.type && file.type !== "application/pdf" && file.type !== "application/octet-stream") return { error: "The file type does not match its PDF extension." };
    return { type: "pdf" };
  }

  if (name.endsWith(".epub")) {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || !zipHasSafeExpandedSize(bytes)) return { error: "This file is not a valid EPUB archive." };
    if (file.type && file.type !== "application/epub+zip" && file.type !== "application/zip" && file.type !== "application/octet-stream") return { error: "The file type does not match its EPUB extension." };
    try {
      const contents = unzipSync(bytes, { filter: (file) => ["mimetype", "META-INF/container.xml"].includes(file.name) || file.name.endsWith(".opf") });
      const mime = contents.mimetype && new TextDecoder().decode(contents.mimetype);
      const container = contents["META-INF/container.xml"] && new TextDecoder().decode(contents["META-INF/container.xml"]);
      if (mime !== "application/epub+zip" || !container?.includes("full-path") || !Object.keys(contents).some((path) => path.endsWith(".opf"))) return { error: "This EPUB is missing its required book metadata." };
    } catch {
      return { error: "This EPUB archive is damaged or cannot be opened." };
    }
    return { type: "epub" };
  }
  return { error: "Only PDF and EPUB books are supported." };
}
