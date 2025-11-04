"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ApprovalsPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch pending uploads
  useEffect(() => {
    const fetchBooks = async () => {
      const res = await fetch("/api/books/pending");
      const data = await res.json();
      setBooks(data.books || []);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const handleAction = async (bookId: number, action: "approved" | "rejected") => {
    const res = await fetch(`/api/books/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookId }),
    });

    const data = await res.json();

    if (res.ok) {
      toast({
        title: action === "approved" ? "✅ Approved" : "❌ Rejected",
        description: `Book has been ${action}.`,
      });
      setBooks(books.filter((b) => b.id !== bookId));
    } else {
      toast({
        title: "Error",
        description: data.error || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (!books.length)
    return <p className="text-center mt-10 text-gray-500">No pending books found ✅</p>;

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Pending Book Approvals</h1>

      <div className="grid gap-4">
        {books.map((book) => (
          <Card key={book.id}>
            <CardHeader>
              <CardTitle>{book.title}</CardTitle>
              <CardDescription>
                Uploaded by: {book.uploader_name || "Unknown"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-gray-600">{book.description}</p>
              <div className="flex justify-between items-center">
                <Badge variant="secondary">{book.genre || "General"}</Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAction(book.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction(book.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
