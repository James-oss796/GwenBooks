"use client";
import React, { useEffect, useState } from "react";
import BookList from "@/components/BookList"; // re-use your BookList component
import { Button } from "@/components/ui/button";

export default function MyUploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/user/books/upload");
      const data = await res.json();
      setUploads(data.uploads || []);
    })();
  }, []);

  const pending = uploads.filter((u) => u.status === "PENDING");
  const approved = uploads.filter((u) => u.status === "APPROVED");

  return (
    <main className="min-h-screen p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">My uploads</h1>
        <Button onClick={() => (window.location.href = "/users/upload")}>Upload new</Button>
      </header>

      <section className="bg-white shadow-md border border-gray-200 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-medium mb-2">Pending approval</h2>
        {pending.length === 0 ? (
          <div className="text-sm text-gray-500">No pending uploads</div>
        ) : (
          <BookList books={pending} title="" />
        )}
      </section>

      <section className="bg-white shadow-md border border-gray-200 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-medium mb-2">Approved</h2>
        {approved.length === 0 ? (
          <div className="text-sm text-gray-500">No approved uploads yet</div>
        ) : (
          <BookList books={approved} title="" />
        )}
      </section>
    </main>
  );
}
