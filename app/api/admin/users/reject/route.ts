import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, status: 401, error: "Unauthorized" };

  const row = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (row[0]?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const };
}

async function readId(req: Request): Promise<string | null> {
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      return typeof body?.id === "string" ? body.id : null;
    }
    const form = await req.formData();
    const id = form.get("id");
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const id = await readId(req);
  if (!id) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

  await db.update(users).set({ status: "REJECTED" }).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}

