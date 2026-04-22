"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type PendingUser = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string | null;
};

export const dynamic = "force-dynamic";

export default function AccountRequestsPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/pending", { cache: "no-store" });
      const data = await res.json();
      setPending(Array.isArray(data.pending) ? data.pending : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/users/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data?.error || "Action failed");
      return;
    }
    toast.success(action === "approve" ? "User approved" : "User rejected");
    setPending((p) => p.filter((u) => u.id !== id));
  }

  return (
    <main className="max-w-6xl mx-auto py-10 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-700">Account Requests</h1>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading…</p>
      ) : pending.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No pending account requests 🎉</p>
      ) : (
        <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-500 text-sm border-b">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{u.fullName}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => act(u.id, "approve")}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => act(u.id, "reject")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

