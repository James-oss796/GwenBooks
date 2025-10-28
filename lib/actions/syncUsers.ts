"use server";

import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";

/**
 * Syncs Google-authenticated users into the Neon + Drizzle "users" table.
 */
export async function syncGoogleUser(email: string, fullName?: string) {
  if (!email) return;

  try {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing.length === 0) {
      await db.insert(users).values({
        fullName: fullName || "Google User",
        email,
        password: "google-oauth", // placeholder
        status: "ACTIVE",
        role: "USER",
      });
    }
  } catch (err) {
    console.error("syncGoogleUser failed:", err);
  }
}
