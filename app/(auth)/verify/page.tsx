"use client";

import { useState } from "react";
import { verifyCode } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await verifyCode(email, code);
      if (res.success) {
        setMessage("✅ Email verified! You can now sign in.");
      } else {
        setMessage("❌ Invalid or expired code.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Something went wrong. Try again.");
    } finally {
      setVerifying(false);
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

        <Button
          type="submit"
          loading={verifying}
          disabled={verifying}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {verifying ? "Verifying..." : "Verify"}
        </Button>

        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  );
}
