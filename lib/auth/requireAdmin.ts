import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };

  const [user] = await db
    .select({ role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "ADMIN" || user.status !== "APPROVED") return { ok: false as const, status: 403 as const };
  return { ok: true as const };
}
