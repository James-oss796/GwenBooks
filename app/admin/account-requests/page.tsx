"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ButtonSpinner } from "@/components/ui/button";

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
  const [actingOn, setActingOn] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

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
    setActingOn({ id, action });
    try {
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
    } catch {
      toast.error("Action failed. Check your connection and try again.");
    } finally {
      setActingOn(null);
    }
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
                        disabled={actingOn?.id === u.id}
                        aria-busy={actingOn?.id === u.id && actingOn.action === "approve"}
                        className="relative inline-flex min-w-24 items-center justify-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
                      >
                        {actingOn?.id === u.id && actingOn.action === "approve" && <span className="absolute inset-0 flex items-center justify-center"><ButtonSpinner /></span>}
                        <span className={actingOn?.id === u.id && actingOn.action === "approve" ? "opacity-0" : ""}>Approve</span>
                      </button>
                      <button
                        onClick={() => act(u.id, "reject")}
                        disabled={actingOn?.id === u.id}
                        aria-busy={actingOn?.id === u.id && actingOn.action === "reject"}
                        className="relative inline-flex min-w-24 items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
                      >
                        {actingOn?.id === u.id && actingOn.action === "reject" && <span className="absolute inset-0 flex items-center justify-center"><ButtonSpinner /></span>}
                        <span className={actingOn?.id === u.id && actingOn.action === "reject" ? "opacity-0" : ""}>Reject</span>
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

