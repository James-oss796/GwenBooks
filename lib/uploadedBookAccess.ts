import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { uploaded_books, users } from "@/DATABASE/schema";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "books";
let privateBucketReady = false;

export async function ensurePrivateBookBucket() {
  if (privateBucketReady) return null;
  const { error } = await supabaseAdmin.storage.updateBucket(BUCKET, {
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "application/epub+zip"],
  });
  if (!error) privateBucketReady = true;
  return error;
}

function getStoragePath(record: typeof uploaded_books.$inferSelect) {
  if (record.storagePath) return record.storagePath;
  if (!record.fileUrl) return null;
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  try {
    const url = new URL(record.fileUrl);
    if (url.origin !== new URL(base).origin) return null;
    const marker = "/storage/v1/object/public/books/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function getUploadedBookForViewer(bookId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthenticated" as const };
  const [viewer] = await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!viewer || viewer.status !== "APPROVED") return { error: "forbidden" as const };
  const [book] = await db.select().from(uploaded_books).where(eq(uploaded_books.id, bookId)).limit(1);
  if (!book) return { error: "not_found" as const };
  const isOwner = book.uploaderId === viewer.id;
  const isPublic = book.status === "APPROVED" && book.isPublic === true;
  const isAdmin = viewer.role === "ADMIN";
  if (!isOwner && !isAdmin && !isPublic) return { error: "not_found" as const };
  const storagePath = getStoragePath(book);
  if (!storagePath) return { error: "file_missing" as const };
  return { book, storagePath, viewerId: viewer.id, isOwner };
}

export async function getUploadedBookFile(bookId: number) {
  const access = await getUploadedBookForViewer(bookId);
  if ("error" in access) return access;
  const bucketError = await ensurePrivateBookBucket();
  if (bucketError) return { error: "storage_unavailable" as const };
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(access.storagePath);
  if (error || !data) return { error: "file_missing" as const };
  return { ...access, data };
}
