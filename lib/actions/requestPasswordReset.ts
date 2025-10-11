"use server";

import { db } from "@/DATABASE/drizzle";
import { users, passwordResetTokens } from "@/DATABASE/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// 🧩 Helper: hash token
function hashToken(token: string) {
  return bcrypt.hashSync(token, 10);
}

export async function requestPasswordReset(email: string) {
  // 1️⃣ Find user
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user.length === 0) return { success: false, error: "No account with that email" };

  const userId = user[0].id;

  // 2️⃣ Generate reset token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // 3️⃣ Set expiration (15 minutes)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // 4️⃣ Store in database
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
    used: false,
  });

  // 5️⃣ Create reset link
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  // 6️⃣ Setup Nodemailer (using Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 7️⃣ Send the reset email
  const mailOptions = {
    from: `"University Library" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your University Library password",
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to set a new password (expires in 15 minutes):</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  };

  await transporter.sendMail(mailOptions);

  console.log(`Password reset link sent to ${email}`);
  return { success: true };
}
