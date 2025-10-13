"use client";

import { useState } from "react";
import { verifyCode } from "@/lib/actions/auth";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyCode({ email, code });
      if (res.success) {
        setMessage("✅ Email verified! You can now sign in.");
      } else {
        setMessage("❌ Invalid or expired code.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Something went wrong. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-80 p-4 border rounded">
        <h1 className="text-xl font-bold mb-4">Verify Email</h1>

        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 mb-2"
          required
        />

        <input
          type="text"
          placeholder="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border p-2 mb-2"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Verify
        </button>

        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  );
}
