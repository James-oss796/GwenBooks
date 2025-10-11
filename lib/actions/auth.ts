"use server";

import { hash} from "bcryptjs";
import { signIn } from "@/auth";
import {randomBytes} from "crypto";
import { createHash } from "crypto";
import redis from "@/DATABASE/redis";
import { headers } from "next/headers";
import { db } from "@/DATABASE/drizzle";
import ratelimit from "@/lib/ratelimit";
import { sendEmail } from "@/lib/mailer";
import { users } from "@/DATABASE/schema";
import { sql, and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { passwordResetTokens } from "@/DATABASE/schema";
import  {resetPasswordEmailTemplate}  from "@/lib/email-templates/resetPassword";

export type AuthCredentials = {
  fullName?: string;         // only needed for signup
  email: string;
  password: string;
  universityId?: string;     // optional for signup
  universityCard?: string;   // optional for signup
};

/* ---------------- SIGN IN ---------------- */
export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">
) => {
  const { email, password } = params;
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) return redirect("/too-fast");

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Sign in error" };
  }
};

/* ---------------- SIGN UP ---------------- */
export const signUp = async (params: AuthCredentials) => {
  const { fullName, email, universityId, password, universityCard } = params;
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) return redirect("/too-fast");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) return { success: false, error: "User already exists" };

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
      universityCard,
      status: "PENDING",
    });
    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Signup error" };
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */
export const requestPasswordReset = async (email: string) => {
  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length === 0) {
    return { success: false, error: "No account found" };
  }

  // Create a unique token
  const token = randomBytes(32).toString("hex");

  // Save token in Redis with expiry (10 minutes)
  await redis.set(`reset:${token}`, email, { ex: 600 });

  // Create a secure password reset link
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  // Generate email content
  const { subject, text, html } = resetPasswordEmailTemplate(resetLink);

  // Send email
  await sendEmail({ to: email, subject, text, html });

  return { success: true };
};

const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};


/* ---------------- RESET PASSWORD (USING LINK TOKEN) ---------------- */

export const resetPassword = async ({
  token,
  newPassword,
}: {
  token: string;
  newPassword: string;
}) => {
  // Hash the token using the same method used when creating it
  const tokenHash = await hashToken(token);

  // Find token record and ensure it’s valid and not expired
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        sql`${passwordResetTokens.expiresAt} > now()`,
        eq(passwordResetTokens.used, false)
      )
    )
    .limit(1);

  if (!rows.length) {
    return { success: false, error: "Invalid or expired reset link" };
  }

  const tokenRow = rows[0];

  // Hash the new password
  const hashedPassword = await hash(newPassword, 10);

  // Update user's password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, tokenRow.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, tokenRow.id));

  return { success: true };
};
