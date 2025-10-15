

"use server";

import { hash, compare } from "bcryptjs";
import { signIn } from "@/auth";
import { randomBytes, createHash } from "crypto";
import redis from "@/DATABASE/redis";
import { headers } from "next/headers";
import { db } from "@/DATABASE/drizzle";
import ratelimit from "@/lib/ratelimit";
import { sendEmail } from "@/lib/mailer";
import { users, passwordResetTokens } from "@/DATABASE/schema";
import { sql, and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { resetPasswordEmailTemplate } from "@/lib/email-templates/resetPassword";
import { verificationEmailTemplate } from "@/lib/email-templates/verification"; // ✅ custom verification email template

export type AuthCredentials = {
  fullName: string;
  email: string;
  password: string;
  universityId: number;
  universityCard: string;
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

  if (existingUser.length > 0)
    return { success: false, error: "User already exists" };

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
      universityCard,
      status: "PENDING",
    }satisfies typeof users.$inferInsert
  );

    // ✅ Create 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Store verification code in Redis (expires in 10 mins)
    await redis.set(`verify:${email}`, verificationCode, { ex: 600 });

    // ✅ Send verification email
    const { subject, text, html } = verificationEmailTemplate(verificationCode);
    await sendEmail({ to: email, subject, text, html });

    return { success: true, message: "Verification code sent to your email." };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Signup error" };
  }
};

/* ---------------- VERIFY CODE ---------------- */
export const verifyCode = async (email: string, code: string) => {
  try {
    // ✅ Get stored code from Redis
    const storedCode = await redis.get(`verify:${email}`);

    if (!storedCode)
      return { success: false, error: "Verification code expired." };

    if (storedCode !== code)
      return { success: false, error: "Invalid verification code." };

    // ✅ Update user status
    await db
      .update(users)
      .set({ status: "APPROVED" })
      .where(eq(users.email, email));

    // ✅ Delete code from Redis
    await redis.del(`verify:${email}`);

    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: "Verification failed" };
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */
export const requestPasswordReset = async (email: string) => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length === 0) {
    return { success: false, error: "No account found" };
  }

  const token = randomBytes(32).toString("hex");
  await redis.set(`reset:${token}`, email, { ex: 600 });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const { subject, text, html } = resetPasswordEmailTemplate(resetLink);
  await sendEmail({ to: email, subject, text, html });

  return { success: true };
};

/* ---------------- RESET PASSWORD ---------------- */
const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

export const resetPassword = async ({
  token,
  newPassword,
}: {
  token: string;
  newPassword: string;
}) => {
  const tokenHash = hashToken(token);

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
  const hashedPassword = await hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, tokenRow.userId));

  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, tokenRow.id));

  return { success: true };
};
