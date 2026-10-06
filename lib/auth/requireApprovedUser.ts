import { auth } from "@/auth";
import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";

export async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };

  const [account] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (account?.status !== "APPROVED") return { ok: false as const, status: 403 as const };
  return { ok: true as const, userId: session.user.id };
}
