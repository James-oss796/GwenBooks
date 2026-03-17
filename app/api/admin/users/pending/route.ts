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

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const pending = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.status, "PENDING"))
    .orderBy(users.createdAt);

  return NextResponse.json({ pending });
}

