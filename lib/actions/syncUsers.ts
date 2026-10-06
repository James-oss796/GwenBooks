"use server";

import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

/**
 * Syncs Google-authenticated users into the Neon + Drizzle "users" table.
 */
export async function syncGoogleUser(email: string, fullName?: string) {
  if (!email) return null;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(users).values({
        fullName: fullName || "Google User",
        email: normalizedEmail,
        password: await hash(randomBytes(48).toString("hex"), 10),
        status: "APPROVED",
        role: "USER",
      }).returning();
    return created ?? null;
  } catch (err) {
    console.error("syncGoogleUser failed:", err);
    return null;
  }
}
