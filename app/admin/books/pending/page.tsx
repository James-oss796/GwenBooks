// simple client page; fetch list of pending uploads and add Approve/Reject buttons
"use client";
import React, { useEffect, useState } from "react";

export default function PendingApprovals() {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/books/pending");
      const data = await res.json();
      setPending(data.pending || []);
    })();
  }, []);

  const doAction = async (id: number, action: "APPROVE" | "REJECT") => {
    const note = action === "REJECT" ? prompt("Reason for rejection (optional)") : "";
    const res = await fetch(`/api/admin/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action, adminNote: note }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setPending((p) => p.filter((x) => x.id !== id));
      alert(`${action} successful`);
    } else {
      alert("Failed");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Pending uploads</h1>
      {pending.length === 0 && <div>No pending uploads</div>}
      <div className="grid gap-4">
        {pending.map((b) => (
          <div key={b.id} className="border p-4 rounded-lg flex gap-4 items-start">
            <img src={b.coverUrl || "/placeholder-book.jpg"} alt={b.title} className="w-24 h-32 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-medium">{b.title}</h3>
              <p className="text-sm text-gray-500">By {b.author}</p>
              <p className="text-sm mt-2">{b.description}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => doAction(b.id, "APPROVE")} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                <button onClick={() => doAction(b.id, "REJECT")} className="px-3 py-1 rounded bg-red-600 text-white">Reject</button>
                <a target="_blank" href={b.fileUrl} className="px-3 py-1 rounded bg-gray-100">Preview file</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
